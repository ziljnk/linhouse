"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AdminServerBusyNotice } from "@/components/admin/admin-server-busy"
import { isAdminServerBusyError } from "@/lib/admin-request-errors"

export default function AdminDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const online = typeof navigator === "undefined" ? undefined : navigator.onLine
  const busy = isAdminServerBusyError(error, { online }) || online === false

  if (busy) {
    return (
      <div className="p-6">
        <AdminServerBusyNotice onRetry={reset} />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm" role="alert">
        <p>Không tải được trang.</p>
        <Button type="button" size="sm" className="mt-3" onClick={reset}>
          Thử lại
        </Button>
      </div>
    </div>
  )
}
