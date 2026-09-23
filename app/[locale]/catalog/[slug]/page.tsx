import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CollectionSection } from "@/components/collection-section"
import { CollectionCatalog } from "@/components/collection-catalog"
import { CollectionGallery } from "@/components/collection-gallery"
import { CollectionHero } from "@/components/collection-hero"
import {
  CATALOG_INITIAL_PAGE_SIZE,
  collectionGallery,
  filterGroupsForCatalogSlug,
} from "@/lib/catalog"
import {
  catalogTitle,
  findStorefrontCollection,
  getStorefront,
  getStorefrontCatalogSlugs,
  listStorefrontCatalog,
} from "@/lib/storefront"
import { getDictionary, hasLocale } from "../../dictionaries"

export async function generateStaticParams() {
  try {
    const slugs = await getStorefrontCatalogSlugs()
    return (["en", "vi"] as const).flatMap((locale) =>
      slugs.map((slug) => ({ locale, slug }))
    )
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/catalog/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params
  if (!hasLocale(locale)) return {}

  const dict = await getDictionary(locale)
  const storefront = await getStorefront(locale, dict)
  const collection = findStorefrontCollection(storefront.collections, slug)
  const title = catalogTitle(
    slug,
    storefront.collections,
    storefront.filterGroups,
    dict
  )

  return {
    title: `${collection?.seoTitle || title} | LINHouse`,
    description: collection?.seoDescription || collection?.subtitle,
  }
}

export default async function CatalogPage({
  params,
}: PageProps<"/[locale]/catalog/[slug]">) {
  const { locale, slug } = await params

  if (!hasLocale(locale)) notFound()

  const dict = await getDictionary(locale)
  const storefront = await getStorefront(locale, dict)
  const collection = findStorefrontCollection(storefront.collections, slug)

  if (collection) {
    const otherCollections = storefront.collections.filter(
      (item) => item.href !== collection.href
    )
    const galleryItems = collectionGallery(collection)

    return (
      <main className="overflow-x-clip bg-ivory">
        <CollectionHero
          collection={collection}
          readMoreLabel={dict.catalogPage.readMore}
          showLessLabel={dict.catalogPage.showLess}
        />
        {galleryItems.length > 0 ? (
          <CollectionGallery
            items={galleryItems}
            prevLabel={dict.catalogPage.prevImage}
            nextLabel={dict.catalogPage.nextImage}
          />
        ) : null}
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

  const knownSlug =
    slug === "all-gowns" ||
    slug === "all-ao-dai" ||
    storefront.filterGroups.some((group) =>
      group.options.some((option) => option.value === slug)
    ) ||
    dict.nav.aodaiColumns.some((column) =>
      column.links.some((link) => link.href === `/catalog/${slug}`)
    ) ||
    dict.nav.bridalColumns.some((column) =>
      column.links.some((link) => link.href === `/catalog/${slug}`)
    )

  if (!knownSlug) notFound()

  const { products, total } = await listStorefrontCatalog({
    locale,
    slug,
    offset: 0,
    limit: CATALOG_INITIAL_PAGE_SIZE,
  })
  const title = catalogTitle(
    slug,
    storefront.collections,
    storefront.filterGroups,
    dict
  )
  const groups = filterGroupsForCatalogSlug(slug, storefront.filterGroups)

  return (
    <main className="overflow-x-clip bg-ivory">
      <CollectionCatalog
        key={slug}
        slug={slug}
        initialProducts={products}
        initialTotal={total}
        groups={groups}
        copy={dict.catalogPage}
        contactLabel={dict.products.contact}
        locale={locale}
        title={title}
      />
    </main>
  )
}
