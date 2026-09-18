import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  ANALYTICS_RANGE_LABELS,
  ANALYTICS_RANGES,
  type AnalyticsRange,
} from "@/lib/admin-analytics"

function hrefForRange(range: AnalyticsRange) {
  return range === "7d" ? "/admin" : `/admin?range=${range}`
}

export function AnalyticsRangeTabs({ value }: { value: AnalyticsRange }) {
  return (
    <nav
      aria-label="Khoảng thời gian"
      className="inline-flex h-9 w-fit items-center justify-center rounded-lg bg-muted p-[3px] text-muted-foreground"
    >
      {ANALYTICS_RANGES.map((range) => {
        const selected = range === value
        return (
          <Link
            key={range}
            href={hrefForRange(range)}
            aria-current={selected ? "page" : undefined}
            className={cn(
              "inline-flex h-[calc(100%-1px)] items-center justify-center rounded-md px-3 text-sm font-medium whitespace-nowrap transition-all",
              selected
                ? "bg-background text-foreground shadow-sm"
                : "text-foreground/60 hover:text-foreground"
            )}
          >
            {ANALYTICS_RANGE_LABELS[range]}
          </Link>
        )
      })}
    </nav>
  )
}
