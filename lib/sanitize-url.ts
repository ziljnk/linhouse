const UNSAFE_PATH_CHARS = /[<>"'`\\\s\x00-\x1f\x7f]/
const SAFE_RELATIVE_PATH = /^\/[\w\-./%]+$/

export function isSafeLinkHref(href: string) {
  const trimmed = href.trim()
  if (!trimmed) return false

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return !UNSAFE_PATH_CHARS.test(trimmed) && SAFE_RELATIVE_PATH.test(trimmed)
  }

  try {
    const url = new URL(trimmed)
    return (
      url.protocol === "http:" ||
      url.protocol === "https:" ||
      url.protocol === "mailto:"
    )
  } catch {
    return false
  }
}

export function sanitizeMediaUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    if (UNSAFE_PATH_CHARS.test(trimmed) || !SAFE_RELATIVE_PATH.test(trimmed)) {
      return null
    }
    return trimmed
  }

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null
    }
    return trimmed
  } catch {
    return null
  }
}

export function sanitizeMediaUrls(urls: string[]) {
  return urls
    .map((url) => sanitizeMediaUrl(url))
    .filter((url): url is string => url !== null)
}

export function sanitizeExternalUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null
    }
    return trimmed
  } catch {
    return null
  }
}
