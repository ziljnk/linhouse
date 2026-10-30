"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { draftOpenHref, type AdminDraftEntity } from "@/lib/admin-drafts"
import { useUserDraftMetas } from "@/hooks/use-form-draft"

export function useEntityDrafts(entity: AdminDraftEntity) {
  const drafts = useUserDraftMetas()
  return drafts.filter((draft) => draft.entity === entity)
}

export function DraftListBanner({ entity }: { entity: AdminDraftEntity }) {
  const drafts = useEntityDrafts(entity)
  if (drafts.length === 0) return null
  const href =
    drafts.length === 1 ? draftOpenHref(drafts[0]) : "/admin/unsaved-drafts"

  return (
    <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm">
      Bạn có {drafts.length} bản nháp chưa lưu –{" "}
      <Link href={href} className="font-medium underline underline-offset-4">
        Mở bản nháp
      </Link>
    </div>
  )
}

export function DraftCreateBadge({
  entity,
  children,
}: {
  entity: AdminDraftEntity
  children: ReactNode
}) {
  const drafts = useEntityDrafts(entity)
  const hasNew = drafts.some((draft) => draft.recordId === "new")
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {children}
      {hasNew ? <Badge variant="secondary">Có bản nháp</Badge> : null}
    </span>
  )
}

export function UnsavedDraftTag() {
  return <Badge variant="outline">Bản nháp chưa lưu</Badge>
}
