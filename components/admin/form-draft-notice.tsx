"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ADMIN_DRAFT_ENTITY_LABELS,
  DRAFT_IMAGE_MISSING_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
  formatDraftStamp,
  newerThanDraft,
  type AdminDraftEntity,
} from "@/lib/admin-drafts"

type DraftOffer = {
  title: string
  savedAt: string
  baselineUpdatedAt: string | null
  imageMissing: boolean
}

export function FormDraftNotices({
  entity,
  offer,
  recordUpdatedAt,
  imageMissing,
  sessionExpired,
  onRestore,
  onDiscard,
}: {
  entity: AdminDraftEntity
  offer: DraftOffer | null
  recordUpdatedAt?: string | null
  imageMissing: boolean
  sessionExpired: boolean
  onRestore: () => void
  onDiscard: () => void
}) {
  const showImageNote = imageMissing && !offer
  if (!offer && !sessionExpired && !showImageNote) return null

  const newer = offer
    ? newerThanDraft(recordUpdatedAt, offer.baselineUpdatedAt)
    : false
  const label = ADMIN_DRAFT_ENTITY_LABELS[entity]

  return (
    <div className="flex flex-col gap-3">
      {sessionExpired ? (
        <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm">
          <p>{SESSION_EXPIRED_MESSAGE}</p>
          <Link
            href="/admin/login"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex font-medium underline underline-offset-4"
          >
            Đăng nhập lại
          </Link>
        </div>
      ) : null}
      {offer ? (
        <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm">
          <p>
            Có bản nháp chưa lưu lúc {formatDraftStamp(offer.savedAt)} – “
            {offer.title || "Chưa có tiêu đề"}”
          </p>
          {newer ? (
            <p className="mt-2 text-destructive">
              {label} đã được cập nhật sau bản nháp này. Khôi phục sẽ ghi đè
              thay đổi mới hơn.
            </p>
          ) : null}
          {offer.imageMissing ? (
            <p className="mt-2">{DRAFT_IMAGE_MISSING_MESSAGE}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={onRestore}>
              Khôi phục
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onDiscard}>
              Bỏ
            </Button>
          </div>
        </div>
      ) : null}
      {showImageNote ? (
        <p className="text-sm text-muted-foreground">{DRAFT_IMAGE_MISSING_MESSAGE}</p>
      ) : null}
    </div>
  )
}

export function FormDraftStatus({ savedAt }: { savedAt: string | null }) {
  if (!savedAt) return null
  return (
    <p className="text-xs text-muted-foreground">
      Đã lưu nháp trên máy lúc {formatDraftStamp(savedAt, false)}
    </p>
  )
}
