import type { Metadata } from "next"
import {
  absoluteAssetUrl,
  DEFAULT_OG_IMAGE,
  isIndexableDeployment,
  localePath,
  SITE_ORIGIN,
  type StorefrontLocale,
} from "@/lib/seo"

const noindexRobots: Metadata["robots"] = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
    nosnippet: true,
    noarchive: true,
  },
}

export function withStorefrontSeo(
  locale: StorefrontLocale,
  path: string,
  meta: {
    title: string
    description?: string
    keywords?: string[]
    image?: string
    imageAlt?: string
    type?: "website" | "article"
    publishedTime?: string
  }
): Metadata {
  const indexable = isIndexableDeployment()
  const canonical = `${SITE_ORIGIN}${localePath(locale, path)}`
  const imagePath = meta.image?.trim() || DEFAULT_OG_IMAGE
  const imageUrl = absoluteAssetUrl(imagePath)
  const isBrandImage = imageUrl.endsWith("/og-image.webp")
  const image = {
    url: imageUrl,
    alt: meta.imageAlt?.trim() || "LINHouse",
    ...(isBrandImage ? { width: 1200, height: 630 } : {}),
  }

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    robots: indexable ? { index: true, follow: true } : noindexRobots,
    alternates: indexable
      ? {
          canonical,
          languages: {
            vi: `${SITE_ORIGIN}${localePath("vi", path)}`,
            en: `${SITE_ORIGIN}${localePath("en", path)}`,
            "x-default": `${SITE_ORIGIN}${localePath("en", path)}`,
          },
        }
      : undefined,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: indexable ? canonical : undefined,
      siteName: "LINHouse",
      locale: locale === "vi" ? "vi_VN" : "en_US",
      alternateLocale: indexable
        ? locale === "vi"
          ? ["en_US"]
          : ["vi_VN"]
        : undefined,
      type: meta.type ?? "website",
      publishedTime: meta.type === "article" ? meta.publishedTime : undefined,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [imageUrl],
    },
  }
}
