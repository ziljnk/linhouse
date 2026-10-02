import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import type { Locale } from "@/app/[locale]/dictionaries"
import { OptimizedImage } from "@/components/ui/optimized-image"
import {
  ScrollRevealGroup,
  ScrollRevealItem,
} from "@/components/motion-primitives/scroll-reveal"
import { cn } from "@/lib/utils"

const HERO_IMAGE = "/hero/bridal.webp"
const HERO_BLUR =
  "data:image/webp;base64,UklGRnIAAABXRUJQVlA4IGYAAAAQBACdASoYAAwAPu1krU2ppaSiMAgBMB2JZwDG9Gk7UWtVyzvfkqDOAAD+/jJCc+6TDFH0jnoE+AkjgQAy0t/bgMrjINnh1Xb6Ok+be5gcY0G4kWBp4dK3iDhXCIZ+QvtJEAYoAAA="

const CTA_CLASS =
  "mt-8 inline-flex w-fit items-center justify-center border border-charcoal/80 px-8 py-3 text-[11px] tracking-[0.22em] text-charcoal uppercase transition-colors hover:bg-charcoal hover:text-ivory"

export function HeroSection({
  locale,
  copy,
  preview = false,
}: {
  locale: Locale
  copy: {
    headline: string
    subhead: string
    description: string
    cta: string
    imageAlt: string
    imageUrl: string
  }
  preview?: boolean
}) {
  const imageSrc = copy.imageUrl || HERO_IMAGE
  const isDefaultHero = imageSrc === HERO_IMAGE
  const imageClassName = "object-cover object-[80%_center] lg:object-top"
  const frameClass = preview
    ? "h-[min(36rem,calc(100svh-9rem))]"
    : "min-h-128 sm:min-h-144 lg:min-h-[min(68vh,42rem)]"
  const blocks: Array<{ id: string; node: ReactNode }> = [
    {
      id: "headline",
      node: (
        <h1 className="font-heading text-[clamp(1.125rem,7.6cqi,2.75rem)] leading-[1.15] font-medium whitespace-nowrap text-burgundy-deep">
          {copy.headline}
        </h1>
      ),
    },
    {
      id: "subhead",
      node: (
        <p className="mt-4 text-[11px] font-medium tracking-[0.18em] text-gold uppercase sm:text-xs">
          {copy.subhead}
        </p>
      ),
    },
    {
      id: "description",
      node: (
        <p className="mt-6 max-w-md text-base leading-relaxed font-light text-charcoal/75 sm:text-lg">
          {copy.description}
        </p>
      ),
    },
    {
      id: "cta",
      node: preview ? (
        <span className={CTA_CLASS}>{copy.cta}</span>
      ) : (
        <Link href={`/${locale}/catalog/all-gowns`} className={CTA_CLASS}>
          {copy.cta}
        </Link>
      ),
    },
  ]
  return (
    <section className={cn("relative isolate overflow-hidden bg-ivory", frameClass)}>
      {isDefaultHero ? (
        <Image
          src={HERO_IMAGE}
          alt={copy.imageAlt}
          fill
          priority={!preview}
          quality={80}
          sizes="100vw"
          placeholder="blur"
          blurDataURL={HERO_BLUR}
          className={imageClassName}
        />
      ) : (
        <OptimizedImage
          src={imageSrc}
          alt={copy.imageAlt}
          fill
          loading="eager"
          fetchPriority="high"
          sizes="100vw"
          className={imageClassName}
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-ivory from-12% via-ivory/70 via-42% to-transparent to-72% lg:hidden" />

      <div
        className={cn(
          "relative z-10 flex items-center px-6 py-16 pb-28 sm:px-10 lg:px-16 xl:px-24",
          frameClass
        )}
      >
        {preview ? (
          <div className="@container w-full max-w-xl">
            {blocks.map((block) => (
              <div key={block.id}>{block.node}</div>
            ))}
          </div>
        ) : (
          <ScrollRevealGroup className="@container w-full max-w-xl" stagger={0.14} delay={0.08}>
            {blocks.map((block) => (
              <ScrollRevealItem key={block.id}>{block.node}</ScrollRevealItem>
            ))}
          </ScrollRevealGroup>
        )}
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
