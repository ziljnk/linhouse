"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Autoplay from "embla-carousel-autoplay"
import type { Locale } from "@/app/[locale]/dictionaries"
import { ScrollReveal } from "@/components/motion-primitives/scroll-reveal"
import { OptimizedImage } from "@/components/ui/optimized-image"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from "@/components/ui/carousel"
import {
  productHref,
  productPriceLabel,
  productSlug,
  productTitle,
  showsProductPrice,
  type CatalogProduct,
} from "@/lib/catalog"
import type { HomeProductCarouselSlot } from "@/lib/home-product-carousels"
import { cn } from "@/lib/utils"

export type HomeProductCarouselModel = {
  slot: HomeProductCarouselSlot
  title: string
  products: CatalogProduct[]
}

const RUNNING_MIN = 5

export function HomeProductCarousels({
  carousels,
  locale,
  contactLabel,
}: {
  carousels: HomeProductCarouselModel[]
  locale: Locale
  contactLabel: string
}) {
  const visible = carousels.filter((carousel) => carousel.products.length > 0)
  if (visible.length === 0) return null

  return (
    <section className="bg-ivory px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-16 sm:gap-20 lg:gap-24">
        {visible.map((carousel) => (
          <ProductCarousel
            key={carousel.slot}
            carousel={carousel}
            locale={locale}
            contactLabel={contactLabel}
          />
        ))}
      </div>
    </section>
  )
}

function ProductCarousel({
  carousel,
  locale,
  contactLabel,
}: {
  carousel: HomeProductCarouselModel
  locale: Locale
  contactLabel: string
}) {
  const running = carousel.products.length >= RUNNING_MIN
  const [autoplay] = useState(() =>
    Autoplay({
      delay: carousel.slot === 1 ? 4200 : 5400,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    })
  )
  const headingId = `home-product-carousel-${carousel.slot}`

  return (
    <div aria-labelledby={carousel.title ? headingId : undefined}>
      {carousel.title ? (
        <ScrollReveal>
          <h2
            id={headingId}
            className="mb-10 text-center font-heading text-3xl font-medium tracking-[0.16em] text-burgundy-deep uppercase sm:mb-14 sm:text-4xl"
          >
            {carousel.title}
          </h2>
        </ScrollReveal>
      ) : null}
      {running ? (
        <Carousel
          opts={{ align: "start", loop: true }}
          plugins={[autoplay]}
          className="w-full"
        >
          <CarouselContent className="-ml-3 sm:-ml-4">
            {carousel.products.map((product) => (
              <CarouselItem
                key={productSlug(product)}
                className="basis-1/2 pl-3 sm:pl-4 lg:basis-1/4"
              >
                <ProductSlide product={product} locale={locale} contactLabel={contactLabel} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselDots />
        </Carousel>
      ) : (
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
          {carousel.products.map((product) => (
            <div
              key={productSlug(product)}
              className="w-[calc(50%-0.375rem)] sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]"
            >
              <ProductSlide product={product} locale={locale} contactLabel={contactLabel} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ProductSlide({
  product,
  locale,
  contactLabel,
}: {
  product: CatalogProduct
  locale: Locale
  contactLabel: string
}) {
  const href = productHref(locale, product)

  return (
    <article className="flex h-full flex-col">
      <Link href={href} className="block outline-none focus-visible:ring-2 focus-visible:ring-gold">
        <OptimizedImage
          src={product.image}
          alt={productTitle(product)}
          width={800}
          height={1067}
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="aspect-3/4 w-full object-cover"
        />
      </Link>
      <div className="px-2 pt-3 pb-2 text-center uppercase sm:px-3 sm:pt-4">
        {product.code ? (
          <p className="mb-1 text-[10px] tracking-[0.12em] text-gold sm:text-[11px] sm:tracking-[0.16em]">
            {product.code}
          </p>
        ) : null}
        <h3 className="text-[11px] leading-relaxed font-normal tracking-[0.06em] text-charcoal sm:text-xs sm:tracking-[0.08em]">
          <Link href={href} className="hover:text-burgundy">
            {productTitle(product)}
          </Link>
        </h3>
        {showsProductPrice(product) ? (
          <p className="mt-3 text-[11px] tracking-[0.14em] text-burgundy sm:text-xs sm:tracking-[0.18em]">
            {productPriceLabel(product, contactLabel)}
          </p>
        ) : (
          <a
            href="#footer"
            className="mt-3 inline-block text-[11px] tracking-[0.14em] text-burgundy hover:text-burgundy-deep sm:text-xs sm:tracking-[0.18em]"
          >
            {contactLabel}
          </a>
        )}
      </div>
    </article>
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
