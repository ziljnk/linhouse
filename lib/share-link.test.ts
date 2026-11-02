import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, it } from "node:test"
import { SITE_ORIGIN } from "./seo"
import { SHARE_PLATFORMS, shareHomepageLink } from "./share-link"

describe("share homepage links", () => {
  it("copies the Vietnamese homepage with only source and medium", () => {
    assert.deepEqual(
      SHARE_PLATFORMS.map((platform) => platform.id),
      [
        "facebook",
        "messenger",
        "instagram",
        "threads",
        "tiktok",
        "zalo",
        "youtube",
        "pinterest",
      ]
    )

    const expected = {
      facebook: "https://linhouse.com.vn/vi?utm_source=facebook&utm_medium=social",
      messenger: "https://linhouse.com.vn/vi?utm_source=messenger&utm_medium=social",
      instagram: "https://linhouse.com.vn/vi?utm_source=instagram&utm_medium=social",
      threads: "https://linhouse.com.vn/vi?utm_source=threads&utm_medium=social",
      tiktok: "https://linhouse.com.vn/vi?utm_source=tiktok&utm_medium=social",
      zalo: "https://linhouse.com.vn/vi?utm_source=zalo&utm_medium=social",
      youtube: "https://linhouse.com.vn/vi?utm_source=youtube&utm_medium=social",
      pinterest: "https://linhouse.com.vn/vi?utm_source=pinterest&utm_medium=social",
    } as const

    for (const platform of SHARE_PLATFORMS) {
      const url = shareHomepageLink(platform.id)
      const parsed = new URL(url)
      assert.equal(url, expected[platform.id])
      assert.equal(parsed.origin, SITE_ORIGIN)
      assert.equal(parsed.pathname, "/vi")
      assert.equal(parsed.searchParams.get("utm_campaign"), null)
      assert.equal([...parsed.searchParams.keys()].join(","), "utm_source,utm_medium")
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
