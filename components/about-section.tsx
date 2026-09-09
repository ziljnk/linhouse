import type { Dictionary } from "@/app/[locale]/dictionaries"
import {
  ScrollReveal,
  ScrollRevealGroup,
  ScrollRevealItem,
} from "@/components/motion-primitives/scroll-reveal"

export function AboutSection({ copy }: { copy: Dictionary["home"]["about"] }) {
  return (
    <section
      id="about"
      className="scroll-mt-24 bg-ivory px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-medium tracking-[0.28em] text-gold uppercase">
            {copy.label}
          </p>
          <h2 className="mt-4 font-heading text-3xl leading-[1.2] font-medium text-burgundy-deep sm:text-4xl lg:text-[2.75rem]">
            {copy.headline}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed font-light text-charcoal/75 sm:text-[15px]">
            {copy.body}
          </p>
        </ScrollReveal>

        <ScrollRevealGroup
          className="mt-14 grid grid-cols-1 gap-10 sm:mt-16 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:gap-x-10 xl:gap-x-14"
          stagger={0.1}
          delay={0.08}
        >
          {copy.steps.map((step) => (
            <ScrollRevealItem
              key={step.number}
              className="border-t border-burgundy-deep pt-5"
            >
              <h3 className="flex items-baseline gap-2.5 text-burgundy-deep">
                <span className="shrink-0 font-heading text-xl font-medium tabular-nums">
                  {step.number}
                </span>
                <span className="font-heading text-[1.05rem] leading-snug font-medium sm:text-lg">
                  {step.title}
                </span>
              </h3>
              <p className="mt-4 text-sm leading-relaxed font-light text-charcoal/70">
                {step.body}
              </p>
            </ScrollRevealItem>
          ))}
        </ScrollRevealGroup>
      </div>
    </section>
  )
}
