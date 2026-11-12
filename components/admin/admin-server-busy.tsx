"use client"

import { Button } from "@/components/ui/button"
import {
  ADMIN_SERVER_BUSY_MESSAGE,
  ADMIN_SERVER_BUSY_RETRY_LABEL,
} from "@/lib/admin-request-errors"

export function AdminServerBusyNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm"
      role="alert"
    >
      <p>{ADMIN_SERVER_BUSY_MESSAGE}</p>
      <Button type="button" size="sm" className="mt-3" onClick={onRetry}>
        {ADMIN_SERVER_BUSY_RETRY_LABEL}
      </Button>
    </div>
  )
}
