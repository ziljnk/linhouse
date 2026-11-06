import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  HOME_PRODUCT_CAROUSEL_LIMIT,
  homeProductCarouselTitleKey,
  homeProductCarouselVersion,
  parseHomeProductCarouselSave,
  readHomeProductCarouselTitle,
} from "./home-product-carousels"

const PRODUCT_A = "11111111-1111-4111-8111-111111111111"
const PRODUCT_B = "22222222-2222-4222-8222-222222222222"

describe("home product carousels", () => {
  it("stores a title key per slot", () => {
    assert.equal(homeProductCarouselTitleKey(1), "home.productCarousel.1.title")
    assert.equal(homeProductCarouselTitleKey(2), "home.productCarousel.2.title")
  })

  it("reads localized titles and ignores other shapes", () => {
    assert.deepEqual(readHomeProductCarouselTitle({ vi: "Váy cưới", en: "Gowns" }), {
      vi: "Váy cưới",
      en: "Gowns",
    })
    assert.deepEqual(readHomeProductCarouselTitle(null), { vi: "", en: "" })
  })

  it("versions title and product order together", () => {
    const first = homeProductCarouselVersion({
      titleVi: "Váy",
      titleEn: "Gowns",
      ids: [PRODUCT_A, PRODUCT_B],
    })
    const reordered = homeProductCarouselVersion({
      titleVi: "Váy",
      titleEn: "Gowns",
      ids: [PRODUCT_B, PRODUCT_A],
    })
    assert.notEqual(first, reordered)
  })

  it("rejects an oversized product list, duplicates, and a long title", () => {
    const tooMany = parseHomeProductCarouselSave({
      slot: 1,
      titleVi: "Váy",
      titleEn: "",
      ids: Array.from({ length: HOME_PRODUCT_CAROUSEL_LIMIT + 1 }, () => PRODUCT_A),
      version: "v",
    })
    assert.equal(tooMany.ok, false)

    const duplicate = parseHomeProductCarouselSave({
      slot: 2,
      titleVi: "Áo dài",
      titleEn: "Ao dai",
      ids: [PRODUCT_A, PRODUCT_A],
      version: "v",
    })
    assert.equal(duplicate.ok, false)

    const longTitle = parseHomeProductCarouselSave({
      slot: 1,
      titleVi: "a".repeat(121),
      titleEn: "",
      ids: [],
      version: "v",
    })
    assert.equal(longTitle.ok, false)
  })

  it("accepts a title and an ordered product list", () => {
    const parsed = parseHomeProductCarouselSave({
      slot: 1,
      titleVi: "  Váy cưới  ",
      titleEn: "Bridal gowns",
      ids: [PRODUCT_A, PRODUCT_B],
      version: "stored",
    })
    assert.equal(parsed.ok, true)
    if (!parsed.ok) return
    assert.equal(parsed.titleVi, "Váy cưới")
    assert.deepEqual(parsed.ids, [PRODUCT_A, PRODUCT_B])
  })
})
