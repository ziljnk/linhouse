"use client"

import { CalendarClock, ChevronDown, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function PublishIntentActions({
  pending,
  isLive,
  onPublish,
  onSchedule,
}: {
  pending: boolean
  isLive?: boolean
  onPublish: () => void
  onSchedule: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Đang lưu..." : "Lưu nháp"}
      </Button>
      <div className="flex">
        <Button
          type="button"
          className="rounded-r-none"
          disabled={pending}
          onClick={onPublish}
        >
          {isLive ? "Cập nhật" : "Đăng ngay"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Tùy chọn đăng"
            render={
              <Button
                type="button"
                className="rounded-l-none border-l border-primary-foreground/25 px-2"
                disabled={pending}
              />
            }
          >
            <ChevronDown />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuItem onClick={onPublish}>
              <Send />
              Đăng ngay
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSchedule}>
              <CalendarClock />
              Hẹn lịch đăng
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
