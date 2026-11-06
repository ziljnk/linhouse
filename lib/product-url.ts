import { localePath, SITE_ORIGIN } from "@/lib/seo"

/** Absolute storefront URL with no query, hash, or tracking parameters. */
export function productCanonicalUrl(locale: string, slug: string) {
  const safeSlug = slug.trim().replace(/^\/+|\/+$/g, "")
  const url = new URL(localePath(locale, `/product/${safeSlug}`), SITE_ORIGIN)
  url.search = ""
  url.hash = ""
  if (url.origin !== SITE_ORIGIN) {
    throw new Error("Product link must stay on the storefront origin")
  }
  return url.toString()
}

function plainShareText(value: string | undefined) {
  return (value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Text used for the product Open Graph and Twitter description.
 * Prefer the SEO description, then the product description, then the title.
 */
export function productShareDescription(product: {
  seoDescription?: string
  description?: string
  title: string
}) {
  return (
    plainShareText(product.seoDescription) ||
    plainShareText(product.description) ||
    plainShareText(product.title)
  )
}
