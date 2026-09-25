"use client"

import { useState } from "react"
import Image from "next/image"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import type { Dictionary } from "@/app/[locale]/dictionaries"
import { cn } from "@/lib/utils"

const EASE = [0.22, 1, 0.36, 1] as const

export function AboutJourney({
  copy,
}: {
  copy: Pick<Dictionary["aboutPage"], "journeyTitle" | "milestones">
}) {
  const [active, setActive] = useState(0)
  const reduceMotion = useReducedMotion()
  const milestone = copy.milestones[active] ?? copy.milestones[0]
  const activeIndex = copy.milestones[active] ? active : 0

  if (!milestone) return null

  const motionProps = reduceMotion
    ? { initial: false as const }
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
        transition: { duration: 0.45, ease: EASE },
      }

  return (
    <section className="px-6 pt-8 pb-20 sm:px-10 lg:px-16 lg:pt-12 lg:pb-28">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-xl font-heading text-[clamp(2.6rem,6vw,5.15rem)] leading-[0.95] font-semibold tracking-[-0.045em] whitespace-pre-line text-charcoal">
          {copy.journeyTitle}
        </h2>

        <div className="mt-14 grid items-start gap-10 lg:mt-20 lg:grid-cols-[7.5rem_minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12 xl:gap-16">
          <div
            role="tablist"
            aria-label={copy.journeyTitle}
            className="flex gap-x-6 gap-y-2 overflow-x-auto lg:flex-col lg:gap-4 lg:overflow-visible"
          >
            {copy.milestones.map((item, index) => {
              const selected = index === activeIndex
              return (
                <button
                  key={`${item.year}-${index}`}
                  type="button"
                  role="tab"
                  id={`about-year-${index}`}
                  aria-selected={selected}
                  aria-controls="about-journey-panel"
                  onClick={() => setActive(index)}
                  className={cn(
                    "shrink-0 text-left font-heading tracking-tight transition-colors",
                    selected
                      ? "text-[1.65rem] font-semibold text-charcoal"
                      : "text-lg font-medium text-charcoal/35 hover:text-charcoal/70"
                  )}
                >
                  {item.year}
                </button>
              )
            })}
          </div>

          <div
            role="tabpanel"
            id="about-journey-panel"
            aria-labelledby={`about-year-${activeIndex}`}
            aria-live="polite"
            className="min-w-0"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={`${milestone.year}-${activeIndex}`} {...motionProps}>
                <h3 className="font-heading text-[1.05rem] leading-snug font-medium text-charcoal sm:text-lg">
                  {milestone.title}
                </h3>
                <p className="mt-4 max-w-md text-base leading-relaxed font-light text-charcoal/70 sm:text-lg">
                  {milestone.body}
                </p>
                <p className="mt-8 font-heading text-[clamp(4.5rem,9vw,7.5rem)] leading-none font-semibold tracking-tighter text-charcoal">
                  {milestone.year}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="relative aspect-4/3 overflow-hidden rounded-3xl bg-blush">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${milestone.image}-${activeIndex}`}
                className="absolute inset-0"
                {...motionProps}
              >
                <Image
                  src={milestone.image}
                  alt={milestone.imageAlt}
                  fill
                  sizes="(min-width: 1024px) 36vw, 100vw"
                  className={cn(
                    "object-cover",
                    milestone.image.endsWith("bridal.webp")
                      ? "object-[78%_center]"
                      : "object-center"
                  )}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
