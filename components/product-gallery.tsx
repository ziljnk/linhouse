"use client"

import { useCallback, useEffect, useState, type KeyboardEvent } from "react"
import Image from "next/image"
import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

function Thumbs({
  images,
  selected,
  thumbnailLabel,
  onSelect,
  className,
}: {
  images: string[]
  selected: number
  thumbnailLabel: string
  onSelect: (index: number) => void
  className?: string
}) {
  return (
    <div className={className}>
      {images.map((image, index) => (
        <button
          key={`${image}-${index}`}
          type="button"
          onClick={() => onSelect(index)}
          aria-label={thumbnailLabel.replace("{n}", String(index + 1))}
          aria-current={selected === index}
          className={cn(
            "relative aspect-square shrink-0 overflow-hidden bg-charcoal/5 outline-none",
            selected === index
              ? "ring-1 ring-charcoal"
              : "ring-1 ring-transparent hover:ring-charcoal/30"
          )}
        >
          <Image src={image} alt="" fill sizes="80px" className="object-cover" />
        </button>
      ))}
    </div>
  )
}

export function ProductGallery({
  images,
  alt,
  prevLabel,
  nextLabel,
  thumbnailLabel,
}: {
  images: string[]
  alt: string
  prevLabel: string
  nextLabel: string
  thumbnailLabel: string
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const [selected, setSelected] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelected(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("reInit", onSelect)
    emblaApi.on("select", onSelect)
    return () => {
      emblaApi.off("reInit", onSelect)
      emblaApi.off("select", onSelect)
    }
  }, [emblaApi, onSelect])

  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi]
  )

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        emblaApi?.scrollPrev()
      } else if (event.key === "ArrowRight") {
        event.preventDefault()
        emblaApi?.scrollNext()
      }
    },
    [emblaApi]
  )

  const navClass =
    "absolute top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-charcoal/55 shadow-sm backdrop-blur-[2px] transition-colors hover:bg-white hover:text-charcoal"

  return (
    <div
      className="flex flex-col gap-3 outline-none lg:flex-row lg:items-start"
      role="region"
      aria-roledescription="carousel"
      aria-label={alt}
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <Thumbs
        images={images}
        selected={selected}
        thumbnailLabel={thumbnailLabel}
        onSelect={scrollTo}
        className="hidden w-20 shrink-0 flex-col gap-2 lg:flex"
      />

      <div className="relative min-w-0 flex-1 overflow-hidden bg-charcoal/5">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {images.map((image, index) => (
              <div
                key={`${image}-${index}`}
                className="relative min-w-0 shrink-0 grow-0 basis-full"
              >
                <div className="relative aspect-3/4 w-full">
                  <Image
                    src={image}
                    alt={alt}
                    fill
                    priority={index === 0}
                    sizes="(min-width: 1024px) 48vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => emblaApi?.scrollPrev()}
          aria-label={prevLabel}
          className={cn(navClass, "left-3")}
        >
          <ChevronLeft className="size-5" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={() => emblaApi?.scrollNext()}
          aria-label={nextLabel}
          className={cn(navClass, "right-3")}
        >
          <ChevronRight className="size-5" strokeWidth={1.5} />
        </button>
      </div>

      <Thumbs
        images={images}
        selected={selected}
        thumbnailLabel={thumbnailLabel}
        onSelect={scrollTo}
        className="flex gap-2 overflow-x-auto lg:hidden [&_button]:w-16"
      />
    </div>
  )
}
