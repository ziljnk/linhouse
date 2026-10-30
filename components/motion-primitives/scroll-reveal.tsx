"use client"

import { useSyncExternalStore, type ReactNode } from "react"
import { motion, type HTMLMotionProps, type Transition } from "motion/react"
import { cn } from "@/lib/utils"

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const presets = {
  fadeUp: {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0 },
  },
  fadeLeft: {
    hidden: { opacity: 0, x: 36 },
    visible: { opacity: 1, x: 0 },
  },
  fadeRight: {
    hidden: { opacity: 0, x: -36 },
    visible: { opacity: 1, x: 0 },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1 },
  },
} as const

export type RevealVariant = keyof typeof presets

const viewport = { once: true, amount: 0.18, margin: "0px 0px -8% 0px" } as const

// Straight to the resting pose. Identity x/y/scale clears the hidden
// transform that the hydration render has to share with the server.
const settled = {
  hidden: { opacity: 1, x: 0, y: 0, scale: 1 },
  visible: { opacity: 1, x: 0, y: 0, scale: 1 },
} as const

const instant: Transition = { duration: 0, delay: 0 }

// Always on the element so server and client markup match. The media query
// paints the settled state before hydration; inline motion styles do not win.
const reducedMotionClass = "motion-reduce:opacity-100! motion-reduce:transform-none!"

function revealClass(className?: string) {
  return cn(className, reducedMotionClass)
}

function subscribeReducedMotion(onChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)")
  media.addEventListener("change", onChange)
  return () => media.removeEventListener("change", onChange)
}

function reducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function reducedMotionServerSnapshot() {
  return false
}

/**
 * Server and the hydration render both report false so the motion tree and
 * its initial styles match. After hydration React re-renders with the real
 * media query, without a hydration mismatch.
 */
function useRevealReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    reducedMotionSnapshot,
    reducedMotionServerSnapshot
  )
}

type ScrollRevealProps = HTMLMotionProps<"div"> & {
  children: ReactNode
  variant?: RevealVariant
  delay?: number
  duration?: number
}

export function ScrollReveal({
  children,
  className,
  variant = "fadeUp",
  delay = 0,
  duration = 0.8,
  ...props
}: ScrollRevealProps) {
  const reduceMotion = useRevealReducedMotion()

  return (
    <motion.div
      className={revealClass(className)}
      {...(reduceMotion
        ? {
            initial: "visible" as const,
            animate: "visible" as const,
            variants: settled,
            transition: instant,
          }
        : {
            initial: "hidden" as const,
            whileInView: "visible" as const,
            viewport,
            variants: presets[variant],
            transition: { duration, delay, ease: EASE },
          })}
      {...props}
    >
      {children}
    </motion.div>
  )
}

type ScrollRevealGroupProps = HTMLMotionProps<"div"> & {
  children: ReactNode
  stagger?: number
  delay?: number
}

export function ScrollRevealGroup({
  children,
  className,
  stagger = 0.12,
  delay = 0,
  ...props
}: ScrollRevealGroupProps) {
  const reduceMotion = useRevealReducedMotion()

  return (
    <motion.div
      className={revealClass(className)}
      {...(reduceMotion
        ? {
            initial: "visible" as const,
            animate: "visible" as const,
            variants: {
              hidden: {},
              visible: {
                transition: { staggerChildren: 0, delayChildren: 0, duration: 0 },
              },
            },
          }
        : {
            initial: "hidden" as const,
            whileInView: "visible" as const,
            viewport,
            variants: {
              hidden: {},
              visible: {
                transition: { staggerChildren: stagger, delayChildren: delay },
              },
            },
          })}
      {...props}
    >
      {children}
    </motion.div>
  )
}

type ScrollRevealItemProps = HTMLMotionProps<"div"> & {
  children: ReactNode
  variant?: RevealVariant
  duration?: number
}

export function ScrollRevealItem({
  children,
  className,
  variant = "fadeUp",
  duration = 0.75,
  ...props
}: ScrollRevealItemProps) {
  const reduceMotion = useRevealReducedMotion()

  return (
    <motion.div
      className={revealClass(className)}
      variants={reduceMotion ? settled : presets[variant]}
      transition={reduceMotion ? instant : { duration, ease: EASE }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
