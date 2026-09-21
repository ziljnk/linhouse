"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Autoplay from "embla-carousel-autoplay"
import type { Locale } from "@/app/[locale]/dictionaries"
import { ScrollReveal } from "@/components/motion-primitives/scroll-reveal"
import type { CollectionItem } from "@/lib/catalog"
import { cn } from "@/lib/utils"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from "@/components/ui/carousel"
import { OptimizedImage } from "@/components/ui/optimized-image"

export function CollectionSection({
  locale,
  copy,
}: {
  locale: Locale
  copy: {
    title: string
    items: CollectionItem[]
  }
}) {
  const [autoplay] = useState(() =>
    Autoplay({
      delay: 4000,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    })
  )
  const plugins = useMemo(() => [autoplay], [autoplay])

  return (
    <section id="collection" className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16">
        <ScrollReveal>
          <h2 className="mb-10 text-center font-heading text-3xl font-medium tracking-[0.16em] text-burgundy-deep uppercase sm:mb-14 sm:text-4xl">
            {copy.title}
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.12}>
          <Carousel
            opts={{ align: "start", loop: true }}
            plugins={plugins}
            className="w-full"
          >
            <CarouselContent className="-ml-4 sm:-ml-5">
              {copy.items.map((item) => (
                <CarouselItem
                  key={item.href}
                  className="pl-4 basis-1/2 sm:pl-5 lg:basis-1/4"
                >
                  <Link
                    href={`/${locale}${item.href}`}
                    className="group block h-full outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    <article className="relative aspect-3/4 overflow-hidden rounded-2xl bg-white">
                      <OptimizedImage
                        src={item.image}
                        alt={item.imageAlt}
                        fill
                        sizes="(max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/75 via-black/15 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-6">
                        <h3 className="font-heading text-base font-medium tracking-[0.08em] text-ivory sm:text-2xl">
                          {item.name}
                        </h3>
                      </div>
                    </article>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselDots />
          </Carousel>
        </ScrollReveal>
      </div>
    </section>
  )
}

function CarouselDots() {
  const { api } = useCarousel()
  const [selected, setSelected] = useState(0)
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!api) return

    const sync = () => {
      setCount(api.scrollSnapList().length)
      setSelected(api.selectedScrollSnap())
    }

    sync()
    api.on("select", sync)
    api.on("reInit", sync)
    return () => {
      api.off("select", sync)
      api.off("reInit", sync)
    }
  }, [api])

  if (count <= 1) return null

  return (
    <div className="mt-8 flex items-center justify-center gap-2" role="tablist">
      {Array.from({ length: count }, (_, index) => {
        const isActive = index === selected
        return (
          <button
            key={index}
            type="button"
            role="tab"
            aria-label={`Slide ${index + 1}`}
            aria-selected={isActive}
            onClick={() => api?.scrollTo(index)}
            className={cn(
              "h-2 rounded-full transition-[width,background-color] duration-300",
              isActive ? "w-6 bg-charcoal/70" : "w-2 bg-charcoal/20 hover:bg-charcoal/35"
            )}
          />
        )
      })}
    </div>
  )
}
