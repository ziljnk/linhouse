"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

function track(path: string) {
  if (typeof window === "undefined") return
  if (!path.startsWith("/vi") && !path.startsWith("/en")) return

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
