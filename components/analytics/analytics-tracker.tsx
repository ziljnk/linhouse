"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { firstTouchUtmSource } from "@/lib/analytics-source"

const SOURCE_KEY = "linhouse:source"

function readFirstTouchSource() {
  let stored: string | null = null
  try {
    stored = sessionStorage.getItem(SOURCE_KEY)
  } catch {
    stored = null
  }

  const fromUrl = new URLSearchParams(window.location.search).get("utm_source")
  const source = firstTouchUtmSource(stored, fromUrl)
  if (!source) return null

  if (stored !== source) {
    try {
      sessionStorage.setItem(SOURCE_KEY, source)
    } catch {
      // Private mode may block sessionStorage; still attribute this pageview.
    }
  }

  return source
}

function track(path: string) {
  if (typeof window === "undefined") return
  if (!path.startsWith("/vi") && !path.startsWith("/en")) return

  const source = readFirstTouchSource()

  const key = `linhouse:view:${path}`
  try {
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, "1")
  } catch {
    // Private mode may block sessionStorage; still send once per mount.
  }

  const payload = JSON.stringify({
    path,
    referrer: document.referrer || "",
    ...(source ? { source } : {}),
  })

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/analytics/view",
        new Blob([payload], { type: "application/json" })
      )
      return
    }
  } catch {
    // Fall through to fetch.
  }

  void fetch("/api/analytics/view", {
    method: "POST",
    body: payload,
    headers: { "Content-Type": "application/json" },
    keepalive: true,
  })
}

export function AnalyticsTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return
    track(pathname)
  }, [pathname])

  return null
}
