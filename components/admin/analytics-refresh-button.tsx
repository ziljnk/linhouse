"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AnalyticsRefreshButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      aria-label="Cập nhật số liệu"
      onClick={() => {
        startTransition(() => {
          router.refresh()
        })
      }}
    >
      <RefreshCw className={pending ? "animate-spin" : undefined} />
      {pending ? "Đang cập nhật" : "Cập nhật"}
    </Button>
  )
}
