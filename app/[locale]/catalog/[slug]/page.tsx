import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CollectionSection } from "@/components/collection-section"
import { CollectionCatalog } from "@/components/collection-catalog"
import { CollectionGallery } from "@/components/collection-gallery"
import { CollectionHero } from "@/components/collection-hero"
import {
  catalogFilterGroups,
  catalogProductsForSlug,
  catalogSlugs,
  collectionGallery,
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

  if (collection) {
    const otherCollections = dict.home.collection.items.filter(
      (item) => item.href !== collection.href
    )

    return (
      <main className="overflow-x-clip bg-ivory">
        <CollectionHero collection={collection} />
        <CollectionGallery items={collectionGallery(collection, dict.catalog)} />
        {otherCollections.length > 0 ? (
          <CollectionSection
            locale={locale}
            copy={{
              title: dict.catalogPage.otherCollections,
              items: otherCollections,
            }}
          />
        ) : null}
      </main>
    )
  }

  const products = catalogProductsForSlug(dict.catalog, slug)
  const title = findCategoryLabel(dict, slug)

  return (
    <main className="overflow-x-clip bg-ivory">
      <CollectionCatalog
        products={products}
        groups={catalogFilterGroups(dict)}
        copy={dict.catalogPage}
        contactLabel={dict.products.contact}
        locale={locale}
        title={title}
      />
    </main>
  )
}
