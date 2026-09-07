import Image from "next/image"
import type { Dictionary } from "@/app/[locale]/dictionaries"
import { ScrollReveal } from "@/components/motion-primitives/scroll-reveal"

const PORTRAIT_IMAGE =
  "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80"
const FLORAL_IMAGE =
  "https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&w=900&q=80"

export function AboutSection({ copy }: { copy: Dictionary["home"]["about"] }) {
  return (
    <section id="about" className="bg-ivory px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.88fr)_minmax(0,0.7fr)] lg:gap-12 xl:gap-16">
        <ScrollReveal variant="fadeRight" className="flex flex-col items-center justify-center px-2 text-center sm:col-span-2 lg:col-span-1 lg:px-6 xl:px-10">
          <p className="text-[11px] font-medium tracking-[0.28em] text-gold uppercase">
            {copy.label}
          </p>
          <h2 className="mt-4 max-w-md font-heading text-3xl leading-[1.2] font-medium text-charcoal sm:text-4xl lg:text-[2.65rem]">
            {copy.headline}
          </h2>
          <Sprig className="mt-6 h-9 w-24 text-gold" />
          <p className="mt-6 max-w-md text-sm leading-relaxed font-light text-charcoal/75 sm:text-[15px]">
            {copy.body}
          </p>
          <a
            href="#footer"
            className="mt-8 inline-flex items-center justify-center bg-charcoal px-8 py-3 text-[11px] tracking-[0.22em] text-ivory uppercase transition-colors hover:bg-burgundy-deep"
          >
            {copy.cta}
          </a>
        </ScrollReveal>

        <ScrollReveal variant="scale" delay={0.12} className="relative aspect-2/3 min-h-72 overflow-hidden">
          <Image
            src={PORTRAIT_IMAGE}
            alt={copy.portraitAlt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 32vw"
            className="object-cover object-center grayscale"
          />
        </ScrollReveal>

        <ScrollReveal variant="scale" delay={0.22} className="relative aspect-4/5 min-h-56 overflow-hidden sm:aspect-2/3 lg:aspect-4/5">
          <Image
            src={FLORAL_IMAGE}
            alt={copy.floralAlt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 26vw"
            className="object-cover object-center"
          />
        </ScrollReveal>
      </div>
    </section>
  )
}

function Sprig({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 36" fill="none" aria-hidden className={className}>
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 22c18-2 32-10 40-18 8 8 22 16 40 18" strokeWidth="1.1" />
        <path d="M48 4c-1 8-1 16 0 24" strokeWidth="1.1" />
        <path d="M40 12c-8-1-14 4-18 10" strokeWidth="0.9" />
        <path d="M56 12c8-1 14 4 18 10" strokeWidth="0.9" />
      </g>
      <g fill="currentColor" opacity="0.7">
        <ellipse cx="22" cy="14" rx="7" ry="3.2" transform="rotate(-28 22 14)" />
        <ellipse cx="32" cy="18" rx="6" ry="2.8" transform="rotate(-18 32 18)" />
        <ellipse cx="74" cy="14" rx="7" ry="3.2" transform="rotate(28 74 14)" />
        <ellipse cx="64" cy="18" rx="6" ry="2.8" transform="rotate(18 64 18)" />
        <ellipse cx="48" cy="8" rx="5" ry="2.4" transform="rotate(8 48 8)" />
      </g>
    </svg>
  )
}
