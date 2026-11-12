import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  PROMOTION_IMAGE_MAX_BYTES,
  isPromotionPopupVisible,
  parsePromotionDate,
  parsePromotionLink,
  promotionDateOrderError,
  promotionEndInstant,
  promotionPopupStatus,
  promotionStartInstant,
  validatePromotionImage,
  validatePromotionImageFile,
} from "./promotion-popup"

function imageReason(result: ReturnType<typeof validatePromotionImage>) {
  return result.ok ? "ok" : result.reason
}

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0])
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const WEBP = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
])
const GIF = new TextEncoder().encode("GIF89a")
const SVG = new TextEncoder().encode(
  '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
)
const AVIF = new Uint8Array([
  0, 0, 0, 32, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66, 0, 0, 0, 0,
])

describe("promotion popup date window", () => {
  const window = {
    enabled: true,
    startsOn: "2026-11-01",
    endsOn: "2026-11-30",
  }

  it("treats the start and end as inclusive Asia/Ho_Chi_Minh calendar days", () => {
    assert.equal(
      promotionStartInstant("2026-11-01")?.toISOString(),
      "2026-10-31T17:00:00.000Z"
    )
    assert.equal(
      promotionEndInstant("2026-11-30")?.toISOString(),
      "2026-11-30T16:59:59.999Z"
    )

    assert.equal(
      promotionPopupStatus(window, new Date("2026-10-31T16:59:59.999Z")),
      "scheduled"
    )
    assert.equal(
      promotionPopupStatus(window, new Date("2026-10-31T17:00:00.000Z")),
      "live"
    )
    assert.equal(
      isPromotionPopupVisible(window, new Date("2026-11-15T03:00:00.000Z")),
      true
    )
    assert.equal(
      promotionPopupStatus(window, new Date("2026-11-30T16:59:59.999Z")),
      "live"
    )
    assert.equal(
      promotionPopupStatus(window, new Date("2026-11-30T17:00:00.000Z")),
      "off"
    )
  })

  it("starts immediately when there is no start date and never expires without an end date", () => {
    assert.equal(
      promotionPopupStatus(
        { enabled: true, startsOn: null, endsOn: "2026-11-30" },
        new Date("2020-01-01T00:00:00.000Z")
      ),
      "live"
    )
    assert.equal(
      promotionPopupStatus(
        { enabled: true, startsOn: "2026-11-01", endsOn: null },
        new Date("2030-01-01T00:00:00.000Z")
      ),
      "live"
    )
    assert.equal(
      promotionPopupStatus(
        { enabled: true, startsOn: null, endsOn: null },
        new Date("2026-11-12T00:00:00.000Z")
      ),
      "live"
    )
  })

  it("stays off when disabled, and scheduled only before a future start", () => {
    assert.equal(
      promotionPopupStatus(
        { enabled: false, startsOn: null, endsOn: null },
        new Date("2026-11-12T00:00:00.000Z")
      ),
      "off"
    )
    assert.equal(
      promotionPopupStatus(
        { enabled: false, startsOn: "2026-11-01", endsOn: "2026-11-30" },
        new Date("2026-11-12T00:00:00.000Z")
      ),
      "off"
    )
    assert.equal(
      promotionPopupStatus(
        { enabled: true, startsOn: "2026-12-01", endsOn: null },
        new Date("2026-11-12T00:00:00.000Z")
      ),
      "scheduled"
    )
  })

  it("rejects impossible calendar dates and a start after the end", () => {
    assert.deepEqual(parsePromotionDate(""), { ok: true, date: null })
    assert.deepEqual(parsePromotionDate("2026-11-01"), {
      ok: true,
      date: "2026-11-01",
    })
    assert.deepEqual(parsePromotionDate("2026-02-31"), { ok: false })
    assert.deepEqual(parsePromotionDate("01/11/2026"), { ok: false })
    assert.equal(promotionStartInstant("2026-02-31"), null)
    assert.equal(promotionDateOrderError("2026-11-01", "2026-11-01"), null)
    assert.equal(promotionDateOrderError(null, "2026-11-30"), null)
    assert.match(
      promotionDateOrderError("2026-12-02", "2026-12-01") ?? "",
      /trước hoặc trùng/
    )
  })
})

describe("promotion popup https links", () => {
  it("accepts an empty link and https URLs", () => {
    assert.deepEqual(parsePromotionLink("  "), { ok: true, url: null })
    assert.deepEqual(parsePromotionLink(null), { ok: true, url: null })
    assert.deepEqual(parsePromotionLink("  https://linhouse.com.vn/vi  "), {
      ok: true,
      url: "https://linhouse.com.vn/vi",
    })
    assert.equal(parsePromotionLink("HTTPS://linhouse.com.vn/sale").ok, true)
  })

  it("rejects non-https schemes, including javascript:", () => {
    for (const value of [
      "javascript:alert(1)",
      "JAVASCRIPT:alert(document.cookie)",
      "http://linhouse.com.vn",
      "data:text/html,hi",
      "mailto:studio@linhouse.com.vn",
      "ftp://files.linhouse.com.vn/promo.jpg",
      "//linhouse.com.vn/vi",
      "/vi",
      "https://",
      "not a url",
    ]) {
      const result = parsePromotionLink(value)
      assert.equal(result.ok, false, value)
    }
  })
})

describe("promotion popup file type", () => {
  it("accepts jpeg, png, and webp within 5MB and checks the real bytes", () => {
    assert.equal(
      validatePromotionImage({ size: 128, declaredType: "image/jpeg", header: JPEG }).ok,
      true
    )
    assert.equal(
      validatePromotionImage({ size: 128, declaredType: "image/png", header: PNG }).ok,
      true
    )
    assert.equal(
      validatePromotionImage({ size: PROMOTION_IMAGE_MAX_BYTES, declaredType: "", header: WEBP })
        .ok,
      true
    )
    assert.deepEqual(
      validatePromotionImage({ size: 128, declaredType: "image/jpeg", header: PNG }),
      { ok: false, reason: "content" }
    )
  })

  it("rejects svg, gif, avif, and files over 5MB", () => {
    assert.equal(
      imageReason(
        validatePromotionImage({ size: 128, declaredType: "image/svg+xml", header: SVG })
      ),
      "type"
    )
    assert.equal(
      imageReason(validatePromotionImage({ size: 128, declaredType: "image/jpeg", header: SVG })),
      "type"
    )
    assert.equal(
      imageReason(validatePromotionImage({ size: 128, declaredType: "image/gif", header: GIF })),
      "type"
    )
    assert.equal(
      imageReason(validatePromotionImage({ size: 128, declaredType: "image/avif", header: AVIF })),
      "type"
    )
    assert.equal(
      imageReason(
        validatePromotionImage({
          size: PROMOTION_IMAGE_MAX_BYTES + 1,
          declaredType: "image/jpeg",
          header: JPEG,
        })
      ),
      "size"
    )
    assert.equal(
      imageReason(validatePromotionImage({ size: 0, declaredType: "image/jpeg", header: JPEG })),
      "size"
    )
  })

  it("reads a File header before accepting it", async () => {
    const file = new File([JPEG], "uu-dai.jpg", { type: "image/jpeg" })
    const result = await validatePromotionImageFile(file)
    assert.equal(result.ok, true)

    const svg = new File([SVG], "popup.svg", { type: "image/svg+xml" })
    const rejected = await validatePromotionImageFile(svg)
    assert.equal(rejected.ok, false)
    if (!rejected.ok) assert.equal(rejected.reason, "type")
  })
})
