"use client"

import Masonry from "@/components/react-bits/masonry"
import type { CollectionGalleryItem } from "@/lib/catalog"

export function CollectionGallery({
  items,
}: {
  items: CollectionGalleryItem[]
}) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-12 sm:px-10 sm:py-16 lg:px-16">
      <Masonry
        items={items}
        ease="power3.out"
        duration={0.6}
        stagger={0.05}
        animateFrom="bottom"
        scaleOnHover
        hoverScale={0.95}
        blurToFocus
        colorShiftOnHover={false}
      />
    </section>
  )
}
