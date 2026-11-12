"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminServerBusyNotice } from "@/components/admin/admin-server-busy"
import { isBusyHttpStatus } from "@/lib/admin-request-errors"

function requestUrl(input: RequestInfo | URL) {
  if (typeof input === "string") return input
  if (input instanceof URL) return input.href
  return input.url
}

function isAdminPageGet(url: string, method: string) {
  if (method !== "GET") return false
  try {
    const parsed = new URL(url, window.location.origin)
    if (parsed.origin !== window.location.origin) return false
    if (parsed.pathname.startsWith("/api/")) return false
    if (parsed.pathname.startsWith("/_next/")) return false
    return parsed.pathname === "/admin" || parsed.pathname.startsWith("/admin/")
  } catch {
    return false
  }
}

let installed = 0
let originalFetch: typeof window.fetch | null = null
let blockHardNavigation = false
let blockTimer = 0

function holdNavigationBriefly() {
  blockHardNavigation = true
  window.clearTimeout(blockTimer)
  // Next falls back to a full page load immediately after a failed RSC fetch.
  // Block only that fallback, then allow real clicks again.
  blockTimer = window.setTimeout(() => {
    blockHardNavigation = false
  }, 750)
  window.dispatchEvent(new CustomEvent("linhouse-admin-busy"))
}

export function AdminPageLoadGuard() {
  const router = useRouter()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (installed === 0) {
      originalFetch = window.fetch.bind(window)
      const baseFetch = originalFetch
      window.fetch = async (input, init) => {
        const url = requestUrl(input)
        const method = (
          init?.method ?? (input instanceof Request ? input.method : "GET")
        ).toUpperCase()
        const watched = isAdminPageGet(url, method)
        try {
          const response = await baseFetch(input, init)
          if (watched && isBusyHttpStatus(response.status)) {
            holdNavigationBriefly()
          }
          return response
        } catch (error) {
          if (watched) holdNavigationBriefly()
          throw error
        }
      }
      const navigation = (
        window as Window & {
          navigation?: {
            addEventListener: (
              type: "navigate",
              listener: (event: Event & { destination: { url: string } }) => void
            ) => void
          }
        }
      ).navigation
      navigation?.addEventListener("navigate", (event) => {
        if (!blockHardNavigation || !event.cancelable) return
        const destination = new URL(event.destination.url)
        if (destination.origin !== window.location.origin) return
        if (destination.pathname === "/admin" || destination.pathname.startsWith("/admin/")) {
          event.preventDefault()
        }
      })
    }
    installed += 1

    const onBusy = () => setFailed(true)
    window.addEventListener("linhouse-admin-busy", onBusy)
    return () => {
      window.removeEventListener("linhouse-admin-busy", onBusy)
      installed -= 1
      if (installed === 0 && originalFetch) {
        window.fetch = originalFetch
        originalFetch = null
      }
    }
  }, [])

  if (!failed) return null

  return (
    <div className="border-b px-4 py-3">
      <AdminServerBusyNotice
        onRetry={() => {
          blockHardNavigation = false
          setFailed(false)
          router.refresh()
        }}
      />
    </div>
  )
}
