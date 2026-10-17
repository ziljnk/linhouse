import type { MetadataRoute } from "next"
import { largestVariantPath } from "@/lib/cms-image"
import {
  getStorefrontBlogSlugs,
  getStorefrontCatalogSlugs,
  getStorefrontProductSlugs,
  getStorefrontSitemapImages,
} from "@/lib/storefront"
import { isIndexableDeployment, localePath, SITE_ORIGIN } from "@/lib/seo"

export const revalidate = 3600

const STATIC_PATHS = [
  "/",
  "/about",
  "/blog",
  "/reviews",
  "/support",
  "/shipping",
  "/terms",
  "/privacy",
]

function absoluteImageUrl(value: string) {
  const path = largestVariantPath(value)
  if (!path) return ""
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_ORIGIN}${path}`
}

/** Next writes `<image:loc>` with the string as-is, so `&` must already be escaped. */
function xmlText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}

function uniqueImageUrls(values: string[]) {
  const seen = new Set<string>()
  const urls: string[] = []
  for (const value of values) {
    const url = absoluteImageUrl(value)
    if (!url || seen.has(url)) continue
    seen.add(url)
    urls.push(xmlText(url))
    if (urls.length === 1000) break
  }
  return urls
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isIndexableDeployment()) return []

  let catalogSlugs: string[] = []
  let productSlugs: string[] = []
  let blogSlugs: string[] = []
  const imagesByPath = new Map<string, string[]>()

  try {
    const [catalog, products, blog, images] = await Promise.all([
      getStorefrontCatalogSlugs(),
      getStorefrontProductSlugs(),
      getStorefrontBlogSlugs(),
      getStorefrontSitemapImages(),
    ])
    catalogSlugs = catalog
    productSlugs = products
    blogSlugs = blog

    for (const product of images.products) {
      const urls = uniqueImageUrls(product.images)
      if (urls.length) imagesByPath.set(`/product/${product.slug}`, urls)
    }
    for (const collection of images.collections) {
      const urls = uniqueImageUrls([collection.image])
      if (urls.length) imagesByPath.set(`/catalog/${collection.slug}`, urls)
    }
  } catch {
    // Keep the static storefront URLs if the database is unavailable.
  }

  const paths = [
    ...STATIC_PATHS,
    ...catalogSlugs.map((slug) => `/catalog/${slug}`),
    ...productSlugs.map((slug) => `/product/${slug}`),
    ...blogSlugs.map((slug) => `/blog/${slug}`),
  ]

  return paths.flatMap((path) =>
    (["vi", "en"] as const).map((locale) => {
      const images = imagesByPath.get(path)
      return {
        url: `${SITE_ORIGIN}${localePath(locale, path)}`,
        ...(images?.length ? { images } : {}),
        alternates: {
          languages: {
            vi: `${SITE_ORIGIN}${localePath("vi", path)}`,
            en: `${SITE_ORIGIN}${localePath("en", path)}`,
            "x-default": `${SITE_ORIGIN}${localePath("en", path)}`,
          },
        },
      }
    })
  )
}
