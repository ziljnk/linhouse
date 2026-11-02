import { slugify } from "@/lib/slug"
import { PRODUCTION_HOSTNAME, SITE_ORIGIN } from "@/lib/seo"

const DEFAULT_PATH = "/vi"
const MAX_PATH_LENGTH = 300
const MAX_CAMPAIGN_LENGTH = 80

const DOMAIN_ERROR = "Chỉ chấp nhận link trên linhouse.com.vn."
const PATH_ERROR = "Đường dẫn phải bắt đầu bằng /vi hoặc /en."
const INVALID_ERROR = "Link không hợp lệ."

export const SHARE_PLATFORMS = [
  { id: "facebook", label: "Facebook" },
  { id: "tiktok", label: "TikTok" },
  { id: "instagram", label: "Instagram" },
  { id: "zalo", label: "Zalo" },
  { id: "youtube", label: "YouTube" },
] as const

export type SharePlatformId = (typeof SHARE_PLATFORMS)[number]["id"]

export function shareCampaignSlug(value: string) {
  return slugify(value).slice(0, MAX_CAMPAIGN_LENGTH).replace(/-+$/g, "")
}

export type StorefrontTarget = {
  pathname: string
  searchParams: URLSearchParams
  hash: string
}

export function parseStorefrontTarget(
  raw: string
): { ok: true; target: StorefrontTarget } | { ok: false; error: string } {
  const value = raw.trim()
  const input = value || DEFAULT_PATH

  if (input.includes("\\") || input.includes("\0")) {
    return { ok: false, error: INVALID_ERROR }
  }

  let url: URL
  try {
    url = new URL(input, SITE_ORIGIN)
  } catch {
    return { ok: false, error: INVALID_ERROR }
  }

  const looksAbsolute = /^[a-z][a-z0-9+.-]*:/i.test(input) || input.startsWith("//")
  if (!looksAbsolute && !input.startsWith("/")) {
    return { ok: false, error: PATH_ERROR }
  }

  if (url.username || url.password) {
    return { ok: false, error: DOMAIN_ERROR }
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, error: INVALID_ERROR }
  }
  if (url.hostname.toLowerCase() !== PRODUCTION_HOSTNAME || url.port) {
    return { ok: false, error: DOMAIN_ERROR }
  }

  let pathname = url.pathname
  if (pathname.length > 1) pathname = pathname.replace(/\/+$/, "")
  const locale = pathname.split("/")[1] ?? ""
  if (locale !== "vi" && locale !== "en") {
    return { ok: false, error: PATH_ERROR }
  }
  if (pathname.length > MAX_PATH_LENGTH) {
    return { ok: false, error: INVALID_ERROR }
  }

  return {
    ok: true,
    target: {
      pathname,
      searchParams: new URLSearchParams(url.search),
      hash: url.hash,
    },
  }
}

function withCampaignParams(
  params: URLSearchParams,
  platform: SharePlatformId,
  campaign: string
) {
  const next = new URLSearchParams(params)
  for (const key of [...next.keys()]) {
    if (key.toLowerCase().startsWith("utm_")) next.delete(key)
  }
  next.set("utm_source", platform)
  next.set("utm_medium", "social")
  const slug = shareCampaignSlug(campaign)
  if (slug) next.set("utm_campaign", slug)
  const query = next.toString()
  return query ? `?${query}` : ""
}

export function buildShareLink(input: {
  target: string
  platform: SharePlatformId
  campaign?: string
}): { ok: true; url: string } | { ok: false; error: string } {
  const parsed = parseStorefrontTarget(input.target)
  if (!parsed.ok) return parsed

  const search = withCampaignParams(
    parsed.target.searchParams,
    input.platform,
    input.campaign ?? ""
  )
  const url = `${SITE_ORIGIN}${parsed.target.pathname}${search}${parsed.target.hash}`
  if (new URL(url).origin !== SITE_ORIGIN) {
    return { ok: false, error: DOMAIN_ERROR }
  }
  return { ok: true, url }
}

export const DEFAULT_SHARE_TARGET = `${SITE_ORIGIN}${DEFAULT_PATH}`
