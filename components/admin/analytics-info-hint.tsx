"use client"

import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function AnalyticsInfoHint({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        aria-label={text}
        className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
      >
        <Info className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent side="top" align="start" className="max-w-xs text-left">
        {text}
      </TooltipContent>
    </Tooltip>
  )
}
