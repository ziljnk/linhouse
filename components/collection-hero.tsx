"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { OptimizedImage } from "@/components/ui/optimized-image"
import type { CollectionItem } from "@/lib/catalog"
import { cn } from "@/lib/utils"

const EASE = [0.22, 1, 0.36, 1] as const

const storyToggleClass =
  "mt-3 text-[11px] font-medium tracking-[0.18em] text-ivory uppercase underline decoration-ivory/40 underline-offset-4 transition-colors hover:text-gold hover:decoration-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"

const storyVariants = {
  expanded: {
    opacity: [0.35, 1],
    y: [12, 0],
  },
  collapsed: {
    opacity: [0.35, 1],
    y: [-10, 0],
  },
}

export function CollectionHero({
  collection,
  readMoreLabel,
  showLessLabel,
}: {
  collection: CollectionItem
  readMoreLabel: string
  showLessLabel: string
}) {
  const storyRef = useRef<HTMLParagraphElement>(null)
  const collapseScrollRef = useRef(false)
  const [expanded, setExpanded] = useState(false)
  const [hasToggled, setHasToggled] = useState(false)
  const [canExpand, setCanExpand] = useState(false)
  const [collapsedHeight, setCollapsedHeight] = useState<number | null>(null)
  const [fullHeight, setFullHeight] = useState<number | null>(null)
  const reduceMotion = useReducedMotion()

  useLayoutEffect(() => {
    const story = storyRef.current
    if (!story) return

    const measure = () => {
      const style = getComputedStyle(story)
      const fontSize = parseFloat(style.fontSize)
      const parsedLineHeight = parseFloat(style.lineHeight)
      const lineHeight = Number.isFinite(parsedLineHeight)
        ? parsedLineHeight
        : fontSize * 1.625

      const previous = {
        height: story.style.height,
        overflow: story.style.overflow,
        display: story.style.display,
        webkitLineClamp: story.style.webkitLineClamp,
      }
      story.style.height = "auto"
      story.style.overflow = "visible"
      story.style.display = "block"
      story.style.webkitLineClamp = "unset"
      const full = Math.ceil(story.scrollHeight)
      story.style.height = previous.height
      story.style.overflow = previous.overflow
      story.style.display = previous.display
      story.style.webkitLineClamp = previous.webkitLineClamp

      const collapsed = Math.min(Math.ceil(lineHeight * 3), full)
      setFullHeight((current) => (current === full ? current : full))
      setCollapsedHeight((current) =>
        current === collapsed ? current : collapsed
      )
      setCanExpand(full > collapsed + 1)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(story)
    return () => observer.disconnect()
  }, [collection.subtitle])

  const ready = collapsedHeight != null && fullHeight != null
  const targetHeight =
    !ready || !canExpand ? "auto" : expanded ? fullHeight : collapsedHeight
  const animateStory = hasToggled && !reduceMotion

  return (
    <section className="relative isolate flex min-h-[min(72vh,38rem)] flex-col justify-end overflow-hidden bg-charcoal">
      <OptimizedImage
        src={collection.image}
        alt={collection.imageAlt}
        fill
        loading="eager"
        fetchPriority="high"
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />
      <div className="relative z-10 w-full">
        <div
          aria-hidden
          className="h-16 bg-linear-to-t from-black/75 to-transparent sm:hidden"
        />
        <div className="w-full min-w-0 bg-black/75 px-6 pt-1 pb-10 sm:max-w-[62%] sm:bg-transparent sm:px-10 sm:pt-16 sm:pb-14 lg:max-w-[50%] lg:px-16 lg:pb-16">
          <h1 className="font-heading text-4xl font-medium tracking-[0.14em] wrap-break-word text-ivory uppercase sm:text-5xl lg:text-6xl">
            {collection.name}
          </h1>
          {collection.subtitle ? (
            <>
              <motion.div
                initial={false}
                animate={{ height: targetHeight }}
                transition={{
                  duration: animateStory ? 0.5 : 0,
                  ease: EASE,
                }}
                onAnimationComplete={() => {
                  if (!collapseScrollRef.current) return
                  collapseScrollRef.current = false
                  storyRef.current?.scrollIntoView({ block: "nearest" })
                }}
                className="relative mt-3 overflow-hidden sm:mt-4"
              >
                <motion.p
                  ref={storyRef}
                  initial={false}
                  animate={
                    reduceMotion || !hasToggled
                      ? { opacity: 1, y: 0 }
                      : expanded
                        ? "expanded"
                        : "collapsed"
                  }
                  variants={storyVariants}
                  transition={{ duration: 0.5, ease: EASE }}
                  className={cn(
                    "pr-14 text-sm leading-relaxed font-light wrap-break-word whitespace-pre-line text-ivory/85 sm:pr-0 sm:text-base",
                    !ready && "line-clamp-3"
                  )}
                >
                  {collection.subtitle}
                </motion.p>
              </motion.div>
              {canExpand ? (
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => {
                    const next = !expanded
                    if (!next) collapseScrollRef.current = true
                    setHasToggled(true)
                    setExpanded(next)
                  }}
                  className={storyToggleClass}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={expanded ? "less" : "more"}
                      initial={
                        reduceMotion ? false : { opacity: 0, y: expanded ? 8 : -8 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      exit={
                        reduceMotion
                          ? { opacity: 0 }
                          : { opacity: 0, y: expanded ? -8 : 8 }
                      }
                      transition={{ duration: 0.28, ease: EASE }}
                      className="inline-block"
                    >
                      {expanded ? showLessLabel : readMoreLabel}
                    </motion.span>
                  </AnimatePresence>
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </section>
  )
}
