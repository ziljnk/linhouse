import Image from "next/image"
import type { Dictionary } from "@/app/[locale]/dictionaries"
import { cn } from "@/lib/utils"

export function ProductGrid({
  products,
  contactLabel,
  columns = 3,
}: {
  products: Dictionary["catalog"]
  contactLabel: string
  columns?: 3 | 4
}) {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2",
        columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
      )}
    >
      {products.map((product) => {
        const [code, ...rest] = product.name.split(" — ")
        const title = rest.join(" — ") || product.name

        return (
          <article key={product.name} className="flex flex-col bg-ivory">
            <div className="relative">
              <Image
                src={product.image}
                alt={product.name}
                width={800}
                height={1067}
                className="aspect-3/4 w-full object-cover"
              />
              <span className="pointer-events-none absolute inset-x-0 bottom-4 text-center font-heading text-[13px] tracking-[0.28em] text-ivory uppercase drop-shadow">
                LINHouse
              </span>
            </div>
            <div className="px-4 pt-5 pb-7 text-center uppercase">
              {title ? (
                <p className="mb-1 text-[11px] tracking-[0.16em] text-gold">{code}</p>
              ) : null}
              <h3 className="text-xs font-normal tracking-[0.08em] leading-relaxed text-charcoal">
                {title || code}
              </h3>
              <a
                href="#footer"
                className="mt-4 inline-block text-xs tracking-[0.18em] text-burgundy hover:text-burgundy-deep"
              >
                {contactLabel}
              </a>
            </div>
          </article>
        )
      })}
    </div>
  )
}
