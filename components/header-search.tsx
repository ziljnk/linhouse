"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Search, X } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import type { Dictionary, Locale } from "@/app/[locale]/dictionaries"
import {
  searchStorefrontAction,
  type StorefrontSearchHit,
} from "@/app/[locale]/search/actions"
import {
  SEARCH_QUERY_MAX_LENGTH,
  SEARCH_QUERY_MIN_LENGTH,
} from "@/lib/search-query"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const iconButtonClass = "inline-flex size-9 items-center justify-center"

const typeOrder = ["product", "collection", "blog"] as const

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const listVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.02,
    },
  },
}

const groupVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.045 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: EASE },
  },
}

type SearchGroup = {
  type: (typeof typeOrder)[number]
  title: string
  items: StorefrontSearchHit[]
}

export function HeaderSearch({
  locale,
  nav,
}: {
  locale: Locale
  nav: Dictionary["nav"]
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<StorefrontSearchHit[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const requestId = useRef(0)

  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!open) return

    const q = query.trim()
    if (q.length < SEARCH_QUERY_MIN_LENGTH) {
      requestId.current += 1
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    const timer = window.setTimeout(async () => {
      const id = ++requestId.current
      try {
        const next = await searchStorefrontAction({ locale, query: q })
        if (id !== requestId.current) return
        setResults(next)
      } catch {
        if (id !== requestId.current) return
        setResults([])
      } finally {
        if (id === requestId.current) setLoading(false)
      }
    }, 250)

    return () => window.clearTimeout(timer)
  }, [locale, open, query])

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      requestId.current += 1
      setQuery("")
      setResults([])
      setLoading(false)
    }
  }

  const groups = typeOrder
    .map((type) => ({
      type,
      title:
        type === "product"
          ? nav.searchProducts
          : type === "collection"
            ? nav.searchCollections
            : nav.searchBlog,
      items: results.filter((item) => item.type === type),
    }))
    .filter((group) => group.items.length > 0)

  const trimmed = query.trim()

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger nativeButton className={iconButtonClass} aria-label={nav.search}>
        <Search className="size-4" />
      </SheetTrigger>
      <SheetContent
        side="top"
        showCloseButton={false}
        className="max-h-[min(80vh,40rem)] gap-0 bg-background p-0 sm:max-w-none"
      >
        <SheetHeader className="space-y-0 border-b px-4 py-3 sm:px-6">
          <div className="mx-auto flex w-full max-w-3xl items-center gap-2">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <SheetTitle className="sr-only">{nav.search}</SheetTitle>
            <input
              ref={inputRef}
              value={query}
              maxLength={SEARCH_QUERY_MAX_LENGTH}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={nav.searchPlaceholder}
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <SheetClose
              nativeButton
              className={iconButtonClass}
              aria-label={nav.closeMenu}
            >
              <X className="size-4" />
            </SheetClose>
          </div>
        </SheetHeader>

        <div className="mx-auto w-full max-w-3xl overflow-y-auto px-4 py-4 sm:px-6">
          {trimmed.length < SEARCH_QUERY_MIN_LENGTH ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {trimmed ? nav.searchMinLength : nav.searchHint}
            </p>
          ) : groups.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {loading ? `${nav.search}…` : nav.searchEmpty}
            </p>
          ) : (
            <SearchResultGroups
              groups={groups}
              onSelect={() => setOpen(false)}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function SearchResultGroups({
  groups,
  onSelect,
}: {
  groups: SearchGroup[]
  onSelect: () => void
}) {
  const reduceMotion = useReducedMotion()
  const resultKey = groups
    .flatMap((group) => group.items.map((item) => `${item.type}:${item.slug}`))
    .join("|")

  return (
    <motion.div
      key={resultKey}
      className="flex flex-col gap-6 pb-2"
      initial={reduceMotion ? false : "hidden"}
      animate="visible"
      variants={listVariants}
    >
      {groups.map((group) => (
        <motion.section key={group.type} variants={groupVariants}>
          <motion.h3
            variants={itemVariants}
            className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-gold uppercase"
          >
            {group.title}
          </motion.h3>
          <motion.ul className="flex flex-col" variants={groupVariants}>
            {group.items.map((item) => (
              <motion.li
                key={`${item.type}-${item.slug}`}
                variants={itemVariants}
              >
                <Link
                  href={item.href}
                  className="flex items-center gap-3 py-2 text-sm text-charcoal hover:text-burgundy"
                  onClick={onSelect}
                >
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt=""
                      width={48}
                      height={64}
                      className="size-12 shrink-0 object-cover"
                    />
                  ) : (
                    <span className="size-12 shrink-0 bg-muted" />
                  )}
                  <span className="min-w-0 truncate">{item.title}</span>
                </Link>
              </motion.li>
            ))}
          </motion.ul>
        </motion.section>
      ))}
    </motion.div>
  )
}
