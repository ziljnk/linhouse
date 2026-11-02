import { SITE_ORIGIN } from "@/lib/seo"

const HOMEPAGE_PATH = "/vi"

export const SHARE_PLATFORMS = [
  { id: "facebook", label: "Facebook" },
  { id: "tiktok", label: "TikTok" },
  { id: "instagram", label: "Instagram" },
  { id: "zalo", label: "Zalo" },
  { id: "youtube", label: "YouTube" },
] as const

export type SharePlatformId = (typeof SHARE_PLATFORMS)[number]["id"]

/** Tagged Vietnamese homepage. The only URL the admin share card copies. */
export function shareHomepageLink(platform: SharePlatformId) {
  const url = new URL(HOMEPAGE_PATH, SITE_ORIGIN)
  url.searchParams.set("utm_source", platform)
  url.searchParams.set("utm_medium", "social")
  if (url.origin !== SITE_ORIGIN) {
    throw new Error("Share link must stay on the storefront origin")
  }
  return url.toString()
}
