import type { MetadataRoute } from "next"
import {
  getStorefrontBlogSlugs,
  getStorefrontCatalogSlugs,
  getStorefrontProductSlugs,
} from "@/lib/storefront"
import { isIndexableDeployment, localePath, SITE_ORIGIN } from "@/lib/seo"

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isIndexableDeployment()) return []

  let catalogSlugs: string[] = []
  let productSlugs: string[] = []
  let blogSlugs: string[] = []

  try {
    ;[catalogSlugs, productSlugs, blogSlugs] = await Promise.all([
      getStorefrontCatalogSlugs(),
      getStorefrontProductSlugs(),
      getStorefrontBlogSlugs(),
    ])
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
    (["vi", "en"] as const).map((locale) => ({
      url: `${SITE_ORIGIN}${localePath(locale, path)}`,
      alternates: {
        languages: {
          vi: `${SITE_ORIGIN}${localePath("vi", path)}`,
          en: `${SITE_ORIGIN}${localePath("en", path)}`,
          "x-default": `${SITE_ORIGIN}${localePath("en", path)}`,
        },
      },
    }))
  )
}
