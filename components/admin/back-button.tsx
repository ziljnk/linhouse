"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export function AdminBackButton({
  href,
  label = "Quay lại",
}: {
  href: string
  label?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        delay={3000}
        aria-label={label}
        render={<Link href={href} />}
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
      >
        <ArrowLeft />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
