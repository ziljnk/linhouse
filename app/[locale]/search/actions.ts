"use server"

import { createHash } from "node:crypto"
import { headers } from "next/headers"
import { hasLocale } from "@/app/[locale]/dictionaries"
import {
  isSearchableQuery,
  normalizeSearchQuery,
} from "@/lib/search-query"
import {
  searchStorefront,
  type StorefrontSearchHit,
} from "@/lib/storefront"

export type { StorefrontSearchHit }

const RATE_WINDOW_MS = 10_000
const RATE_MAX = 30

const recentSearches = new Map<string, number[]>()

function clientIp(requestHeaders: Headers) {
  return (
    requestHeaders.get("cf-connecting-ip") ||
    requestHeaders.get("x-real-ip") ||
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    ""
  )
}

function rateLimitKey(ip: string) {
  const secret = process.env.BETTER_AUTH_SECRET ?? "linhouse-search"
  return createHash("sha256")
    .update(`${secret}:search:${ip || "unknown"}`)
    .digest("hex")
    .slice(0, 24)
}

function allowSearch(ip: string) {
  const now = Date.now()
  if (recentSearches.size > 5_000) {
    for (const [key, stamps] of recentSearches) {
      const fresh = stamps.filter((stamp) => now - stamp < RATE_WINDOW_MS)
      if (fresh.length === 0) recentSearches.delete(key)
      else recentSearches.set(key, fresh)
    }
  }

  const key = rateLimitKey(ip)
  const stamps = (recentSearches.get(key) ?? []).filter(
    (stamp) => now - stamp < RATE_WINDOW_MS
  )
  if (stamps.length >= RATE_MAX) {
    recentSearches.set(key, stamps)
    return false
  }

  stamps.push(now)
  recentSearches.set(key, stamps)
  return true
}

export async function searchStorefrontAction(input: {
  locale: string
  query: string
}): Promise<StorefrontSearchHit[]> {
  if (!hasLocale(input.locale) || typeof input.query !== "string") return []

  const query = normalizeSearchQuery(input.query)
  if (!isSearchableQuery(query)) return []

  const requestHeaders = await headers()
  if (!allowSearch(clientIp(requestHeaders))) return []

  try {
    return await searchStorefront({
      locale: input.locale,
      query,
    })
  } catch (error) {
    console.error("searchStorefrontAction failed", error)
    return []
  }
}
