"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import Autoplay from "embla-carousel-autoplay"
import type { Dictionary, Locale } from "@/app/[locale]/dictionaries"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

const navButtonClass =
  "size-10 border-ivory/30 bg-transparent text-ivory hover:bg-ivory/10 hover:text-ivory disabled:text-ivory/40"

export function CollectionSection({
  locale,
  copy,
}: {
  locale: Locale
  copy: Dictionary["home"]["collection"]
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
    <section id="collection" className="bg-charcoal py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16">
        <h2 className="mb-10 text-center font-heading text-3xl font-medium tracking-[0.16em] text-ivory uppercase sm:mb-14 sm:text-4xl">
          {copy.title}
        </h2>

        <div className="px-10 sm:px-12">
          <Carousel
            opts={{ align: "start", loop: true }}
            plugins={plugins}
            className="w-full"
          >
            <CarouselContent className="-ml-5">
              {copy.items.map((item) => (
                <CarouselItem
                  key={item.href}
                  className="pl-5 basis-full sm:basis-1/2 lg:basis-1/3"
                >
                  <Link
                    href={`/${locale}${item.href}`}
                    className="group block h-full outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal"
                  >
                    <article className="relative aspect-3/4 overflow-hidden rounded-2xl bg-white/8">
                      <Image
                        src={item.image}
                        alt={item.imageAlt}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/75 via-black/15 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-6">
                        <h3 className="font-heading text-2xl font-medium tracking-[0.08em] text-ivory">
                          {item.name}
                        </h3>
                      </div>
                    </article>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className={navButtonClass} />
            <CarouselNext className={navButtonClass} />
          </Carousel>
        </div>
      </div>
    </section>
  )
}
