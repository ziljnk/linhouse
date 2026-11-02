import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, it } from "node:test"
import { SITE_ORIGIN } from "./seo"
import { buildShareLink, shareCampaignSlug } from "./share-link"

function urlFor(target: string, platform: "facebook" | "tiktok" | "instagram" | "zalo" | "youtube", campaign = "") {
  const result = buildShareLink({ target, platform, campaign })
  if (!result.ok) throw new Error(result.error)
  assert.equal(new URL(result.url).origin, SITE_ORIGIN)
  return result.url
}

describe("share link builder", () => {
  it("defaults a blank target to the Vietnamese storefront homepage", () => {
    assert.equal(
      urlFor("  ", "facebook"),
      "https://linhouse.com.vn/vi?utm_source=facebook&utm_medium=social"
    )
  })

  it("keeps existing query params and replaces utm params", () => {
    const url = urlFor(
      "https://linhouse.com.vn/vi/product/luna?color=ivory&utm_source=old&utm_medium=email&utm_campaign=old&UTM_CONTENT=drop&ref=story",
      "zalo",
      "BST Cưới 2026!"
    )
    const parsed = new URL(url)
    assert.equal(parsed.origin, "https://linhouse.com.vn")
    assert.equal(parsed.pathname, "/vi/product/luna")
    assert.equal(parsed.searchParams.get("color"), "ivory")
    assert.equal(parsed.searchParams.get("ref"), "story")
    assert.equal(parsed.searchParams.get("utm_source"), "zalo")
    assert.equal(parsed.searchParams.get("utm_medium"), "social")
    assert.equal(parsed.searchParams.get("utm_campaign"), "bst-cuoi-2026")
    assert.equal(parsed.searchParams.get("utm_content"), null)
    assert.equal(parsed.searchParams.get("UTM_CONTENT"), null)
  })

  it("accepts a locale path or http URL and always emits the configured origin", () => {
    assert.equal(
      urlFor("/en/blog/atelier", "instagram"),
      "https://linhouse.com.vn/en/blog/atelier?utm_source=instagram&utm_medium=social"
    )
    assert.equal(
      urlFor("http://linhouse.com.vn/en/", "tiktok"),
      "https://linhouse.com.vn/en?utm_source=tiktok&utm_medium=social"
    )
  })

  it("omits a campaign that does not slugify", () => {
    assert.equal(shareCampaignSlug("!!!"), "")
    assert.equal(
      urlFor("/vi", "youtube", "!!!"),
      "https://linhouse.com.vn/vi?utm_source=youtube&utm_medium=social"
    )
  })

  it("preserves a hash without putting it in the query", () => {
    const url = urlFor("https://linhouse.com.vn/vi/product/luna#size", "facebook")
    assert.equal(
      url,
      "https://linhouse.com.vn/vi/product/luna?utm_source=facebook&utm_medium=social#size"
    )
  })

  it("rejects other domains, admin hosts, and paths outside /vi or /en", () => {
    const rejected = [
      "https://evil.com/vi",
      "https://admin.linhouse.com.vn/vi",
      "https://www.linhouse.com.vn/vi",
      "https://linhouse.com.vn:8443/vi",
      "https://user:pass@linhouse.com.vn/vi",
      "http://localhost:3000/vi",
      "//evil.com/vi",
      "/admin",
      "/video",
      "https://linhouse.com.vn/about",
      "javascript:alert(1)",
      "not a path",
    ]

    for (const target of rejected) {
      const result = buildShareLink({ target, platform: "facebook" })
      assert.equal(result.ok, false, target)
    }
  })
})

describe("canonical and sitemap", () => {
  it("does not append utm params when building public URLs", () => {
    const metadata = readFileSync(
      join(process.cwd(), "lib/storefront-metadata.ts"),
      "utf8"
    )
    const sitemap = readFileSync(join(process.cwd(), "app/sitemap.ts"), "utf8")
    assert.doesNotMatch(metadata, /utm_/)
    assert.doesNotMatch(sitemap, /utm_/)
    assert.match(
      metadata,
      /const canonical = `\$\{SITE_ORIGIN\}\$\{localePath\(locale, path\)\}`/
    )
  })
})
