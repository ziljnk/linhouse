import type { Dictionary } from "@/app/[locale]/dictionaries"
import { OptimizedImage } from "@/components/ui/optimized-image"

export function ReviewsPage({
  copy,
  items,
}: {
  copy: Dictionary["reviewsPage"]
  items: Dictionary["home"]["testimonials"]["items"]
}) {
  return (
    <main className="overflow-x-clip bg-ivory text-charcoal">
      <section className="px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-center font-heading text-3xl font-medium tracking-[0.16em] text-burgundy-deep uppercase sm:text-4xl">
            {copy.title}
          </h1>
          {copy.intro ? (
            <p className="mx-auto mt-6 max-w-2xl text-center text-base leading-relaxed font-light text-charcoal/70 sm:text-lg">
              {copy.intro}
            </p>
          ) : null}

          {items.length === 0 ? (
            <p className="mt-14 text-center text-sm font-light text-charcoal/70">{copy.empty}</p>
          ) : (
            <ul className="mt-14 grid items-stretch gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <li key={`${item.name}-${item.image}`} className="flex">
                  <article className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-blush shadow-[0_18px_50px_rgba(43,36,32,0.08)]">
                    <div className="relative aspect-3/4 shrink-0">
                      <OptimizedImage
                        src={item.image}
                        alt={item.imageAlt}
                        fill
                        sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col px-5 py-5">
                      <p className="font-heading text-lg font-medium tracking-wide text-burgundy-deep">
                        {item.name}
                      </p>
                      <p className="mt-1 min-h-[1.1em] text-[11px] tracking-[0.14em] text-gold uppercase">
                        {item.meta.map((row) => row.value).join(" · ")}
                      </p>
                      {item.quote ? (
                        <p className="mt-3 text-base leading-relaxed font-light text-charcoal/80 sm:text-lg">
                          {item.quote}
                        </p>
                      ) : null}
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  )
}
