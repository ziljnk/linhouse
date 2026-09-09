"use client"

import { useMemo, useState } from "react"
import { SlidersHorizontal } from "lucide-react"
import type { Locale } from "@/app/[locale]/dictionaries"
import {
  CATALOG_FILTER_KEYS,
  type CatalogFilterGroup,
  type CatalogFilterKey,
  type CatalogPageCopy,
  type CatalogProduct,
} from "@/lib/catalog"
import { ProductGrid } from "@/components/product-grid"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type Filters = Record<CatalogFilterKey, string[]>

const emptyFilters = (): Filters => ({
  silhouette: [],
  neckline: [],
  fabric: [],
})

function toggleValue(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value]
}

function matchesFilters(product: CatalogProduct, filters: Filters) {
  return CATALOG_FILTER_KEYS.every((key) => {
    const selected = filters[key]
    if (selected.length === 0) return true
    return selected.includes(product[key])
  })
}

function FilterGroups({
  groups,
  filters,
  onToggle,
}: {
  groups: CatalogFilterGroup[]
  filters: Filters
  onToggle: (key: CatalogFilterKey, value: string) => void
}) {
  return (
    <div>
      {groups.map((group) => (
        <fieldset
          key={group.key}
          className="border-b border-charcoal/10 py-5 first:pt-0"
        >
          <legend className="mb-3 text-xs font-semibold tracking-[0.14em] text-gold uppercase">
            {group.title}
          </legend>
          <ul className="flex flex-col gap-2">
            {group.options.map((option) => {
              const checked = filters[group.key].includes(option.value)
              return (
                <li key={option.value}>
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm font-light text-charcoal">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(group.key, option.value)}
                      className="size-3.5 shrink-0 rounded-none border-charcoal/30 accent-burgundy"
                    />
                    <span className={cn(checked && "text-burgundy")}>
                      {option.label}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        </fieldset>
      ))}
    </div>
  )
}

export function CollectionCatalog({
  products,
  groups,
  copy,
  contactLabel,
  locale,
  title,
}: {
  products: CatalogProduct[]
  groups: CatalogFilterGroup[]
  copy: CatalogPageCopy
  contactLabel: string
  locale: Locale
  title?: string
}) {
  const [filters, setFilters] = useState<Filters>(emptyFilters())
  const [sheetOpen, setSheetOpen] = useState(false)

  const filtered = useMemo(
    () => products.filter((product) => matchesFilters(product, filters)),
    [products, filters]
  )

  const visibleGroups = useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          options: group.options.filter((option) =>
            products.some((product) => product[group.key] === option.value)
          ),
        }))
        .filter((group) => group.options.length > 0),
    [groups, products]
  )

  const activeCount = CATALOG_FILTER_KEYS.reduce(
    (count, key) => count + filters[key].length,
    0
  )

  function toggle(key: CatalogFilterKey, value: string) {
    setFilters((current) => ({
      ...current,
      [key]: toggleValue(current[key], value),
    }))
  }

  const sidebar = (
    <FilterGroups groups={visibleGroups} filters={filters} onToggle={toggle} />
  )

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 sm:px-10 sm:py-16 lg:px-16">
      {title ? (
        <h1 className="mb-8 font-heading text-3xl font-medium tracking-[0.14em] text-burgundy-deep uppercase sm:mb-10 sm:text-4xl lg:pl-66 xl:pl-74">
          {title}
        </h1>
      ) : null}

      <div className="flex gap-10">
        <aside className="hidden w-56 shrink-0 lg:block xl:w-64">
          <div className="sticky top-28">
            <div className="mb-6 flex items-baseline justify-between gap-3">
              <h2 className="text-xs font-semibold tracking-[0.16em] text-charcoal uppercase">
                {copy.filters}
              </h2>
              {activeCount > 0 ? (
                <button
                  type="button"
                  onClick={() => setFilters(emptyFilters())}
                  className="text-[11px] tracking-[0.12em] text-burgundy uppercase hover:text-burgundy-deep"
                >
                  {copy.clear}
                </button>
              ) : null}
            </div>
            {sidebar}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="text-[11px] tracking-[0.16em] text-charcoal/60 uppercase">
              {filtered.length} {copy.results}
            </p>

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger
                nativeButton
                className="inline-flex items-center gap-2 border border-charcoal/80 px-4 py-2 text-[11px] tracking-[0.16em] text-charcoal uppercase lg:hidden"
              >
                <SlidersHorizontal className="size-3.5" />
                {copy.filters}
                {activeCount > 0 ? ` (${activeCount})` : ""}
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-80 max-w-[85vw] bg-ivory p-0"
                showCloseButton
              >
                <SheetHeader className="border-b border-charcoal/10 px-6 py-5">
                  <div className="flex items-center justify-between pr-8">
                    <SheetTitle className="text-xs tracking-[0.16em] text-charcoal uppercase">
                      {copy.filters}
                    </SheetTitle>
                    {activeCount > 0 ? (
                      <button
                        type="button"
                        onClick={() => setFilters(emptyFilters())}
                        className="text-[11px] tracking-[0.12em] text-burgundy uppercase hover:text-burgundy-deep"
                      >
                        {copy.clear}
                      </button>
                    ) : null}
                  </div>
                </SheetHeader>
                <div className="overflow-y-auto px-6 py-6">{sidebar}</div>
              </SheetContent>
            </Sheet>
          </div>

          {filtered.length > 0 ? (
            <ProductGrid
              products={filtered}
              locale={locale}
              contactLabel={contactLabel}
              columns={4}
              className="mx-0 max-w-none"
            />
          ) : (
            <p className="py-20 text-center text-sm font-light text-charcoal/60">
              {copy.empty}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
