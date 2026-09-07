"use client"

import { useState } from "react"
import type { Dictionary } from "@/app/[locale]/dictionaries"
import { ProductGrid } from "@/components/product-grid"

const PAGE_SIZE = 8

const buttonClass =
  "inline-flex items-center justify-center border border-charcoal/80 px-8 py-3 text-[11px] tracking-[0.22em] text-charcoal uppercase transition-colors hover:bg-charcoal hover:text-ivory"

export function FeaturedProducts({
  products,
  title,
  loadMore,
  showLess,
  contactLabel,
}: {
  products: Dictionary["catalog"]
  title: string
  loadMore: string
  showLess: string
  contactLabel: string
}) {
  const [visible, setVisible] = useState(PAGE_SIZE)
  const shown = products.slice(0, visible)
  const hasMore = visible < products.length
  const canShowLess = visible > PAGE_SIZE

  function collapse() {
    setVisible(PAGE_SIZE)
    document.getElementById("featured")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <section id="featured" className="scroll-mt-24 bg-ivory px-6 py-16 sm:px-10 sm:py-20 lg:py-24">
      <h2 className="mx-auto mb-10 max-w-6xl text-center font-heading text-3xl font-medium tracking-[0.16em] text-burgundy-deep uppercase sm:mb-14 sm:text-4xl">
        {title}
      </h2>
      <ProductGrid products={shown} contactLabel={contactLabel} columns={4} />
      {hasMore || canShowLess ? (
        <div className="mt-10 flex flex-wrap justify-center gap-3 sm:mt-14">
          {hasMore ? (
            <button
              type="button"
              onClick={() => setVisible((count) => count + PAGE_SIZE)}
              className={buttonClass}
            >
              {loadMore}
            </button>
          ) : null}
          {canShowLess ? (
            <button type="button" onClick={collapse} className={buttonClass}>
              {showLess}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
