import { headers } from "next/headers"
import { getImageUrl, parseCmsStorageKey } from "@/lib/cms-image"
import { DEFAULT_OG_IMAGE, SITE_ORIGIN } from "@/lib/seo"

function originFromHost(hostHeader: string | null) {
  const host = hostHeader?.split(",")[0]?.trim()
  if (!host) return SITE_ORIGIN
  const hostname = host.split(":")[0]?.toLowerCase() ?? ""
  const proto =
    hostname === "localhost" || hostname === "127.0.0.1" ? "http" : "https"
  return `${proto}://${host}`
}

/** Absolute URL of a file a crawler can fetch. CMS covers are storage keys, not files. */
export async function publicImageUrl(value: string) {
  const headerStore = await headers()
  const origin = originFromHost(
    headerStore.get("x-forwarded-host") ?? headerStore.get("host")
  )
  const trimmed = value.trim()
  if (!trimmed) return `${origin}${DEFAULT_OG_IMAGE}`
  if (/^https?:\/\//i.test(trimmed)) return trimmed

  const storageKey = parseCmsStorageKey(trimmed)
  const path = storageKey
    ? getImageUrl(storageKey, 1200)
    : trimmed.startsWith("/")
      ? trimmed
      : `/${trimmed}`
  return `${origin}${path}`
}
