"use server"

import { hasLocale } from "@/app/[locale]/dictionaries"
import {
  CATALOG_INITIAL_PAGE_SIZE,
  CATALOG_LOAD_MORE_SIZE,
  parseCatalogSort,
} from "@/lib/catalog"
import {
  listStorefrontCatalog,
  type CatalogQueryFilters,
} from "@/lib/storefront"

export async function loadCatalogPage(input: {
  locale: string
  slug: string
  filters?: CatalogQueryFilters
  sort?: string
  offset: number
  limit: number
}) {
  if (!hasLocale(input.locale)) {
    return { products: [], total: 0 }
  }

  const maxLimit =
    input.offset > 0 ? CATALOG_LOAD_MORE_SIZE : CATALOG_INITIAL_PAGE_SIZE
  const limit = Math.min(Math.max(1, Math.floor(input.limit)), maxLimit)

  return listStorefrontCatalog({
    locale: input.locale,
    slug: input.slug,
    filters: input.filters,
    sort: parseCatalogSort(input.sort),
    offset: Math.max(0, Math.floor(input.offset)),
    limit,
  })
}
