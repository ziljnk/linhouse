import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { SITE_ORIGIN } from "./seo"
import { productCanonicalUrl, productShareDescription } from "./product-url"

describe("product canonical url", () => {
  it("copies a clean absolute url with no tracking parameters", () => {
    const url = productCanonicalUrl("vi", "vow")
    const parsed = new URL(url)

    assert.equal(url, "https://linhouse.com.vn/vi/product/vow")
    assert.equal(parsed.origin, SITE_ORIGIN)
    assert.equal(parsed.pathname, "/vi/product/vow")
    assert.equal(parsed.search, "")
    assert.equal(parsed.hash, "")
  })

  it("keeps the locale path and drops query or hash characters in the slug", () => {
    const english = new URL(productCanonicalUrl("en", "ivory"))
    assert.equal(english.toString(), "https://linhouse.com.vn/en/product/ivory")

    const tracked = new URL(productCanonicalUrl("vi", "vow?utm_source=facebook&utm_medium=social"))
    assert.equal(tracked.origin, SITE_ORIGIN)
    assert.equal(tracked.pathname, "/vi/product/vow")
    assert.equal(tracked.search, "")

    const hashed = new URL(productCanonicalUrl("en", "ivory#details"))
    assert.equal(hashed.toString(), "https://linhouse.com.vn/en/product/ivory")
    assert.equal(hashed.hash, "")
  })
})

describe("product share description", () => {
  it("prefers the seo description, then the product description, then the title", () => {
    assert.equal(
      productShareDescription({
        seoDescription: "  SEO line  ",
        description: "Product story",
        title: "Vow",
      }),
      "SEO line"
    )
    assert.equal(
      productShareDescription({
        seoDescription: " ",
        description: "<p>Silk column.</p>",
        title: "Vow",
      }),
      "Silk column."
    )
    assert.equal(
      productShareDescription({
        description: "   ",
        title: "Vow",
      }),
      "Vow"
    )
  })
})
