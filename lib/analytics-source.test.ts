import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { analyticsReferrerLabel } from "./admin-analytics"
import {
  firstTouchUtmSource,
  referrerHostFrom,
  resolvePageviewReferrerHost,
} from "./analytics-source"

describe("utm source allowlist", () => {
  it("maps known sources and aliases onto canonical hosts", () => {
    const cases: Array<[string, string]> = [
      ["facebook", "facebook.com"],
      ["fb", "facebook.com"],
      ["  Facebook ", "facebook.com"],
      ["instagram", "instagram.com"],
      ["ig", "instagram.com"],
      ["tiktok", "tiktok.com"],
      ["zalo", "zalo.me"],
      ["youtube", "youtube.com"],
      ["yt", "youtube.com"],
      ["messenger", "messenger.com"],
      ["  Threads ", "threads.net"],
      ["pinterest", "pinterest.com"],
    ]

    for (const [source, host] of cases) {
      assert.equal(
        resolvePageviewReferrerHost({
          source,
          referrer: "https://news.example/story",
          siteHost: "linhouse.com.vn",
        }),
        host
      )
    }
  })

  it("ignores values outside the allowlist and falls back to the referrer", () => {
    const rejected = [
      "google",
      "newsletter",
      "facebook.com",
      "zalo.me",
      "",
      "   ",
      "a".repeat(41),
      "facebook script",
      "fb/../admin",
      "youtube.com",
      "messenger.com",
      "threads.net",
      "pin.it",
    ]

    for (const source of rejected) {
      assert.equal(
        resolvePageviewReferrerHost({
          source,
          referrer: "https://news.example/story",
          siteHost: "linhouse.com.vn",
        }),
        "news.example"
      )
    }

    assert.equal(
      resolvePageviewReferrerHost({
        source: 12,
        referrer: "",
        siteHost: "linhouse.com.vn",
      }),
      "(direct)"
    )
  })

  it("keeps the first valid source in a visit", () => {
    assert.equal(firstTouchUtmSource("facebook", "tiktok"), "facebook")
    assert.equal(firstTouchUtmSource("fb", null), "facebook")
    assert.equal(firstTouchUtmSource("ig", "yt"), "instagram")
    assert.equal(firstTouchUtmSource("newsletter", "yt"), "youtube")
    assert.equal(firstTouchUtmSource(null, "google"), null)
    assert.equal(firstTouchUtmSource(" Facebook ", null), "facebook")
  })
})

describe("referrer hosts", () => {
  it("folds known in-app subdomains onto the parent host", () => {
    const cases: Array<[string, string]> = [
      ["https://l.facebook.com/l.php", "facebook.com"],
      ["https://m.facebook.com/", "facebook.com"],
      ["https://lm.facebook.com/l.php", "facebook.com"],
      ["https://www.facebook.com/linhouse", "facebook.com"],
      ["https://l.instagram.com/", "instagram.com"],
      ["https://vm.tiktok.com/abc", "tiktok.com"],
      ["https://m.tiktok.com/@linhouse", "tiktok.com"],
      ["https://www.youtube.com/watch?v=1", "youtube.com"],
      ["https://l.messenger.com/l.php", "messenger.com"],
      ["https://m.me/linhouse", "messenger.com"],
      ["https://l.threads.net/", "threads.net"],
      ["https://threads.com/@linhouse", "threads.net"],
      ["https://www.threads.com/@linhouse", "threads.net"],
      ["https://br.pinterest.com/pin/1", "pinterest.com"],
      ["https://www.pinterest.com/pin/1", "pinterest.com"],
      ["https://pin.it/abc", "pinterest.com"],
    ]

    for (const [referrer, host] of cases) {
      assert.equal(referrerHostFrom(referrer, "linhouse.com.vn"), host)
    }
  })

  it("treats same-site and empty referrers as direct", () => {
    assert.equal(
      referrerHostFrom("https://linhouse.com.vn/vi/product/a", "linhouse.com.vn"),
      "(direct)"
    )
    assert.equal(
      referrerHostFrom("https://www.linhouse.com.vn/en", "linhouse.com.vn:443"),
      "(direct)"
    )
    assert.equal(referrerHostFrom("", "linhouse.com.vn"), "(direct)")
    assert.equal(referrerHostFrom("not a url", "linhouse.com.vn"), "(direct)")
  })
})

describe("analytics referrer labels", () => {
  it("shows friendly names for tagged hosts and leaves other hosts", () => {
    assert.equal(analyticsReferrerLabel("(direct)"), "Truy cập trực tiếp")
    assert.equal(analyticsReferrerLabel("facebook.com"), "Facebook")
    assert.equal(analyticsReferrerLabel("l.facebook.com"), "Facebook")
    assert.equal(analyticsReferrerLabel("m.facebook.com"), "Facebook")
    assert.equal(analyticsReferrerLabel("lm.facebook.com"), "Facebook")
    assert.equal(analyticsReferrerLabel("instagram.com"), "Instagram")
    assert.equal(analyticsReferrerLabel("l.instagram.com"), "Instagram")
    assert.equal(analyticsReferrerLabel("tiktok.com"), "TikTok")
    assert.equal(analyticsReferrerLabel("vm.tiktok.com"), "TikTok")
    assert.equal(analyticsReferrerLabel("m.tiktok.com"), "TikTok")
    assert.equal(analyticsReferrerLabel("zalo.me"), "Zalo")
    assert.equal(analyticsReferrerLabel("youtube.com"), "YouTube")
    assert.equal(analyticsReferrerLabel("www.youtube.com"), "YouTube")
    assert.equal(analyticsReferrerLabel("messenger.com"), "Messenger")
    assert.equal(analyticsReferrerLabel("l.messenger.com"), "Messenger")
    assert.equal(analyticsReferrerLabel("m.me"), "Messenger")
    assert.equal(analyticsReferrerLabel("threads.net"), "Threads")
    assert.equal(analyticsReferrerLabel("threads.com"), "Threads")
    assert.equal(analyticsReferrerLabel("pinterest.com"), "Pinterest")
    assert.equal(analyticsReferrerLabel("pin.it"), "Pinterest")
    assert.equal(analyticsReferrerLabel("id.pinterest.com"), "Pinterest")
    assert.equal(analyticsReferrerLabel("news.example"), "news.example")
  })
})
