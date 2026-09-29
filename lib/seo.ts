export type StorefrontLocale = "vi" | "en"
export type AppMode = "all" | "storefront" | "admin"

export const PRODUCTION_HOSTNAME = "linhouse.com.vn"
export const SITE_ORIGIN = `https://${PRODUCTION_HOSTNAME}`

export const NOINDEX_ROBOTS_HEADER = "noindex, nofollow, noarchive"
export const DEFAULT_OG_IMAGE = "/og-image.webp"
export const BRAND_LOGO = "/logo-text.png"

export function absoluteAssetUrl(path: string) {
  const value = path.trim()
  if (!value) return `${SITE_ORIGIN}${DEFAULT_OG_IMAGE}`
  if (/^https?:\/\//i.test(value)) return value
  return `${SITE_ORIGIN}${value.startsWith("/") ? value : `/${value}`}`
}

export function getAppMode(): AppMode {
  const mode = process.env.APP_MODE?.trim()
  if (mode === "all" || mode === "storefront" || mode === "admin") return mode
  return "all"
}

/** Search engines may index only the public storefront deployment. */
export function isIndexableDeployment() {
  return getAppMode() === "storefront"
}

export function localePath(locale: string, path = "/") {
  if (path === "/" || path === "") return `/${locale}`
  return `/${locale}${path.startsWith("/") ? path : `/${path}`}`
}
