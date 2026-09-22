import { createHash } from "node:crypto"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { blogPost, product } from "@/lib/db/schema"
import { isLiveContent } from "@/lib/content-schedule"
import type {
  AnalyticsDeviceType,
  AnalyticsEntityType,
} from "@/lib/db/schema/analytics"
import { analyticsPageview } from "@/lib/db/schema/analytics"

const BOT_UA =
  /bot|crawler|spider|crawling|slurp|wget|curl|python-requests|facebookexternalhit|preview|discordbot|telegram|whatsapp|linkedinbot|embedly|pinterest|redditbot|applebot|bingbot|yandex|baiduspider|duckduckbot|semrush|ahrefs|mj12bot|bytespider|gptbot|claudebot|ccbot/i

const PRODUCT_PATH = /^\/(vi|en)\/product\/([^/?#]+)\/?$/
const BLOG_PATH = /^\/(vi|en)\/blog\/([^/?#]+)\/?$/
const RATE_WINDOW_MS = 8_000
const MAX_PATH_LENGTH = 300
const MAX_REFERRER_LENGTH = 500

const recentViews = new Map<string, number>()

export type AnalyticsViewInput = {
  path: string
  referrer?: string
}

function isLiveProduct() {
  return isLiveContent(product.status, product.publishedAt)
}

function isLivePost() {
  return isLiveContent(blogPost.status, blogPost.publishedAt)
}

export function isBotUserAgent(userAgent: string) {
  return BOT_UA.test(userAgent)
}

export function countryFromHeaders(headers: Headers) {
  const raw = (
    headers.get("cf-ipcountry") ||
    headers.get("x-vercel-ip-country") ||
    headers.get("x-country-code") ||
    "XX"
  )
    .trim()
    .toUpperCase()

  if (raw === "T1") return "T1"
  if (/^[A-Z]{2}$/.test(raw)) return raw
  return "XX"
}

export function deviceFromUserAgent(userAgent: string): AnalyticsDeviceType {
  const ua = userAgent.toLowerCase()
  if (/ipad|tablet|playbook|silk/.test(ua)) return "tablet"
  if (
    /mobile|iphone|ipod|android.*mobile|blackberry|opera mini|windows phone/.test(
      ua
    )
  ) {
    return "mobile"
  }
  if (/android/.test(ua) && !/mobile/.test(ua)) return "tablet"
  return "desktop"
}

export function normalizePath(path: string) {
  const trimmed = path.trim()
  if (!trimmed) return null
  let pathname = trimmed
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      pathname = new URL(trimmed).pathname
    }
  } catch {
    return null
  }

  const [withoutQuery] = pathname.split(/[?#]/)
  const decoded = decodeURIComponent(withoutQuery || "")
  if (!decoded.startsWith("/vi") && !decoded.startsWith("/en")) return null
  if (decoded.startsWith("/admin")) return null
  if (decoded.length > MAX_PATH_LENGTH) return null
  if (decoded.includes("\\") || decoded.includes("\0")) return null
  return decoded.replace(/\/+$/, "") || decoded
}

export function localeFromPath(path: string) {
  if (path.startsWith("/vi")) return "vi"
  if (path.startsWith("/en")) return "en"
  return null
}

export function referrerHostFrom(referrer: string, siteHost: string) {
  const value = referrer.trim().slice(0, MAX_REFERRER_LENGTH)
  if (!value) return "(direct)"

  try {
    const url = new URL(value)
    const incoming = url.hostname.replace(/^www\./i, "").toLowerCase()
    const site = siteHost.replace(/^www\./i, "").toLowerCase().split(":")[0]
    if (!incoming || incoming === site) return "(direct)"
    return incoming.slice(0, 120)
  } catch {
    return "(direct)"
  }
}

function clientIp(headers: Headers) {
  return (
    headers.get("cf-connecting-ip") ||
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    ""
  )
}

function siteHost(headers: Headers) {
  return (
    headers.get("x-forwarded-host") ||
    headers.get("host") ||
    ""
  )
}

function rateLimitKey(ip: string, path: string) {
  const secret = process.env.BETTER_AUTH_SECRET ?? "linhouse-analytics"
  return createHash("sha256")
    .update(`${secret}:${ip}:${path}`)
    .digest("hex")
    .slice(0, 24)
}

function allowView(ip: string, path: string) {
  const now = Date.now()
  if (recentViews.size > 5_000) {
    for (const [key, seenAt] of recentViews) {
      if (now - seenAt > RATE_WINDOW_MS) recentViews.delete(key)
    }
  }

  const key = rateLimitKey(ip || "unknown", path)
  const last = recentViews.get(key)
  if (last && now - last < RATE_WINDOW_MS) return false
  recentViews.set(key, now)
  return true
}

async function resolveEntity(path: string): Promise<{
  entityType: AnalyticsEntityType | null
  entityId: string | null
}> {
  const productMatch = path.match(PRODUCT_PATH)
  if (productMatch) {
    const slug = decodeURIComponent(productMatch[2] ?? "")
    const [row] = await db
      .select({ id: product.id })
      .from(product)
      .where(and(eq(product.slug, slug), isLiveProduct()))
      .limit(1)
    return row ? { entityType: "product", entityId: row.id } : { entityType: null, entityId: null }
  }

  const blogMatch = path.match(BLOG_PATH)
  if (blogMatch) {
    const slug = decodeURIComponent(blogMatch[2] ?? "")
    const [row] = await db
      .select({ id: blogPost.id })
      .from(blogPost)
      .where(and(eq(blogPost.slug, slug), isLivePost()))
      .limit(1)
    return row
      ? { entityType: "blog_post", entityId: row.id }
      : { entityType: null, entityId: null }
  }

  return { entityType: null, entityId: null }
}

export async function recordPageview(
  input: AnalyticsViewInput,
  headers: Headers
) {
  const userAgent = headers.get("user-agent") ?? ""
  if (isBotUserAgent(userAgent)) return false

  const path = normalizePath(input.path)
  if (!path) return false

  const ip = clientIp(headers)
  if (!allowView(ip, path)) return false

  const entity = await resolveEntity(path)

  await db.insert(analyticsPageview).values({
    path,
    locale: localeFromPath(path),
    entityType: entity.entityType,
    entityId: entity.entityId,
    countryCode: countryFromHeaders(headers),
    referrerHost: referrerHostFrom(input.referrer ?? "", siteHost(headers)),
    deviceType: deviceFromUserAgent(userAgent),
  })

  return true
}
