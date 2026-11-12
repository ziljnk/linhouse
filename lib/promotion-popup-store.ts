import "server-only"

import { cache } from "react"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { promotionPopup } from "@/lib/db/schema"

export const PROMOTION_POPUP_ID = "default"

export type PromotionPopupRecord = {
  enabled: boolean
  imageStorageKey: string | null
  imageFilename: string | null
  imageBytes: number | null
  imageAlt: string
  linkUrl: string | null
  startsOn: string | null
  endsOn: string | null
}

export const EMPTY_PROMOTION_POPUP: PromotionPopupRecord = {
  enabled: false,
  imageStorageKey: null,
  imageFilename: null,
  imageBytes: null,
  imageAlt: "",
  linkUrl: null,
  startsOn: null,
  endsOn: null,
}

function dateOnly(value: unknown): string | null {
  if (!value) return null
  if (typeof value === "string") {
    const match = /^(\d{4}-\d{2}-\d{2})/.exec(value)
    return match ? match[1] : null
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getUTCFullYear()
    const month = String(value.getUTCMonth() + 1).padStart(2, "0")
    const day = String(value.getUTCDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }
  return null
}

export const getPromotionPopup = cache(async (): Promise<PromotionPopupRecord> => {
  try {
    const [row] = await db
      .select()
      .from(promotionPopup)
      .where(eq(promotionPopup.id, PROMOTION_POPUP_ID))
      .limit(1)

    if (!row) return EMPTY_PROMOTION_POPUP

    return {
      enabled: Boolean(row.enabled),
      imageStorageKey: row.imageStorageKey,
      imageFilename: row.imageFilename,
      imageBytes: row.imageBytes,
      imageAlt: row.imageAlt ?? "",
      linkUrl: row.linkUrl,
      startsOn: dateOnly(row.startsOn),
      endsOn: dateOnly(row.endsOn),
    }
  } catch (error) {
    console.error("getPromotionPopup failed", error)
    return EMPTY_PROMOTION_POPUP
  }
})

export async function writePromotionPopup(record: PromotionPopupRecord) {
  const values = {
    id: PROMOTION_POPUP_ID,
    enabled: record.enabled,
    imageStorageKey: record.imageStorageKey,
    imageFilename: record.imageFilename,
    imageBytes: record.imageBytes,
    imageAlt: record.imageAlt,
    linkUrl: record.linkUrl,
    startsOn: record.startsOn,
    endsOn: record.endsOn,
    updatedAt: new Date(),
  }

  await db
    .insert(promotionPopup)
    .values(values)
    .onDuplicateKeyUpdate({
      set: {
        enabled: values.enabled,
        imageStorageKey: values.imageStorageKey,
        imageFilename: values.imageFilename,
        imageBytes: values.imageBytes,
        imageAlt: values.imageAlt,
        linkUrl: values.linkUrl,
        startsOn: values.startsOn,
        endsOn: values.endsOn,
        updatedAt: values.updatedAt,
      },
    })
}
