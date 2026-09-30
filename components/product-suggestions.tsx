"use client"

import { useId, useMemo, useRef, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import Autoplay from "embla-carousel-autoplay"
import { OptimizedImage } from "@/components/ui/optimized-image"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import {
  recommendedProducts,
  relatedProducts,
  type ProductKind,
} from "@/lib/catalog"

export type ProductSuggestion = {
  slug: string
  name: string
  kind?: ProductKind
  code?: string
  title: string
  image: string
  href: string
  priceLabel: string | null
}

const subscribe = () => () => {}

function useProductRails(
  products: ProductSuggestion[],
  current: { slug: string; name: string; kind?: ProductKind }
) {
  const cache = useRef<{
    key: string
    related: ProductSuggestion[]
    recommended: ProductSuggestion[]
  } | null>(null)
  const key = `${current.slug}:${products.map((item) => item.slug).join("|")}`

  return useSyncExternalStore(
    subscribe,
    () => {
      if (cache.current?.key === key) return cache.current
      const related = relatedProducts(products, current)
      const recommended = recommendedProducts(products, current, related)
      const next = { key, related, recommended }
      cache.current = next
      return next
    },
    () => null
  )
}

function ProductRail({
  title,
  products,
  contactLabel,
}: {
  title: string
  products: ProductSuggestion[]
  contactLabel: string
}) {
  const titleId = useId()
  const [autoplay] = useState(() =>
    Autoplay({
      delay: 2000,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
    })
  )
  const plugins = useMemo(() => [autoplay], [autoplay])
  const canLoop = products.length > 1

  if (products.length === 0) return null

  return (
    <section
      className="mt-16 border-t border-charcoal/10 pt-12 sm:mt-20 sm:pt-16"
      aria-labelledby={titleId}
    >
      <Carousel
        opts={{ align: "start", loop: canLoop, slidesToScroll: 1 }}
        plugins={canLoop ? plugins : undefined}
        aria-labelledby={titleId}
      >
        <h2
          id={titleId}
          className="mb-8 text-center font-heading text-2xl font-medium tracking-[0.16em] text-burgundy-deep uppercase sm:mb-10 sm:text-3xl"
        >
          {title}
        </h2>
        <CarouselContent className="-ml-3 sm:-ml-4">
          {products.map((product) => (
            <CarouselItem
              key={product.slug}
              className="basis-1/2 pl-3 sm:pl-4 lg:basis-1/4"
            >
              <article className="flex h-full flex-col bg-ivory">
                <Link href={product.href} className="block">
                  <OptimizedImage
                    src={product.image}
                    alt={product.title}
                    width={800}
                    height={1067}
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="aspect-3/4 w-full object-cover"
                  />
                </Link>
                <div className="px-2 pt-3 pb-5 text-center uppercase sm:px-4 sm:pt-5 sm:pb-7">
                  {product.code ? (
                    <p className="mb-1 text-[10px] tracking-[0.12em] text-gold sm:text-[11px] sm:tracking-[0.16em]">
                      {product.code}
                    </p>
                  ) : null}
                  <h3 className="text-[11px] leading-relaxed font-normal tracking-[0.06em] text-charcoal sm:text-xs sm:tracking-[0.08em]">
                    <Link href={product.href} className="hover:text-burgundy">
                      {product.title}
                    </Link>
                  </h3>
                  {product.priceLabel ? (
                    <p className="mt-3 text-[11px] tracking-[0.14em] text-burgundy sm:mt-4 sm:text-xs sm:tracking-[0.18em]">
                      {product.priceLabel}
                    </p>
                  ) : (
                    <a
                      href="#footer"
                      className="mt-3 inline-block text-[11px] tracking-[0.14em] text-burgundy hover:text-burgundy-deep sm:mt-4 sm:text-xs sm:tracking-[0.18em]"
                    >
                      {contactLabel}
                    </a>
                  )}
                </div>
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  )
}

export function ProductSuggestions({
  current,
  products,
  relatedTitle,
  recommendedTitle,
  contactLabel,
}: {
  current: { slug: string; name: string; kind?: ProductKind }
  products: ProductSuggestion[]
  relatedTitle: string
  recommendedTitle: string
  contactLabel: string
}) {
  const rails = useProductRails(products, current)

  if (!rails) return null

  return (
    <>
      <ProductRail
        title={relatedTitle}
        products={rails.related}
        contactLabel={contactLabel}
      />
      <ProductRail
        title={recommendedTitle}
        products={rails.recommended}
        contactLabel={contactLabel}
      />
    </>
  )
}
