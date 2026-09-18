import Image from "next/image"
import Link from "next/link"
import type { Locale } from "@/app/[locale]/dictionaries"
import { ScrollReveal } from "@/components/motion-primitives/scroll-reveal"
import {
  parseProductName,
  productHref,
  productPriceLabel,
  productSlug,
  showsProductPrice,
  type CatalogProduct,
} from "@/lib/catalog"
import { cn } from "@/lib/utils"

export function ProductGrid({
  products,
  locale,
  contactLabel,
  columns = 3,
  className,
}: {
  products: CatalogProduct[]
  locale: Locale
  contactLabel: string
  columns?: 3 | 4
  className?: string
}) {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-6xl grid-cols-2 gap-3 sm:gap-4",
        columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
        className
      )}
    >
      {products.map((product, index) => {
        const { code, title } = parseProductName(product.name)
        const href = productHref(locale, product)

        return (
          <ScrollReveal
            key={productSlug(product)}
            className="h-full"
            delay={(index % columns) * 0.08}
            duration={0.7}
          >
            <article className="flex h-full flex-col bg-ivory">
              <Link href={href} className="relative block">
                <Image
                  src={product.image}
                  alt={product.name}
                  width={800}
                  height={1067}
                  className="aspect-3/4 w-full object-cover"
                />
                <span className="pointer-events-none absolute inset-x-0 bottom-2 text-center font-heading text-[10px] tracking-[0.2em] text-ivory uppercase drop-shadow sm:bottom-4 sm:text-[13px] sm:tracking-[0.28em]">
                  LINHouse
                </span>
              </Link>
              <div className="px-2 pt-3 pb-5 text-center uppercase sm:px-4 sm:pt-5 sm:pb-7">
                {title ? (
                  <p className="mb-1 text-[10px] tracking-[0.12em] text-gold sm:text-[11px] sm:tracking-[0.16em]">
                    {code}
                  </p>
                ) : null}
                <h3 className="text-[11px] font-normal tracking-[0.06em] leading-relaxed text-charcoal sm:text-xs sm:tracking-[0.08em]">
                  <Link href={href} className="hover:text-burgundy">
                    {title || code}
                  </Link>
                </h3>
                {showsProductPrice(product) ? (
                  <p className="mt-3 text-[11px] tracking-[0.14em] text-burgundy sm:mt-4 sm:text-xs sm:tracking-[0.18em]">
                    {productPriceLabel(product, contactLabel)}
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
          </ScrollReveal>
        )
      })}
    </div>
  )
}
