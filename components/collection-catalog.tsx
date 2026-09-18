"use client"

import { useRef, useState } from "react"
import { SlidersHorizontal } from "lucide-react"
import { loadCatalogPage } from "@/app/[locale]/catalog/actions"
import type { Locale } from "@/app/[locale]/dictionaries"
import {
  CATALOG_INITIAL_PAGE_SIZE,
  CATALOG_LOAD_MORE_SIZE,
  type CatalogFilterGroup,
  type CatalogPageCopy,
  type CatalogProduct,
} from "@/lib/catalog"
import { ProductGrid } from "@/components/product-grid"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type Filters = Record<string, string[]>

function emptyFilters(groups: CatalogFilterGroup[]): Filters {
  return Object.fromEntries(groups.map((group) => [group.key, []]))
}

function toggleValue(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value]
}

function selectedCount(filters: Filters, key: string) {
  return filters[key]?.length ?? 0
}

function initialOpenKeys(groups: CatalogFilterGroup[], filters: Filters) {
  const selected = groups
    .filter((group) => selectedCount(filters, group.key) > 0)
    .map((group) => group.key)
  if (selected.length > 0) return selected
  return groups[0] ? [groups[0].key] : []
}

function FilterGroups({
  groups,
  filters,
  onToggle,
}: {
  groups: CatalogFilterGroup[]
  filters: Filters
  onToggle: (key: string, value: string) => void
}) {
  const [open, setOpen] = useState(() => initialOpenKeys(groups, filters))

  return (
    <Accordion
      multiple
      value={open}
      onValueChange={setOpen}
      className="w-full"
    >
      {groups.map((group) => {
        const count = selectedCount(filters, group.key)
        const hasSelection = count > 0

        return (
          <AccordionItem
            key={group.key}
            value={group.key}
            className="border-charcoal/10"
          >
            <AccordionTrigger
              className={cn(
                "items-center rounded-none py-3.5 hover:no-underline",
                hasSelection ? "text-burgundy" : "text-gold"
              )}
            >
              <span className="flex min-w-0 items-center gap-2 pr-3">
                <span className="truncate text-xs font-semibold tracking-[0.14em] uppercase">
                  {group.title}
                </span>
                {hasSelection ? (
                  <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-burgundy px-1 text-[10px] leading-none font-semibold tracking-normal text-ivory tabular-nums">
                    {count}
                  </span>
                ) : null}
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-4 [&_a]:no-underline">
              <ul className="flex flex-col gap-2">
                {group.options.map((option) => {
                  const checked = (filters[group.key] ?? []).includes(
                    option.value
                  )
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
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}

export function CollectionCatalog({
  slug,
  initialProducts,
  initialTotal,
  groups,
  copy,
  contactLabel,
  locale,
  title,
}: {
  slug: string
  initialProducts: CatalogProduct[]
  initialTotal: number
  groups: CatalogFilterGroup[]
  copy: CatalogPageCopy
  contactLabel: string
  locale: Locale
  title?: string
}) {
  const [filters, setFilters] = useState<Filters>(() => emptyFilters(groups))
  const [sheetOpen, setSheetOpen] = useState(false)
  const [products, setProducts] = useState(initialProducts)
  const [total, setTotal] = useState(initialTotal)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadingFilters, setLoadingFilters] = useState(false)
  const filtersRef = useRef(filters)
  const requestId = useRef(0)
  const loadingMoreRef = useRef(false)

  const hasMore = products.length < total
  const activeCount = Object.values(filters).reduce(
    (count, selected) => count + selected.length,
    0
  )

  function setNextFilters(next: Filters) {
    filtersRef.current = next
    setFilters(next)
    void fetchPage({
      nextFilters: next,
      offset: 0,
      limit: CATALOG_INITIAL_PAGE_SIZE,
      replace: true,
    })
  }

  async function fetchPage({
    nextFilters,
    offset,
    limit,
    replace,
  }: {
    nextFilters: Filters
    offset: number
    limit: number
    replace: boolean
  }) {
    const id = replace ? ++requestId.current : requestId.current
    if (replace) setLoadingFilters(true)
    else {
      loadingMoreRef.current = true
      setLoadingMore(true)
    }

    try {
      const result = await loadCatalogPage({
        locale,
        slug,
        filters: nextFilters,
        offset,
        limit,
      })
      if (id !== requestId.current) return

      setTotal(result.total)
      setProducts((current) => {
        if (replace) return result.products
        const seen = new Set(current.map((item) => item.slug ?? item.name))
        return [
          ...current,
          ...result.products.filter(
            (item) => !seen.has(item.slug ?? item.name)
          ),
        ]
      })
    } catch {
      if (id !== requestId.current) return
    } finally {
      if (replace) {
        if (id === requestId.current) setLoadingFilters(false)
      } else {
        loadingMoreRef.current = false
        setLoadingMore(false)
      }
    }
  }

  function toggle(key: string, value: string) {
    setNextFilters({
      ...filtersRef.current,
      [key]: toggleValue(filtersRef.current[key] ?? [], value),
    })
  }

  function clearFilters() {
    setNextFilters(emptyFilters(groups))
  }

  function loadMore() {
    if (loadingMoreRef.current || loadingFilters || !hasMore) return
    void fetchPage({
      nextFilters: filtersRef.current,
      offset: products.length,
      limit: CATALOG_LOAD_MORE_SIZE,
      replace: false,
    })
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 sm:px-10 sm:py-16 lg:px-16">
      {title ? (
        <h1 className="mb-8 font-heading text-3xl font-medium tracking-[0.14em] text-burgundy-deep uppercase sm:mb-10 sm:text-4xl lg:pl-66 xl:pl-74">
          {title}
        </h1>
      ) : null}

      <div className="flex gap-10">
        <aside className="hidden w-56 shrink-0 lg:block xl:w-64">
          <div className="sticky top-28 max-h-[calc(100dvh-8.5rem)] overflow-y-auto overscroll-contain pr-1">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="text-xs font-semibold tracking-[0.16em] text-charcoal uppercase">
                {copy.filters}
              </h2>
              {activeCount > 0 ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-[11px] tracking-[0.12em] text-burgundy uppercase hover:text-burgundy-deep"
                >
                  {copy.clear}
                </button>
              ) : null}
            </div>
            <FilterGroups groups={groups} filters={filters} onToggle={toggle} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="text-[11px] tracking-[0.16em] text-charcoal/60 uppercase">
              {total} {copy.results}
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
                className="h-dvh max-h-dvh w-80 max-w-[85vw] gap-0 overflow-hidden bg-ivory p-0"
                showCloseButton
              >
                <SheetHeader className="shrink-0 border-b border-charcoal/10 px-6 py-5">
                  <div className="flex items-center justify-between pr-8">
                    <SheetTitle className="text-xs tracking-[0.16em] text-charcoal uppercase">
                      {copy.filters}
                    </SheetTitle>
                    {activeCount > 0 ? (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="text-[11px] tracking-[0.12em] text-burgundy uppercase hover:text-burgundy-deep"
                      >
                        {copy.clear}
                      </button>
                    ) : null}
                  </div>
                </SheetHeader>
                <div className="h-0 min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y px-6 py-6">
                  <FilterGroups
                    groups={groups}
                    filters={filters}
                    onToggle={toggle}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {total > 0 ? (
            <>
              <div
                aria-busy={loadingFilters || loadingMore}
                className={cn(
                  "transition-opacity",
                  loadingFilters && "opacity-50"
                )}
              >
                <ProductGrid
                  products={products}
                  locale={locale}
                  contactLabel={contactLabel}
                  columns={4}
                  className="mx-0 max-w-none"
                />
              </div>
              {hasMore ? (
                <div className="mt-10 flex justify-center lg:mt-14">
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore || loadingFilters}
                    className="inline-flex items-center justify-center border border-charcoal/80 px-8 py-3 text-[11px] tracking-[0.22em] text-charcoal uppercase transition-colors hover:bg-charcoal hover:text-ivory disabled:pointer-events-none disabled:opacity-50"
                  >
                    {copy.loadMore}
                  </button>
                </div>
              ) : null}
            </>
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
