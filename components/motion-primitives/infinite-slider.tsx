"use client";

import { cn } from "@/lib/utils";
import { animate, motion, useMotionValue } from "motion/react";
import { useEffect, useState } from "react";
import useMeasure from "react-use-measure";

export type InfiniteSliderProps = {
  children: React.ReactNode;
  gap?: number;
  speed?: number;
  speedOnHover?: number;
  direction?: "horizontal" | "vertical";
  reverse?: boolean;
  className?: string;
};

export function InfiniteSlider({
  children,
  gap = 16,
  speed = 100,
  speedOnHover,
  direction = "horizontal",
  reverse = false,
  className,
}: InfiniteSliderProps) {
  const [isHovering, setIsHovering] = useState(false);
  const currentSpeed =
    isHovering && speedOnHover !== undefined ? speedOnHover : speed;
  const [ref, { width, height }] = useMeasure();
  const translation = useMotionValue(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    const size = direction === "horizontal" ? width : height;
    if (!size) return;

    const contentSize = size + gap;
    const from = reverse ? -contentSize / 2 : 0;
    const to = reverse ? 0 : -contentSize / 2;

    if (currentSpeed === 0) return;

    const distanceToTravel = Math.abs(to - from);
    const duration = distanceToTravel / currentSpeed;

    const controls = isTransitioning
      ? animate(translation, [translation.get(), to], {
          ease: "linear",
          duration: Math.abs(translation.get() - to) / currentSpeed,
          onComplete: () => {
            setIsTransitioning(false);
            setKey((prevKey) => prevKey + 1);
          },
        })
      : animate(translation, [from, to], {
          ease: "linear",
          duration,
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: 0,
          onRepeat: () => {
            translation.set(from);
          },
        });

    return () => controls.stop();
  }, [
    key,
    translation,
    currentSpeed,
    width,
    height,
    gap,
    isTransitioning,
    direction,
    reverse,
  ]);

  const hoverProps =
    speedOnHover !== undefined
      ? {
          onHoverStart: () => {
            setIsTransitioning(true);
            setIsHovering(true);
          },
          onHoverEnd: () => {
            setIsTransitioning(true);
            setIsHovering(false);
          },
        }
      : {};

  return (
    <div className={cn("overflow-hidden", className)}>
      <motion.div
        className="flex w-max"
        style={{
          ...(direction === "horizontal"
            ? { x: translation }
            : { y: translation }),
          gap: `${gap}px`,
          flexDirection: direction === "horizontal" ? "row" : "column",
        }}
        ref={ref}
        {...hoverProps}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
}
