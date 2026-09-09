import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CollectionCatalog } from "@/components/collection-catalog"
import { CollectionHero } from "@/components/collection-hero"
import {
  catalogFilterGroups,
  catalogProductsForSlug,
  catalogSlugs,
  findCollection,
} from "@/lib/catalog"
import {
  findCategoryLabel,
  getDictionary,
  hasLocale,
} from "../../dictionaries"

export async function generateStaticParams() {
  const dict = await getDictionary("en")
  const slugs = catalogSlugs(dict)

  return (["en", "vi"] as const).flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug }))
  )
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/catalog/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params
  if (!hasLocale(locale)) return {}

  const dict = await getDictionary(locale)
  const collection = findCollection(dict, slug)
  const title = collection?.name ?? findCategoryLabel(dict, slug)

  return {
    title: `${title} | LINHouse`,
    description: collection?.subtitle,
  }
}

export default async function CatalogPage({
  params,
}: PageProps<"/[locale]/catalog/[slug]">) {
  const { locale, slug } = await params

  if (!hasLocale(locale)) notFound()

  const dict = await getDictionary(locale)
  const collection = findCollection(dict, slug)
  const products = catalogProductsForSlug(dict.catalog, slug)
  const title = collection?.name ?? findCategoryLabel(dict, slug)

  return (
    <main className="overflow-x-clip bg-ivory">
      {collection ? <CollectionHero collection={collection} /> : null}
      <CollectionCatalog
        products={products}
        groups={catalogFilterGroups(dict)}
        copy={dict.catalogPage}
        contactLabel={dict.products.contact}
        locale={locale}
        title={collection ? undefined : title}
      />
    </main>
  )
}
