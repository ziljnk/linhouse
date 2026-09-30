import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { JsonLd } from "@/components/json-ld"
import { ProductDetail } from "@/components/product-detail"
import { findProduct, productTitle } from "@/lib/catalog"
import {
  getStorefront,
  getStorefrontContact,
  getStorefrontProductSlugs,
  seoKeywordList,
} from "@/lib/storefront"
import { withStorefrontSeo } from "@/lib/storefront-metadata"
import { productStructuredData } from "@/lib/structured-data"
import { getDictionary, hasLocale } from "../../dictionaries"

export async function generateStaticParams() {
  try {
    const slugs = await getStorefrontProductSlugs()
    return (["en", "vi"] as const).flatMap((locale) =>
      slugs.map((slug) => ({ locale, slug }))
    )
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/product/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params
  if (!hasLocale(locale)) return {}

  const dict = await getDictionary(locale)
  const storefront = await getStorefront(locale, dict)
  const product = findProduct(storefront.products, slug)
  if (!product) return {}

  const title = product.seoTitle || productTitle(product)
  return withStorefrontSeo(locale, `/product/${slug}`, {
    title: `${title} | LINHouse`,
    description: product.seoDescription || productTitle(product),
    keywords: seoKeywordList(product.seoKeywords),
    image: product.image,
    imageAlt: title,
  })
}

export default async function ProductPage({
  params,
}: PageProps<"/[locale]/product/[slug]">) {
  const { locale, slug } = await params

  if (!hasLocale(locale)) notFound()

  const dict = await getDictionary(locale)
  const [storefront, contact] = await Promise.all([
    getStorefront(locale, dict),
    getStorefrontContact(locale, dict),
  ])
  const product = findProduct(storefront.products, slug)

  if (!product) notFound()

  return (
    <main className="bg-ivory">
      <JsonLd data={await productStructuredData(locale, product)} />
      <ProductDetail
        locale={locale}
        product={product}
        catalog={storefront.products}
        collections={storefront.collections}
        groups={storefront.filterGroups}
        dict={{
          ...dict,
          productPage: storefront.productPage,
          footer: contact.footer,
        }}
        contactMethods={contact.contactMethods}
      />
    </main>
  )
}
