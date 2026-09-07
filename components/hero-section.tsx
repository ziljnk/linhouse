import Image from "next/image"
import Link from "next/link"
import type { Dictionary, Locale } from "@/app/[locale]/dictionaries"

const MAIN_IMAGE =
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80"
const ARCH_IMAGE =
  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=900&q=80"

export function HeroSection({
  locale,
  copy,
}: {
  locale: Locale
  copy: Dictionary["home"]
}) {
  return (
    <section className="relative isolate min-h-[min(92vh,920px)] overflow-hidden bg-[color-mix(in_srgb,var(--ivory)_78%,var(--blush))]">
      <Botanical className="pointer-events-none absolute -top-8 -left-6 h-72 w-52 text-blush opacity-70 sm:h-80 sm:w-56" />
      <Botanical className="pointer-events-none absolute bottom-24 left-[28%] hidden h-64 w-48 -scale-x-100 text-blush opacity-50 lg:block" />

      <div className="relative grid min-h-[min(92vh,920px)] lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <div className="relative z-10 flex flex-col justify-center px-6 py-16 pb-28 sm:px-10 lg:px-16 lg:pr-40 xl:px-24 xl:pr-48">
          <h1 className="max-w-xl font-heading text-4xl leading-[1.15] font-medium text-burgundy-deep sm:text-5xl xl:text-6xl">
            {copy.headline}
          </h1>
          <p className="mt-4 text-[11px] font-medium tracking-[0.18em] text-gold uppercase sm:text-xs">
            {copy.subhead}
          </p>
          <p className="mt-6 max-w-md text-sm leading-relaxed font-light text-charcoal/75 sm:text-[15px]">
            {copy.description}
          </p>
          <Link
            href={`/${locale}/catalog/all-gowns`}
            className="mt-8 inline-flex w-fit items-center justify-center border border-charcoal/80 px-8 py-3 text-[11px] tracking-[0.22em] text-charcoal uppercase transition-colors hover:bg-charcoal hover:text-ivory"
          >
            {copy.cta}
          </Link>
        </div>

        <div className="relative h-[58vw] min-h-80 sm:h-[62vw] lg:h-auto lg:min-h-full">
          <div className="absolute inset-0">
            <Image
              src={MAIN_IMAGE}
              alt={copy.imageAlt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 48vw"
              className="object-cover object-[center_28%]"
            />
          </div>

          <div className="absolute top-1/2 left-5 z-20 size-36 -translate-y-1/2 sm:left-8 sm:size-48 lg:left-0 lg:size-[min(22vw,21rem)] lg:translate-x-[-50%]">
            <div className="relative size-full overflow-hidden rounded-full shadow-[0_18px_50px_rgba(43,36,32,0.22)] ring-4 ring-ivory">
              <Image
                src={ARCH_IMAGE}
                alt=""
                fill
                priority
                sizes="(max-width: 1024px) 40vw, 22vw"
                className="object-cover object-[center_20%]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-44">
        <div className="absolute inset-x-0 bottom-0 h-full mask-[linear-gradient(to_bottom,transparent,black_45%)] backdrop-blur-[2px]" />
        <div className="absolute inset-x-0 bottom-0 h-[70%] mask-[linear-gradient(to_bottom,transparent,black_50%)] backdrop-blur-sm" />
        <div className="absolute inset-x-0 bottom-0 h-[45%] mask-[linear-gradient(to_bottom,transparent,black_55%)] backdrop-blur-md" />
        <div className="absolute inset-x-0 bottom-0 h-[28%] mask-[linear-gradient(to_bottom,transparent,black_60%)] backdrop-blur-xl" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-ivory via-ivory/80 to-transparent" />
      </div>
    </section>
  )
}

function Botanical({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 320" fill="none" aria-hidden className={className}>
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M108 18c-4 62-28 108-8 292" strokeWidth="1.4" fill="none" />
        <path d="M106 70c-28-6-48 10-62 34" strokeWidth="1.1" fill="none" />
        <path d="M107 128c-32 4-54 28-66 58" strokeWidth="1.1" fill="none" />
        <path d="M108 188c24-2 46 16 58 42" strokeWidth="1.1" fill="none" />
        <path d="M109 236c-26 8-40 28-46 52" strokeWidth="1.1" fill="none" />
      </g>
      <g fill="currentColor" opacity="0.55">
        <ellipse cx="52" cy="92" rx="22" ry="11" transform="rotate(-28 52 92)" />
        <ellipse cx="70" cy="118" rx="18" ry="9" transform="rotate(-18 70 118)" />
        <ellipse cx="44" cy="168" rx="20" ry="10" transform="rotate(-38 44 168)" />
        <ellipse cx="62" cy="196" rx="16" ry="8" transform="rotate(-22 62 196)" />
        <ellipse cx="154" cy="214" rx="18" ry="9" transform="rotate(32 154 214)" />
        <ellipse cx="148" cy="246" rx="15" ry="8" transform="rotate(18 148 246)" />
        <ellipse cx="70" cy="268" rx="17" ry="8" transform="rotate(-40 70 268)" />
      </g>
    </svg>
  )
}
