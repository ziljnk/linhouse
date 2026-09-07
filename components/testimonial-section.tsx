"use client"

import { useMemo } from "react"
import type { Dictionary } from "@/app/[locale]/dictionaries"
import {
  CoverflowCarousel,
  type CoverflowSlide,
} from "@/components/ui/coverflow-carousel"

export function TestimonialSection({
  copy,
}: {
  copy: Dictionary["home"]["testimonials"]
}) {
  const slides: CoverflowSlide[] = useMemo(
    () =>
      copy.items.map((item) => ({
        src: item.image,
        alt: item.imageAlt,
        title: item.name,
        subtitle: item.quote,
        meta: item.meta,
      })),
    [copy.items]
  )

  return (
    <section id="reviews" className="scroll-mt-24 bg-blush py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <p className="text-center text-[11px] font-medium tracking-[0.28em] text-gold uppercase">
          {copy.label}
        </p>
        <h2 className="mt-4 mb-6 text-center font-heading text-3xl font-medium tracking-[0.16em] text-burgundy-deep uppercase sm:mb-8 sm:text-4xl">
          {copy.title}
        </h2>
      </div>

      <CoverflowCarousel
        slides={slides}
        loop
        autoplay
        pauseOnHover
        showCaption
        captionPlacement="overlay"
        showNavigation
        label={copy.title}
        cardWidth="clamp(200px, 32vw, 340px)"
        cardClassName="rounded-2xl bg-ivory shadow-[0_18px_50px_rgba(43,36,32,0.18)]"
      />
    </section>
  )
}
