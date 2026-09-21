import { OptimizedImage } from "@/components/ui/optimized-image"
import type { CollectionItem } from "@/lib/catalog"

export function CollectionHero({
  collection,
}: {
  collection: CollectionItem
}) {
  return (
    <section className="relative isolate h-[min(72vh,38rem)] min-h-80 overflow-hidden bg-charcoal">
      <OptimizedImage
        src={collection.image}
        alt={collection.imageAlt}
        fill
        loading="eager"
        fetchPriority="high"
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-10 sm:px-10 sm:pb-14 lg:px-16 lg:pb-16">
        <div className="w-full max-w-[50%]">
          <h1 className="font-heading text-4xl font-medium tracking-[0.14em] text-ivory uppercase sm:text-5xl lg:text-6xl">
            {collection.name}
          </h1>
          <p className="mt-3 text-sm leading-relaxed font-light text-ivory/85 sm:mt-4 sm:text-base">
            {collection.subtitle}
          </p>
        </div>
      </div>
    </section>
  )
}
