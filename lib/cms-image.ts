export const CMS_IMAGE_VARIANT_WIDTHS = [400, 800, 1200] as const
export const CMS_IMAGE_DEFAULT_WIDTH = 800
export const CMS_IMAGE_TYPES = [
  "products",
  "collections",
  "blog",
  "testimonials",
  "about",
] as const

export type CmsImageVariantWidth = (typeof CMS_IMAGE_VARIANT_WIDTHS)[number]
export type CmsImageType = (typeof CMS_IMAGE_TYPES)[number]

const IMAGE_FILE_EXT = /\.(avif|gif|jpe?g|png|webp|svg)$/i
const VARIANT_FILENAME = /^(400|800|1200)w\.webp$/i
const STORAGE_KEY_RE = new RegExp(
  `^(${CMS_IMAGE_TYPES.join("|")})/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`,
  "i"
)

export type CmsImageSource = {
  storageKey?: string
  src?: string
}

export type ResolvedCmsImage = {
  src: string
  srcSet?: string
}

export function isCmsImageType(value: string): value is CmsImageType {
  return (CMS_IMAGE_TYPES as readonly string[]).includes(value)
}

export function normalizeStorageKey(storageKey: string) {
  return storageKey.replace(/^\/uploads\/?/, "").replace(/\/+$/, "")
}

export function parseCmsStorageKey(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const fromVariant = inferStorageKeyFromUrl(trimmed)
  if (fromVariant && STORAGE_KEY_RE.test(fromVariant)) return fromVariant

  const key = normalizeStorageKey(trimmed)
  return STORAGE_KEY_RE.test(key) ? key : null
}

export function isCmsStorageKey(value: string): boolean {
  return parseCmsStorageKey(value) !== null
}

export function getImageUrl(
  storageKey: string,
  width: CmsImageVariantWidth = CMS_IMAGE_DEFAULT_WIDTH
) {
  return `/uploads/${normalizeStorageKey(storageKey)}/${width}w.webp`
}

export function cmsImageDisplaySrc(value: string) {
  if (value.startsWith("blob:") || value.startsWith("data:")) return value
  return resolveCmsImageSources({ src: value })?.src ?? value
}

export function resolveCmsImageSources({
  storageKey,
  src,
}: CmsImageSource): ResolvedCmsImage | null {
  const parsedKey = parseCmsStorageKey(storageKey ?? "") ?? parseCmsStorageKey(src ?? "")
  if (parsedKey) return variantSources(parsedKey)

  const url = src?.trim()
  if (!url) return null

  return { src: url }
}

function variantSources(storageKey: string): ResolvedCmsImage {
  return {
    src: getImageUrl(storageKey),
    srcSet: CMS_IMAGE_VARIANT_WIDTHS.map(
      (width) => `${getImageUrl(storageKey, width)} ${width}w`
    ).join(", "),
  }
}

function inferStorageKeyFromUrl(url: string): string | null {
  const path = url.startsWith("/uploads/")
    ? url.slice("/uploads/".length).replace(/\/+$/, "")
    : url.replace(/^\/+/, "").replace(/\/+$/, "")
  if (!path) return null

  const segments = path.split("/")
  const last = segments.at(-1)
  if (!last) return null

  if (VARIANT_FILENAME.test(last) && segments.length > 1) {
    return segments.slice(0, -1).join("/")
  }

  if (!IMAGE_FILE_EXT.test(last)) return path

  return null
}
