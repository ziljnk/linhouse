import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ProductDetail } from "@/components/product-detail"
import { findProduct, parseProductName, productSlugs } from "@/lib/catalog"
import { getDictionary, hasLocale } from "../../dictionaries"

export async function generateStaticParams() {
  const dict = await getDictionary("en")
  const slugs = productSlugs(dict.catalog)

  return (["en", "vi"] as const).flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug }))
  )
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/product/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params
  if (!hasLocale(locale)) return {}

  const dict = await getDictionary(locale)
  const product = findProduct(dict.catalog, slug)
  if (!product) return {}

  const { shortName, title } = parseProductName(product.name)

  return {
    title: `${shortName} | LINHouse`,
    description: title,
  }
}

export default async function ProductPage({
  params,
}: PageProps<"/[locale]/product/[slug]">) {
  const { locale, slug } = await params

  if (!hasLocale(locale)) notFound()

  const dict = await getDictionary(locale)
  const product = findProduct(dict.catalog, slug)

  if (!product) notFound()

  return (
    <main className="bg-ivory">
      <ProductDetail
        locale={locale}
        product={product}
        catalog={dict.catalog}
        dict={dict}
      />
    </main>
  )
}
