"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { isPromotionPopupVisible } from "@/lib/promotion-popup"

function subscribeHydration() {
  return () => {}
}

function useHydrated() {
  return useSyncExternalStore(subscribeHydration, () => true, () => false)
}

type PromotionPopupProps = {
  storageKey: string
  alt: string
  href: string | null
  startsOn: string | null
  endsOn: string | null
  labels: {
    dialogLabel: string
    close: string
    viewOffer: string
  }
}

export function PromotionPopup({
  storageKey,
  alt,
  href,
  startsOn,
  endsOn,
  labels,
}: PromotionPopupProps) {
  const hydrated = useHydrated()
  const [dismissed, setDismissed] = useState(false)
  const visible =
    hydrated &&
    !dismissed &&
    isPromotionPopupVisible({ enabled: true, startsOn, endsOn }, new Date())

  if (!visible) return null

  return (
    <PromotionDialog
      storageKey={storageKey}
      alt={alt}
      href={href}
      labels={labels}
      onClose={() => setDismissed(true)}
    />
  )
}

function PromotionDialog({
  storageKey,
  alt,
  href,
  labels,
  onClose,
}: Omit<PromotionPopupProps, "startsOn" | "endsOn"> & { onClose: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const root = rootRef.current
    const dialog = dialogRef.current
    if (!root || !dialog) return

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const inerted: HTMLElement[] = []
    for (const child of Array.from(document.body.children)) {
      if (!(child instanceof HTMLElement) || child === root) continue
      if (child.hasAttribute("inert")) continue
      child.setAttribute("inert", "")
      inerted.push(child)
    }

    const previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = "hidden"
    closeRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== "Tab") return

      const items = [
        ...dialog.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
      ]
      if (items.length === 0) {
        event.preventDefault()
        dialog.focus()
        return
      }

      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      for (const element of inerted) element.removeAttribute("inert")
      document.documentElement.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [])

  const dialogLabel = alt.trim() || labels.dialogLabel
  const image = (
    <OptimizedImage
      storageKey={storageKey}
      alt={alt}
      fill
      draggable={false}
      sizes="(min-width: 768px) 520px, 85vw"
      srcWidth={1200}
      loading="eager"
      fetchPriority="high"
      className="object-cover"
    />
  )

  return createPortal(
    <div ref={rootRef} className="fixed inset-0 z-[70]">
      <div
        className="absolute inset-0 bg-[rgba(36,24,28,0.58)]"
        onClick={() => onCloseRef.current()}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={dialogLabel}
        tabIndex={-1}
        className="absolute top-1/2 left-1/2 aspect-[4/5] w-[min(85vw,calc(60dvh*0.8))] -translate-x-1/2 -translate-y-[46%] overflow-hidden rounded-none bg-[#fdfbf8] shadow-[0_18px_50px_rgba(20,10,14,0.45)] outline-none md:w-[520px] md:-translate-y-1/2 md:shadow-[0_24px_70px_rgba(20,10,14,0.45)]"
      >
        {href ? (
          <a href={href} className="absolute inset-0 block cursor-pointer">
            {image}
            <span className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5 bg-[rgba(253,251,248,0.94)] px-2 py-1.5 text-[9px] font-medium tracking-[0.16em] text-[#5b1d31] uppercase md:right-3.5 md:bottom-3.5 md:px-2.5 md:py-[7px] md:text-[10px]">
              {labels.viewOffer}
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="size-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </a>
        ) : (
          image
        )}
        <button
          ref={closeRef}
          type="button"
          aria-label={labels.close}
          onClick={() => onCloseRef.current()}
          className="absolute top-1.5 right-1.5 z-10 grid size-11 place-items-center rounded-none border border-[#e6ded4] bg-[rgba(253,251,248,0.94)] text-[#302b2c] outline-none focus-visible:[outline:2px_solid_#762a40] focus-visible:outline-offset-2 md:top-2.5 md:right-2.5"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="size-[18px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  )
}
