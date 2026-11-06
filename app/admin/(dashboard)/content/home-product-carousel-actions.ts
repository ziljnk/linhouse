"use server"

import { asc, eq, inArray } from "drizzle-orm"
import { actionFail, actionOk, revalidateAdmin, toLocalized } from "@/lib/admin-actions"
import { recordAudit } from "@/lib/admin-audit"
import { diffFields, localizedChanges } from "@/lib/admin-audit-shared"
import { requireUsableAdminSession } from "@/lib/admin-session"
import { db } from "@/lib/db"
import { homeProductCarouselItem, product, siteCopy } from "@/lib/db/schema"
import { carouselSlotLabel } from "@/lib/home-product-carousels-admin"
import {
  HOME_PRODUCT_CAROUSEL_CONFLICT_ERROR,
  HOME_PRODUCT_CAROUSEL_GENERIC_ERROR,
  homeProductCarouselTitleKey,
  homeProductCarouselVersion,
  parseHomeProductCarouselSave,
  readHomeProductCarouselTitle,
} from "@/lib/home-product-carousels"
import { decodeStoredPlainText } from "@/lib/sanitize-content"

export async function saveHomeProductCarouselAction(input: {
  slot: number
  titleVi: string
  titleEn: string
  ids: string[]
  version: string
}) {
  const session = await requireUsableAdminSession()
  const parsed = parseHomeProductCarouselSave(input)
  if (!parsed.ok) return parsed

  const title = toLocalized(parsed.titleVi, parsed.titleEn)
  const titleKey = homeProductCarouselTitleKey(parsed.slot)

  const outcome = await db.transaction(async (tx) => {
    const itemRows = await tx
      .select({
        productId: homeProductCarouselItem.productId,
        sortOrder: homeProductCarouselItem.sortOrder,
      })
      .from(homeProductCarouselItem)
      .where(eq(homeProductCarouselItem.slot, parsed.slot))
      .orderBy(
        asc(homeProductCarouselItem.sortOrder),
        asc(homeProductCarouselItem.productId)
      )
      .for("update")

    const [copyRow] = await tx
      .select({ value: siteCopy.value })
      .from(siteCopy)
      .where(eq(siteCopy.key, titleKey))
      .limit(1)
      .for("update")

    const storedTitle = readHomeProductCarouselTitle(copyRow?.value)
    const currentTitle = {
      vi: decodeStoredPlainText(storedTitle.vi),
      en: decodeStoredPlainText(storedTitle.en),
    }
    const currentIds = itemRows.map((row) => row.productId)
    const version = homeProductCarouselVersion({
      titleVi: currentTitle.vi,
      titleEn: currentTitle.en,
      ids: currentIds,
    })
    if (version !== parsed.version) {
      return actionFail(HOME_PRODUCT_CAROUSEL_CONFLICT_ERROR)
    }

    const nameIds = [...new Set([...currentIds, ...parsed.ids])]
    const names =
      nameIds.length > 0
        ? await tx
            .select({ id: product.id, name: product.name, code: product.code })
            .from(product)
            .where(inArray(product.id, nameIds))
        : []
    if (parsed.ids.some((id) => !names.some((row) => row.id === id))) {
      return actionFail(HOME_PRODUCT_CAROUSEL_GENERIC_ERROR)
    }
    const labelOf = (id: string) => {
      const row = names.find((item) => item.id === id)
      if (!row) return id
      const name = decodeStoredPlainText(row.name).trim()
      const code = decodeStoredPlainText(row.code).trim()
      return code ? `${name} (${code})` : name || code
    }
    const beforeOrder = currentIds.map((id, index) => `${index + 1}. ${labelOf(id)}`).join(", ")
    const afterOrder = parsed.ids.map((id, index) => `${index + 1}. ${labelOf(id)}`).join(", ")

    await tx
      .delete(homeProductCarouselItem)
      .where(eq(homeProductCarouselItem.slot, parsed.slot))

    if (parsed.ids.length > 0) {
      await tx.insert(homeProductCarouselItem).values(
        parsed.ids.map((productId, index) => ({
          slot: parsed.slot,
          productId,
          sortOrder: index + 1,
        }))
      )
    }

    await tx
      .insert(siteCopy)
      .values({ key: titleKey, value: title })
      .onDuplicateKeyUpdate({ set: { value: title } })

    return {
      ok: true as const,
      beforeTitle: currentTitle,
      afterTitle: title,
      beforeOrder,
      afterOrder,
    }
  })

  if (!outcome.ok) return outcome

  await recordAudit(session, {
    action: "update",
    area: "content",
    entityLabel: carouselSlotLabel(parsed.slot),
    summary: `Cập nhật ${carouselSlotLabel(parsed.slot).toLowerCase()} trên trang chủ`,
    changes: diffFields([
      ...localizedChanges("Tiêu đề", outcome.beforeTitle, outcome.afterTitle),
      { label: "Sản phẩm", before: outcome.beforeOrder, after: outcome.afterOrder },
    ]),
  })
  await revalidateAdmin(["/"])
  return actionOk()
}
