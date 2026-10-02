import { getImageUrl, parseCmsStorageKey } from "@/lib/cms-image"

export const DEFAULT_HOME_HERO_IMAGE = "/hero/bridal.webp"
export const HOME_HERO_IMAGE_KEY = "home.heroImage"

export function readHomeHeroImage(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim()
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const data = value as Record<string, unknown>
    if (typeof data.vi === "string" && data.vi.trim()) return data.vi.trim()
    if (typeof data.en === "string" && data.en.trim()) return data.en.trim()
  }
  return ""
}

export function allowedHomeHeroImage(image: string | undefined) {
  const value = image?.trim() ?? ""
  if (!value || value === DEFAULT_HOME_HERO_IMAGE) return DEFAULT_HOME_HERO_IMAGE
  const key = parseCmsStorageKey(value)
  if (key?.startsWith("hero/")) return getImageUrl(key, 1200)
  return DEFAULT_HOME_HERO_IMAGE
}
