"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { toastError, toastSuccess } from "@/lib/admin-toast"
import {
  shareHomepageLink,
  SHARE_PLATFORMS,
  type SharePlatformId,
} from "@/lib/share-link"

const SHARE_LINKS = SHARE_PLATFORMS.map((platform) => ({
  ...platform,
  url: shareHomepageLink(platform.id),
}))

export function ShareLinkCard() {
  const [copied, setCopied] = useState<SharePlatformId | null>(null)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(null), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  async function copyLink(platform: SharePlatformId, url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(platform)
      toastSuccess("Đã sao chép")
    } catch {
      toastError("Không sao chép được link.")
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
      <div className="mb-5">
        <h2 className="text-base font-semibold">Tạo link chia sẻ</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Gắn nguồn để lượt xem từ Facebook, Messenger, Instagram, Threads, TikTok,
          Zalo, YouTube và Pinterest được tính đúng kênh, kể cả khi trình duyệt
          trong app không gửi referrer.
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {SHARE_LINKS.map((item) => (
          <li
            key={item.id}
            className="rounded-lg border border-border px-3 py-2.5"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">{item.label}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void copyLink(item.id, item.url)
                }}
              >
                {copied === item.id ? "Đã sao chép" : "Sao chép"}
              </Button>
            </div>
            <p className="mt-1.5 break-all font-mono text-xs text-muted-foreground">
              {item.url}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
