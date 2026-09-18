"use client"

import { Button } from "@/components/ui/button"
import {
  DateTimePicker24h,
  parseDatetimeLocal,
  toDatetimeLocalValue,
} from "@/components/ui/date-time-picker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export { toDatetimeLocalValue }

export function defaultScheduleValue() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  date.setHours(9, 0, 0, 0)
  return toDatetimeLocalValue(date)
}

export function datetimeLocalToIso(value: string) {
  const date = parseDatetimeLocal(value)
  if (!date) return null
  return date.toISOString()
}

export function SchedulePublishDialog({
  open,
  onOpenChange,
  value,
  onValueChange,
  error,
  pending,
  onConfirm,
  description = "Nội dung sẽ được đánh dấu đã đăng và chỉ hiện trên website khi tới giờ.",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: string
  onValueChange: (value: string) => void
  error?: string | null
  pending?: boolean
  onConfirm: () => void
  description?: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hẹn lịch đăng</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="schedule-publish-at">Thời điểm đăng</Label>
          <DateTimePicker24h
            id="schedule-publish-at"
            value={value}
            min={new Date()}
            onChange={onValueChange}
            placeholder="Chọn ngày và giờ đăng"
            aria-label="Thời điểm đăng"
          />
          <p className="text-xs text-muted-foreground">
            Giờ theo máy tính của bạn.
          </p>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button type="button" disabled={pending} onClick={onConfirm}>
            {pending ? "Đang lưu..." : "Hẹn lịch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
