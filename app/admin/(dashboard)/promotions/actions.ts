"use server"

import { actionFail, actionOk, revalidateAdmin } from "@/lib/admin-actions"
import { recordAudit } from "@/lib/admin-audit"
import { diffFields } from "@/lib/admin-audit-shared"
import { requireUsableAdminSession } from "@/lib/admin-session"
import { parseCmsStorageKey } from "@/lib/cms-image"
import { cleanupRemovedCmsImages } from "@/lib/cms-image-storage"
import {
  PROMOTION_DATE_MESSAGE,
  PROMOTION_IMAGE_MAX_BYTES,
  parsePromotionDate,
  parsePromotionLink,
  promotionDateOrderError,
  sanitizePromotionFilename,
} from "@/lib/promotion-popup"
import {
  getPromotionPopup,
  writePromotionPopup,
  type PromotionPopupRecord,
} from "@/lib/promotion-popup-store"
import { sanitizePlainText } from "@/lib/sanitize-content"

const ALT_LIMIT = 500

export type PromotionPopupSaveInput = {
  enabled: boolean
  imageStorageKey: string | null
  imageFilename: string | null
  imageBytes: number | null
  imageAlt: string
  linkUrl: string
  startsOn: string | null
  endsOn: string | null
}

export async function savePromotionPopupAction(input: PromotionPopupSaveInput) {
  const session = await requireUsableAdminSession()

  if (typeof input?.enabled !== "boolean") {
    return actionFail("Dữ liệu form không hợp lệ.")
  }

  const link = parsePromotionLink(input.linkUrl)
  if (!link.ok) return actionFail(link.error)

  const starts = parsePromotionDate(input.startsOn)
  const ends = parsePromotionDate(input.endsOn)
  if (!starts.ok || !ends.ok) return actionFail(PROMOTION_DATE_MESSAGE)

  const orderError = promotionDateOrderError(starts.date, ends.date)
  if (orderError) return actionFail(orderError)

  if (typeof input.imageAlt !== "string") {
    return actionFail("Mô tả ảnh không hợp lệ.")
  }
  const imageAlt = sanitizePlainText(input.imageAlt)
  if (imageAlt.length > ALT_LIMIT) {
    return actionFail(`Mô tả ảnh tối đa ${ALT_LIMIT} ký tự.`)
  }

  const image = parseImage(input)
  if (!image.ok) return actionFail(image.error)

  const previous = await getPromotionPopup()
  const next: PromotionPopupRecord = {
    enabled: input.enabled,
    imageStorageKey: image.storageKey,
    imageFilename: image.filename,
    imageBytes: image.bytes,
    imageAlt,
    linkUrl: link.url,
    startsOn: starts.date,
    endsOn: ends.date,
  }

  await writePromotionPopup(next)

  if (previous.imageStorageKey !== next.imageStorageKey) {
    await cleanupRemovedCmsImages(
      previous.imageStorageKey ? [previous.imageStorageKey] : [],
      next.imageStorageKey ? [next.imageStorageKey] : []
    )
  }

  await recordAudit(session, {
    action: "update",
    area: "promotion",
    entityLabel: "Popup khuyến mãi",
    summary: "Cập nhật popup khuyến mãi",
    changes: diffFields([
      {
        label: "Hiển thị popup",
        before: previous.enabled ? "Bật" : "Tắt",
        after: next.enabled ? "Bật" : "Tắt",
      },
      {
        label: "Ảnh popup",
        before: previous.imageStorageKey ?? "",
        after: next.imageStorageKey ?? "",
        images: true,
      },
      { label: "Tên tệp", before: previous.imageFilename ?? "", after: next.imageFilename ?? "" },
      { label: "Mô tả ảnh", before: previous.imageAlt, after: next.imageAlt },
      { label: "Liên kết", before: previous.linkUrl ?? "", after: next.linkUrl ?? "" },
      { label: "Ngày bắt đầu", before: previous.startsOn ?? "", after: next.startsOn ?? "" },
      { label: "Ngày kết thúc", before: previous.endsOn ?? "", after: next.endsOn ?? "" },
    ]),
  })

  await revalidateAdmin(["/"])
  return actionOk()
}

function parseImage(
  input: PromotionPopupSaveInput
):
  | { ok: true; storageKey: string | null; filename: string | null; bytes: number | null }
  | { ok: false; error: string } {
  const rawKey = input.imageStorageKey?.trim() ?? ""
  if (!rawKey) {
    return { ok: true, storageKey: null, filename: null, bytes: null }
  }

  const storageKey = parseCmsStorageKey(rawKey)
  if (!storageKey || !storageKey.startsWith("promotions/")) {
    return { ok: false, error: "Ảnh không hợp lệ." }
  }

  const filename = input.imageFilename
    ? sanitizePromotionFilename(input.imageFilename) || null
    : null

  if (input.imageBytes == null) {
    return { ok: true, storageKey, filename, bytes: null }
  }
  if (
    typeof input.imageBytes !== "number" ||
    !Number.isInteger(input.imageBytes) ||
    input.imageBytes < 1 ||
    input.imageBytes > PROMOTION_IMAGE_MAX_BYTES
  ) {
    return { ok: false, error: "Ảnh không hợp lệ." }
  }

  return { ok: true, storageKey, filename, bytes: input.imageBytes }
}
