"use client"

import { useState, useTransition, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2 } from "lucide-react"
import { saveNotificationEmailsAction } from "@/app/admin/(dashboard)/notifications/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toastError, toastSuccess } from "@/lib/admin-toast"
import {
  MAX_NOTIFICATION_EMAILS,
  validateNotificationEmails,
} from "@/lib/site-settings"

type EmailRow = {
  id: string
  value: string
}

function createRow(value = "", id?: string): EmailRow {
  return { id: id ?? crypto.randomUUID(), value }
}

function initialRows(defaultEmails: string[]): EmailRow[] {
  if (defaultEmails.length === 0) {
    return [createRow("", "email-0")]
  }
  return defaultEmails.map((value, index) => createRow(value, `email-${index}`))
}

export function NotificationSettingsForm({
  defaultEmails,
  fallbackEmail,
}: {
  defaultEmails: string[]
  fallbackEmail: string
}) {
  const router = useRouter()
  const [emails, setEmails] = useState<EmailRow[]>(() => initialRows(defaultEmails))
  const [isPending, startTransition] = useTransition()

  const canAdd = emails.length < MAX_NOTIFICATION_EMAILS

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const result = validateNotificationEmails(emails.map((row) => row.value))
    if (!result.ok) {
      toastError(result.error)
      return
    }

    startTransition(async () => {
      const response = await saveNotificationEmailsAction(result.data)
      if (!response.ok) {
        toastError(response.error)
        return
      }

      setEmails(
        result.data.length > 0
          ? result.data.map((value) => createRow(value))
          : [createRow()]
      )
      toastSuccess(
        "Đã lưu cài đặt thông báo.",
        result.data.length > 0
          ? `Thông báo đặt lịch sẽ gửi tới ${result.data.length} email.`
          : `Chưa có email nhận thông báo. Hệ thống sẽ gửi tới ${fallbackEmail}.`
      )
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-8">
      <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
        <div className="mb-5">
          <h2 className="text-base font-semibold">Email nhận thông báo</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Thêm một hoặc nhiều email. Để trống danh sách sẽ dùng email liên hệ
            {fallbackEmail ? ` (${fallbackEmail}).` : "."}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {emails.map((row, index) => (
            <div key={row.id} className="flex items-end gap-2">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Label htmlFor={`notification-email-${row.id}`}>
                  Email {index + 1}
                </Label>
                <Input
                  id={`notification-email-${row.id}`}
                  name="notificationEmails"
                  type="email"
                  value={row.value}
                  onChange={(event) =>
                    setEmails((current) =>
                      current.map((item) =>
                        item.id === row.id
                          ? { ...item, value: event.target.value }
                          : item
                      )
                    )
                  }
                  placeholder="admin@example.com"
                  autoComplete="off"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={`Xóa email ${index + 1}`}
                disabled={emails.length === 1 && !row.value}
                onClick={() =>
                  setEmails((current) => {
                    const next = current.filter((item) => item.id !== row.id)
                    return next.length > 0 ? next : [createRow()]
                  })
                }
              >
                <Trash2 />
              </Button>
            </div>
          ))}

          <div>
            <Button
              type="button"
              variant="outline"
              disabled={!canAdd}
              onClick={() => {
                if (!canAdd) return
                setEmails((current) => [...current, createRow()])
              }}
            >
              <Plus />
              Thêm email
            </Button>
            {!canAdd ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Tối đa {MAX_NOTIFICATION_EMAILS} email nhận thông báo.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Đang lưu..." : "Lưu cài đặt"}
        </Button>
      </div>
    </form>
  )
}
