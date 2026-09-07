import Image from "next/image"
import Link from "next/link"
import type { Dictionary, Locale } from "@/app/[locale]/dictionaries"
import {
  ScrollRevealGroup,
  ScrollRevealItem,
} from "@/components/motion-primitives/scroll-reveal"

export function HeroSection({
  locale,
  copy,
}: {
  locale: Locale
  copy: Dictionary["home"]
}) {
  return (
    <section className="relative isolate min-h-128 overflow-hidden bg-ivory sm:min-h-144 lg:min-h-[min(68vh,42rem)]">
      <Image
        src="/hero/bridal.png"
        alt={copy.imageAlt}
        fill
        priority
        quality={90}
        sizes="100vw"
        className="object-cover object-[80%_center] lg:object-top"
      />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-ivory from-12% via-ivory/70 via-42% to-transparent to-72% lg:hidden" />

      <div className="relative z-10 flex min-h-128 items-center px-6 py-16 pb-28 sm:min-h-144 sm:px-10 lg:min-h-[min(68vh,42rem)] lg:px-16 xl:px-24">
        <ScrollRevealGroup className="max-w-xl" stagger={0.14} delay={0.08}>
          <ScrollRevealItem>
            <h1 className="font-heading text-4xl leading-[1.15] font-medium text-burgundy-deep sm:text-5xl xl:text-6xl">
              {copy.headline}
            </h1>
          </ScrollRevealItem>
          <ScrollRevealItem>
            <p className="mt-4 text-[11px] font-medium tracking-[0.18em] text-gold uppercase sm:text-xs">
              {copy.subhead}
            </p>
          </ScrollRevealItem>
          <ScrollRevealItem>
            <p className="mt-6 max-w-md text-sm leading-relaxed font-light text-charcoal/75 sm:text-[15px]">
              {copy.description}
            </p>
          </ScrollRevealItem>
          <ScrollRevealItem>
            <Link
              href={`/${locale}/catalog/all-gowns`}
              className="mt-8 inline-flex w-fit items-center justify-center border border-charcoal/80 px-8 py-3 text-[11px] tracking-[0.22em] text-charcoal uppercase transition-colors hover:bg-charcoal hover:text-ivory"
            >
              {copy.cta}
            </Link>
          </ScrollRevealItem>
        </ScrollRevealGroup>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-1 h-44">
        <div className="absolute inset-x-0 bottom-0 h-full mask-[linear-gradient(to_bottom,transparent,black_45%)] backdrop-blur-[2px]" />
        <div className="absolute inset-x-0 bottom-0 h-[70%] mask-[linear-gradient(to_bottom,transparent,black_50%)] backdrop-blur-sm" />
        <div className="absolute inset-x-0 bottom-0 h-[45%] mask-[linear-gradient(to_bottom,transparent,black_55%)] backdrop-blur-md" />
        <div className="absolute inset-x-0 bottom-0 h-[28%] mask-[linear-gradient(to_bottom,transparent,black_60%)] backdrop-blur-xl" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-ivory via-ivory/80 to-transparent" />
      </div>
    </section>
  )
}
