"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function AdminFilterSelect({
  id,
  value,
  onValueChange,
  items,
  "aria-label": ariaLabel,
}: {
  id: string
  value: string
  onValueChange: (value: string) => void
  items: { value: string; label: string }[]
  "aria-label": string
}) {
  return (
    <Select
      id={id}
      value={value}
      onValueChange={(next) => onValueChange(next ?? "all")}
      items={items}
    >
      <SelectTrigger className="w-full sm:w-44" aria-label={ariaLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} className="w-(--anchor-width)">
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value} label={item.label}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
