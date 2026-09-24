import Image from "next/image"
import type { Dictionary } from "@/app/[locale]/dictionaries"
import { AboutFaq } from "@/components/about-faq"
import { AboutJourney } from "@/components/about-journey"
import { ScrollReveal } from "@/components/motion-primitives/scroll-reveal"

export function AboutPage({ copy }: { copy: Dictionary["aboutPage"] }) {
  return (
    <main className="overflow-x-clip bg-ivory text-charcoal">
      <section className="px-3 pt-3 sm:px-6 sm:pt-5 lg:px-10">
        <div className="relative mx-auto max-w-360">
          <div className="relative h-[min(70vw,28rem)] overflow-hidden sm:h-[min(58vh,34rem)] lg:h-[min(62vh,38rem)]">
            <Image
              src="/hero/bridal.webp"
              alt={copy.heroAlt}
              fill
              priority
              sizes="100vw"
              className="object-cover object-[78%_center]"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-ivory via-ivory/75 to-transparent" />
          </div>
          <h1 className="relative z-10 mt-[-0.55em] px-1 text-center font-heading text-[clamp(3.5rem,11vw,9.25rem)] leading-[0.82] font-semibold tracking-[-0.045em] text-charcoal sm:px-3">
            {copy.title}
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-xl px-6 py-20 text-center sm:py-24 lg:py-32">
        <ScrollReveal>
          <p className="text-sm text-charcoal/55">{copy.eyebrow}</p>
          <h2 className="mt-6 font-heading text-[clamp(2rem,4.6vw,3.35rem)] leading-[1.12] font-semibold tracking-[-0.03em] text-charcoal">
            {copy.headline}
          </h2>
          <p className="mx-auto mt-6 max-w-md text-base leading-relaxed font-light text-charcoal/70 sm:text-lg">
            {copy.body}
          </p>
          <a
            href="#values"
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-charcoal/25 px-5 py-2 text-sm text-charcoal transition-colors hover:border-charcoal hover:bg-charcoal hover:text-ivory"
          >
            {copy.valuesCta}
            <span aria-hidden="true">→</span>
          </a>
        </ScrollReveal>
      </section>

      <section
        className="relative px-6 py-20 sm:px-10 sm:py-24 lg:px-16"
        aria-label={copy.statement}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 size-[min(52vw,20rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[36px] sm:blur-[52px]"
        />
        <p className="relative z-10 text-center font-heading text-[clamp(2.75rem,7vw,6.5rem)] leading-[0.95] font-semibold tracking-tighter text-balance text-charcoal">
          {copy.statement}
        </p>
      </section>

      <section
        id="values"
        className="scroll-mt-28 px-6 py-20 sm:px-10 lg:px-16 lg:py-28"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <ScrollReveal>
            <div>
              {copy.pillars.map((pillar) => (
                <article
                  key={pillar.label}
                  className="border-t border-charcoal/15 py-7 first:pt-0 sm:py-8"
                >
                  <p className="text-[13px] text-charcoal/45">{pillar.label}</p>
                  <h2 className="mt-3 font-heading text-[1.65rem] leading-snug font-semibold tracking-tight text-charcoal sm:text-3xl">
                    {pillar.title}
                  </h2>
                  <p className="mt-3 max-w-md text-base leading-relaxed font-light text-charcoal/70 sm:text-lg">
                    {pillar.body}
                  </p>
                </article>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal variant="fadeLeft" className="lg:pl-4">
            <div className="relative aspect-5/4 overflow-hidden rounded-3xl bg-blush">
              <Image
                src="/hero/appointment.jpg"
                alt={copy.pillarsImageAlt}
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      <AboutJourney copy={copy} />
      <AboutFaq copy={copy.faq} />
    </main>
  )
}
