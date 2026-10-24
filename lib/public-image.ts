import { getImageUrl, parseCmsStorageKey } from "@/lib/cms-image"
import { DEFAULT_OG_IMAGE, SITE_ORIGIN } from "@/lib/seo"

/**
 * Absolute URL a crawler can fetch. CMS covers are storage keys, not files.
 * The origin is fixed so this can run during static/ISR rendering. Reading
 * request headers here throws DYNAMIC_SERVER_USAGE for slugs generated after
 * the build.
 */
export function publicImageUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return `${SITE_ORIGIN}${DEFAULT_OG_IMAGE}`
  if (/^https?:\/\//i.test(trimmed)) return trimmed

  const storageKey = parseCmsStorageKey(trimmed)
  const path = storageKey
    ? getImageUrl(storageKey, 1200)
    : trimmed.startsWith("/")
      ? trimmed
      : `/${trimmed}`
  return `${SITE_ORIGIN}${path}`
}
