"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toastError, toastSuccess } from "@/lib/admin-toast"
import {
  buildShareLink,
  DEFAULT_SHARE_TARGET,
  SHARE_PLATFORMS,
  type SharePlatformId,
} from "@/lib/share-link"

export function ShareLinkCard() {
  const [target, setTarget] = useState(DEFAULT_SHARE_TARGET)
  const [campaign, setCampaign] = useState("")
  const [copied, setCopied] = useState<SharePlatformId | null>(null)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(null), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  const links = useMemo(
    () =>
      SHARE_PLATFORMS.map((platform) => ({
        ...platform,
        result: buildShareLink({ target, platform: platform.id, campaign }),
      })),
    [campaign, target]
  )
  const error = links.find((item) => !item.result.ok)?.result
  const errorMessage = error && !error.ok ? error.error : null

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
          Gắn nguồn để lượt xem từ Facebook, TikTok, Instagram, Zalo và YouTube
          được tính đúng kênh, kể cả khi trình duyệt trong app không gửi referrer.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="share-target">Đường dẫn storefront</Label>
          <Input
            id="share-target"
            value={target}
            spellCheck={false}
            aria-invalid={Boolean(errorMessage)}
            aria-describedby={errorMessage ? "share-target-error" : undefined}
            placeholder={DEFAULT_SHARE_TARGET}
            onChange={(event) => setTarget(event.target.value)}
          />
          {errorMessage ? (
            <p id="share-target-error" className="text-sm text-destructive">
              {errorMessage}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Dán URL trên linhouse.com.vn hoặc đường dẫn bắt đầu bằng /vi hoặc /en.
              Để trống để dùng trang chủ.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="share-campaign">Tên chiến dịch (không bắt buộc)</Label>
          <Input
            id="share-campaign"
            value={campaign}
            placeholder="Ví dụ: bst cuoi 2026"
            onChange={(event) => setCampaign(event.target.value)}
          />
        </div>

        <ul className="flex flex-col gap-2">
          {links.map((item) => {
            const url = item.result.ok ? item.result.url : null
            return (
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
                    disabled={!url}
                    onClick={() => {
                      if (url) void copyLink(item.id, url)
                    }}
                  >
                    {copied === item.id ? "Đã sao chép" : "Sao chép"}
                  </Button>
                </div>
                <p className="mt-1.5 break-all font-mono text-xs text-muted-foreground">
                  {url ?? "—"}
                </p>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
