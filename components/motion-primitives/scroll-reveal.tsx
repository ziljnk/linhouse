"use client"

import type { ReactNode } from "react"
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react"

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
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={presets[variant]}
      transition={{ duration, delay, ease: EASE }}
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
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: stagger, delayChildren: delay },
        },
      }}
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
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      variants={presets[variant]}
      transition={{ duration, ease: EASE }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
