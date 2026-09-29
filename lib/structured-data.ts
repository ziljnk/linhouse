import type { CatalogProduct, CollectionItem } from "@/lib/catalog"
import { productTitle, showsProductPrice } from "@/lib/catalog"
import {
  absoluteAssetUrl,
  BRAND_LOGO,
  localePath,
  SITE_ORIGIN,
  type StorefrontLocale,
} from "@/lib/seo"
import type { StorefrontBlogPost } from "@/lib/storefront"

const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`
const WEBSITE_ID = `${SITE_ORIGIN}/#website`

type JsonLdNode = Record<string, unknown>

function plainText(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

function pageUrl(locale: StorefrontLocale, path: string) {
  return `${SITE_ORIGIN}${localePath(locale, path)}`
}

function telephoneE164(value: string) {
  const digits = value.replace(/\D/g, "")
  if (digits.startsWith("84") && digits.length >= 10) return `+${digits}`
  if (digits.startsWith("0") && digits.length >= 9) return `+84${digits.slice(1)}`
  return ""
}

export function homeStructuredData({
  name,
  description,
  email,
  phone,
  address,
  sameAs,
}: {
  name: string
  description: string
  email: string
  phone: string
  address: string
  sameAs: string[]
}) {
  const telephone = telephoneE164(phone)
  const organization: JsonLdNode = {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name,
    url: SITE_ORIGIN,
    logo: absoluteAssetUrl(BRAND_LOGO),
    image: absoluteAssetUrl("/og-image.webp"),
    description,
  }
  if (email) organization.email = email
  if (telephone) {
    organization.telephone = telephone
    organization.contactPoint = {
      "@type": "ContactPoint",
      telephone,
      contactType: "customer service",
      areaServed: "VN",
      availableLanguage: ["Vietnamese", "English"],
    }
  }
  if (address) {
    organization.address = {
      "@type": "PostalAddress",
      streetAddress: address,
      addressCountry: "VN",
    }
  }
  if (sameAs.length) organization.sameAs = sameAs

  return {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name,
        url: SITE_ORIGIN,
        description,
        inLanguage: ["vi", "en"],
        publisher: { "@id": ORGANIZATION_ID },
      },
    ],
  }
}

export function productStructuredData(
  locale: StorefrontLocale,
  product: CatalogProduct
) {
  const name = productTitle(product)
  const description = plainText(product.seoDescription || product.description || name)
  const images = (product.images?.length ? product.images : [product.image])
    .map((url) => url?.trim() ?? "")
    .filter(Boolean)
    .map(absoluteAssetUrl)
  const url = pageUrl(locale, `/product/${product.slug || ""}`)
  const data: JsonLdNode = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    url,
    brand: { "@type": "Brand", name: "LINHouse" },
  }
  if (images.length) data.image = images
  if (showsProductPrice(product) && product.priceVnd) {
    const inStock = product.purchaseOptions?.some(
      (option) => option === "rent" || option === "ready-to-purchase"
    )
    data.offers = {
      "@type": "Offer",
      url,
      priceCurrency: "VND",
      price: product.priceVnd,
      ...(inStock ? { availability: "https://schema.org/InStock" } : {}),
    }
  }
  return data
}

export function articleStructuredData(
  locale: StorefrontLocale,
  post: StorefrontBlogPost
) {
  const url = pageUrl(locale, `/blog/${post.slug}`)
  const image = post.image.trim() ? absoluteAssetUrl(post.image) : ""
  const data: JsonLdNode = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: plainText(post.seoDescription || post.excerpt || post.title),
    url,
    mainEntityOfPage: url,
    inLanguage: locale,
    author: {
      "@type": "Organization",
      name: "LINHouse",
      url: SITE_ORIGIN,
    },
    publisher: {
      "@type": "Organization",
      name: "LINHouse",
      logo: {
        "@type": "ImageObject",
        url: absoluteAssetUrl(BRAND_LOGO),
      },
    },
  }
  if (image) data.image = image
  if (post.publishedAt) data.datePublished = post.publishedAt
  if (post.updatedAt && (!post.publishedAt || post.updatedAt >= post.publishedAt)) {
    data.dateModified = post.updatedAt
  }
  return data
}

export function collectionStructuredData(
  locale: StorefrontLocale,
  collection: CollectionItem
) {
  const slug = collection.href.replace(/^\/catalog\//, "")
  const url = pageUrl(locale, `/catalog/${slug}`)
  const image = collection.image.trim() ? absoluteAssetUrl(collection.image) : ""
  const data: JsonLdNode = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collection.name,
    description: plainText(collection.seoDescription || collection.subtitle || collection.name),
    url,
    isPartOf: { "@id": WEBSITE_ID },
    inLanguage: locale,
  }
  if (image) data.image = image
  return data
}
