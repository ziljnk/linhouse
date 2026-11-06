"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { Check, Forward } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const CONFIRM_MS = 3000

type CopyStatus = "idle" | "copied" | "error"

async function writeClipboard(value: string) {
  const active = document.activeElement

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return true
    }
  } catch {
    // Permission can be denied. The legacy path below still works in some browsers.
  }

  try {
    const field = document.createElement("textarea")
    field.value = value
    field.setAttribute("readonly", "")
    field.setAttribute("aria-hidden", "true")
    field.style.position = "fixed"
    field.style.top = "0"
    field.style.left = "0"
    field.style.opacity = "0"
    document.body.append(field)
    field.focus()
    field.select()
    const copied = document.execCommand("copy")
    field.remove()
    if (active instanceof HTMLElement) active.focus()
    return copied
  } catch {
    if (active instanceof HTMLElement) active.focus()
    return false
  }
}

export function ProductCopyLink({
  url,
  tooltip,
  label,
  copied,
  failed,
  beside,
  children,
}: {
  url: string
  tooltip: string
  label: string
  copied: string
  failed: string
  beside: ReactNode
  children?: ReactNode
}) {
  const [status, setStatus] = useState<CopyStatus>("idle")
  const [hoverTooltip, setHoverTooltip] = useState(false)
  const timer = useRef<number | null>(null)
  const message = status === "copied" ? copied : status === "error" ? failed : ""

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)")
    const sync = () => setHoverTooltip(media.matches)
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [])

  useEffect(() => {
    return () => {
      if (timer.current != null) window.clearTimeout(timer.current)
    }
  }, [])

  function scheduleClear() {
    if (timer.current != null) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setStatus("idle"), CONFIRM_MS)
  }

  async function onCopy() {
    const ok = await writeClipboard(url)
    setStatus(ok ? "copied" : "error")
    scheduleClear()
  }

  const icon =
    status === "copied" ? (
      <Check aria-hidden className="size-5" strokeWidth={1.5} />
    ) : (
      <Forward aria-hidden className="size-5" strokeWidth={1.5} />
    )

  const button = (
    <button
      type="button"
      aria-label={label}
      data-copy-status={status}
      onClick={() => {
        void onCopy()
      }}
      className="inline-flex size-12 shrink-0 items-center justify-center rounded-none border border-charcoal/80 text-charcoal transition-colors hover:bg-charcoal hover:text-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy motion-reduce:transition-none"
    >
      {icon}
    </button>
  )

  return (
    <div className="mt-8 flex flex-col items-start gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {children}
        <div className="flex items-center gap-3">
          {beside}
          {hoverTooltip ? (
            <Tooltip>
              <TooltipTrigger delay={150} closeDelay={0} render={button} />
              <TooltipContent
                side="top"
                sideOffset={8}
                className="motion-reduce:animate-none motion-reduce:duration-0"
              >
                {tooltip}
              </TooltipContent>
            </Tooltip>
          ) : (
            button
          )}
        </div>
      </div>
      <p
        role="status"
        aria-live="polite"
        className={cn(
          "max-w-full text-sm leading-snug font-light text-charcoal",
          message ? "" : "sr-only"
        )}
      >
        {message}
      </p>
    </div>
  )
}
