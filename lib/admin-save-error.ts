"use client"

import { toast } from "@/components/ui/toast"
import { toastError } from "@/lib/admin-toast"
import {
  ADMIN_SERVER_BUSY_MESSAGE,
  ADMIN_SERVER_BUSY_RETRY_LABEL,
  isAdminServerBusyError,
  isUnauthenticatedAdminError,
} from "@/lib/admin-request-errors"

export function reportAdminFailure(
  error: unknown,
  options: {
    fallback: string
    onRetry?: () => void
    onUnauthenticated?: () => void
  }
) {
  const online = typeof navigator === "undefined" ? undefined : navigator.onLine
  if (isUnauthenticatedAdminError(error)) {
    if (options.onUnauthenticated) options.onUnauthenticated()
    else toastError("Phiên đăng nhập đã hết hạn.")
    return "unauthenticated" as const
  }
  if (isAdminServerBusyError(error, { online })) {
    toast.add({
      type: "error",
      title: ADMIN_SERVER_BUSY_MESSAGE,
      timeout: 60_000,
      actionProps: {
        children: ADMIN_SERVER_BUSY_RETRY_LABEL,
        onClick: () => options.onRetry?.(),
      },
    })
    return "busy" as const
  }
  toastError(error instanceof Error && error.message ? error.message : options.fallback)
  return "other" as const
}
