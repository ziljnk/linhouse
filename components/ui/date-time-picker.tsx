"use client"

import * as React from "react"
import { format, isSameDay } from "date-fns"
import { Calendar1 } from "lucide-react"

import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

const HOURS = Array.from({ length: 24 }, (_, index) => index)
const MINUTES = Array.from({ length: 12 }, (_, index) => index * 5)
const DATETIME_LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/

function pad(value: number) {
  return String(value).padStart(2, "0")
}

export function toDatetimeLocalValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function parseDatetimeLocal(value: string) {
  if (!DATETIME_LOCAL.test(value)) return undefined
  const [datePart, timePart] = value.split("T")
  const [year, month, day] = datePart.split("-").map(Number)
  const [hour, minute] = timePart.split(":").map(Number)
  const date = new Date(year, month - 1, day, hour, minute, 0, 0)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function DateTimePicker24h({
  id,
  name,
  value,
  defaultValue = "",
  onChange,
  placeholder = "DD/MM/YYYY HH:mm",
  required,
  disabled,
  className,
  min,
  "aria-label": ariaLabel,
}: {
  id?: string
  name?: string
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  min?: Date | string
  "aria-label"?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const selectedValue = value ?? uncontrolled
  const date = parseDatetimeLocal(selectedValue)
  const minDate = typeof min === "string" ? parseDatetimeLocal(min) : min

  const commit = (next: Date) => {
    const formatted = toDatetimeLocalValue(next)
    if (value === undefined) setUncontrolled(formatted)
    onChange?.(formatted)
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return

    const next = new Date(selectedDate)
    if (date) {
      next.setHours(date.getHours(), date.getMinutes(), 0, 0)
    } else {
      next.setHours(9, 0, 0, 0)
    }

    if (minDate && next < minDate) {
      commit(minDate)
      return
    }

    commit(next)
  }

  const handleTimeChange = (type: "hour" | "minute", raw: string) => {
    const next = new Date(date ?? minDate ?? new Date())
    const parsed = Number.parseInt(raw, 10)
    if (type === "hour") next.setHours(parsed, next.getMinutes(), 0, 0)
    else next.setMinutes(parsed, 0, 0)

    if (minDate && next < minDate) {
      commit(minDate)
      return
    }

    commit(next)
  }

  const hourDisabled = (hour: number) => {
    if (!minDate || !date || !isSameDay(date, minDate)) return false
    return hour < minDate.getHours()
  }

  const minuteDisabled = (minute: number) => {
    if (!minDate || !date || !isSameDay(date, minDate)) return false
    if (date.getHours() !== minDate.getHours()) {
      return date.getHours() < minDate.getHours()
    }
    return minute < minDate.getMinutes()
  }

  return (
    <div className="relative">
      {name ? (
        <input
          name={name}
          value={selectedValue}
          required={required}
          readOnly
          tabIndex={-1}
          aria-hidden
          className="sr-only"
        />
      ) : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              disabled={disabled}
              aria-label={
                date
                  ? `${ariaLabel ?? placeholder}: ${format(date, "dd/MM/yyyy HH:mm")}`
                  : ariaLabel
              }
              aria-required={required || undefined}
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground",
                className
              )}
            />
          }
        >
          <Calendar1 className="mr-2 h-4 w-4" />
          {date ? format(date, "dd/MM/yyyy HH:mm") : <span>{placeholder}</span>}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <div className="sm:flex">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              disabled={minDate ? { before: startOfLocalDay(minDate) } : undefined}
            />
            <div className="flex flex-col divide-y sm:h-75 sm:flex-row sm:divide-x sm:divide-y-0">
              <ScrollArea className="w-64 sm:w-auto">
                <div className="flex p-2 sm:flex-col">
                  {HOURS.map((hour) => (
                    <Button
                      key={hour}
                      type="button"
                      size="icon"
                      disabled={hourDisabled(hour)}
                      variant={
                        date && date.getHours() === hour ? "default" : "ghost"
                      }
                      className="aspect-square shrink-0 sm:w-full"
                      onClick={() => handleTimeChange("hour", hour.toString())}
                    >
                      {hour}
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="sm:hidden" />
              </ScrollArea>
              <ScrollArea className="w-64 sm:w-auto">
                <div className="flex p-2 sm:flex-col">
                  {MINUTES.map((minute) => (
                    <Button
                      key={minute}
                      type="button"
                      size="icon"
                      disabled={minuteDisabled(minute)}
                      variant={
                        date && date.getMinutes() === minute
                          ? "default"
                          : "ghost"
                      }
                      className="aspect-square shrink-0 sm:w-full"
                      onClick={() =>
                        handleTimeChange("minute", minute.toString())
                      }
                    >
                      {minute.toString().padStart(2, "0")}
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="sm:hidden" />
              </ScrollArea>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
