"use client"

import { useState } from "react"
import Link from "next/link"
import { Heart, Trash2, X } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import type { Dictionary, Locale } from "@/app/[locale]/dictionaries"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { parseProductName } from "@/lib/catalog"
import { removeWishlistItem, useWishlist } from "@/lib/wishlist"

const iconButtonClass = "relative inline-flex size-9 items-center justify-center"

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

export function HeaderWishlist({
  locale,
  nav,
}: {
  locale: Locale
  nav: Dictionary["nav"]
}) {
  const [open, setOpen] = useState(false)
  const [exiting, setExiting] = useState(false)
  const items = useWishlist()
  const count = items.length
  const reduceMotion = useReducedMotion() ?? false

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        nativeButton
        className={iconButtonClass}
        aria-label={nav.wishlist}
      >
        <Heart className={`size-4 ${count > 0 ? "fill-burgundy text-burgundy" : ""}`} />
        {count > 0 ? (
          <span className="absolute top-0.5 right-0.5 flex size-3.5 items-center justify-center rounded-full bg-burgundy text-[8px] leading-none text-ivory border border-ivory">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </SheetTrigger>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-[min(100%,22rem)] gap-0 overflow-hidden bg-background p-0"
      >
        <SheetHeader className="flex-row items-center justify-between space-y-0 border-b px-4 py-3">
          <SheetTitle className="text-[12.5px] tracking-[0.14em] uppercase">
            {nav.wishlist}
          </SheetTitle>
          <SheetClose
            nativeButton
            className={iconButtonClass}
            aria-label={nav.closeMenu}
          >
            <X className="size-4" />
          </SheetClose>
        </SheetHeader>

        <div className="relative flex-1 overflow-x-hidden overflow-y-auto">
          <ul className="flex flex-col">
            <AnimatePresence initial={false} onExitComplete={() => setExiting(false)}>
              {items.map((item) => {
                const { title, shortName } = parseProductName(item.name)

                return (
                  <motion.li
                    key={item.slug}
                    initial={false}
                    exit={
                      reduceMotion
                        ? { opacity: 0 }
                        : { x: 72, opacity: [0.5, 0] }
                    }
                    transition={{
                      duration: reduceMotion ? 0.16 : 0.42,
                      ease: EASE,
                      opacity: {
                        duration: reduceMotion ? 0.16 : 0.42,
                        ease: "linear",
                      },
                    }}
                    className="flex items-center gap-3 border-b border-charcoal/10 px-4 py-3 will-change-[transform,opacity]"
                  >
                    <Link
                      href={`/${locale}/product/${item.slug}`}
                      className="flex min-w-0 flex-1 items-center gap-3 hover:text-burgundy"
                      onClick={() => setOpen(false)}
                    >
                      <OptimizedImage
                        src={item.image}
                        alt={item.name}
                        width={56}
                        height={74}
                        sizes="56px"
                        className="size-14 shrink-0 object-cover"
                      />
                      <span className="min-w-0 truncate text-sm tracking-[0.04em] uppercase">
                        {title || shortName}
                      </span>
                    </Link>
                    <button
                      type="button"
                      className="inline-flex size-9 shrink-0 items-center justify-center text-charcoal/50 hover:text-burgundy"
                      aria-label={nav.removeWishlist}
                      onClick={() => {
                        setExiting(true)
                        removeWishlistItem(item.slug)
                      }}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
          {count === 0 && !exiting ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="px-4 py-10 text-center text-sm text-muted-foreground"
            >
              {nav.wishlistEmpty}
            </motion.p>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
