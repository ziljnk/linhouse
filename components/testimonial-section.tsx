"use client"

import { useMemo } from "react"
import Link from "next/link"
import type { Dictionary, Locale } from "@/app/[locale]/dictionaries"
import { InfiniteSlider } from "@/components/motion-primitives/infinite-slider"
import { ProgressiveBlur } from "@/components/motion-primitives/progressive-blur"
import { ScrollReveal } from "@/components/motion-primitives/scroll-reveal"
import { OptimizedImage } from "@/components/ui/optimized-image"

export function TestimonialSection({
  locale,
  copy,
}: {
  locale: Locale
  copy: Dictionary["home"]["testimonials"]
}) {
  const slides = useMemo(
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
        <ScrollReveal>
          <p className="text-center text-[11px] font-medium tracking-[0.28em] text-gold uppercase">
            {copy.label}
          </p>
          <h2 className="mt-4 mb-8 text-center font-heading text-3xl font-medium tracking-[0.16em] text-burgundy-deep uppercase sm:mb-10 sm:text-4xl">
            {copy.title}
          </h2>
        </ScrollReveal>
      </div>

      <ScrollReveal delay={0.12} variant="fade" className="relative w-full overflow-hidden">
        <InfiniteSlider
          gap={24}
          speed={48}
          speedOnHover={0}
          className="w-full py-4"
        >
          {slides.map((slide) => (
            <Link
              key={slide.src}
              href={`/${locale}/reviews`}
              className="relative block aspect-3/4 w-[min(62vw,240px)] shrink-0 overflow-hidden rounded-2xl bg-ivory shadow-[0_18px_50px_rgba(43,36,32,0.18)]"
            >
              <OptimizedImage
                src={slide.src}
                alt={slide.alt}
                draggable={false}
                sizes="240px"
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/50 to-transparent px-4 pt-14 pb-4 text-ivory">
                {slide.title ? (
                  <p className="font-heading text-base font-medium tracking-wide">
                    {slide.title}
                  </p>
                ) : null}
                {slide.subtitle ? (
                  <p className="mt-1.5 line-clamp-3 text-[13px] leading-snug italic text-ivory/90">
                    {slide.subtitle}
                  </p>
                ) : null}
                {slide.meta && slide.meta.length > 0 ? (
                  <p className="mt-2.5 text-[11px] tracking-[0.14em] text-ivory/70 uppercase">
                    {slide.meta.map((row) => row.value).join(" · ")}
                  </p>
                ) : null}
              </div>
            </Link>
          ))}
        </InfiniteSlider>
        <ProgressiveBlur
          className="pointer-events-none absolute top-0 left-0 h-full w-[120px] sm:w-[200px]"
          direction="left"
          blurIntensity={1}
        />
        <ProgressiveBlur
          className="pointer-events-none absolute top-0 right-0 h-full w-[120px] sm:w-[200px]"
          direction="right"
          blurIntensity={1}
        />
      </ScrollReveal>
    </section>
  )
}
