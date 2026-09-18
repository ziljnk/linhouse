"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function pageHref(
  pathname: string,
  searchParams: URLSearchParams,
  page: number
) {
  const next = new URLSearchParams(searchParams.toString())
  if (page <= 1) next.delete("page")
  else next.set("page", String(page))
  const query = next.toString()
  return query ? `${pathname}?${query}` : pathname
}

function pageWindow(page: number, pageCount: number) {
  const size = 5
  const start = Math.max(1, Math.min(page - 2, pageCount - size + 1))
  const end = Math.min(pageCount, start + size - 1)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

function PageLink({
  href,
  children,
  variant,
  className,
  disabled,
  "aria-current": ariaCurrent,
  "aria-label": ariaLabel,
}: {
  href: string
  children: ReactNode
  variant: "outline" | "secondary"
  className?: string
  disabled?: boolean
  "aria-current"?: "page"
  "aria-label"?: string
}) {
  const styles = cn(
    buttonVariants({ variant, size: "sm" }),
    "min-w-8 px-2 no-underline",
    disabled && "pointer-events-none opacity-50",
    className
  )

  if (disabled) {
    return (
      <span className={styles} aria-disabled="true" aria-label={ariaLabel}>
        {children}
      </span>
    )
  }

  return (
    <Link
      href={href}
      className={styles}
      aria-current={ariaCurrent}
      aria-label={ariaLabel}
    >
      {children}
    </Link>
  )
}

export function AdminPagination({
  page,
  pageCount,
  total,
  pageSize,
  noun,
}: {
  page: number
  pageCount: number
  total: number
  pageSize: number
  noun: string
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const params = new URLSearchParams(searchParams.toString())

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {total === 0
          ? `0 ${noun}`
          : `${from}–${to} / ${total} ${noun}`}
      </p>
      {pageCount > 1 ? (
        <nav aria-label="Phân trang" className="flex items-center gap-1">
          <PageLink
            href={pageHref(pathname, params, page - 1)}
            variant="outline"
            disabled={page <= 1}
            aria-label="Trang trước"
          >
            <ChevronLeft />
            Trước
          </PageLink>
          {pageWindow(page, pageCount).map((item) => (
            <PageLink
              key={item}
              href={pageHref(pathname, params, item)}
              variant={item === page ? "secondary" : "outline"}
              disabled={item === page}
              aria-current={item === page ? "page" : undefined}
            >
              {item}
            </PageLink>
          ))}
          <PageLink
            href={pageHref(pathname, params, page + 1)}
            variant="outline"
            disabled={page >= pageCount}
            aria-label="Trang sau"
          >
            Sau
            <ChevronRight />
          </PageLink>
        </nav>
      ) : null}
    </div>
  )
}
