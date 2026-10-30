"use server"

import { eq } from "drizzle-orm"
import { actionFail, actionOk, revalidateAdmin } from "@/lib/admin-actions"
import { recordAudit } from "@/lib/admin-audit"
import { diffFields } from "@/lib/admin-audit-shared"
import { requireUsableAdminSession } from "@/lib/admin-session"
import { db } from "@/lib/db"
import { collection } from "@/lib/db/schema"
import {
  collectionCarouselLabel,
  selectCollectionsForUpdate,
} from "@/lib/home-carousel-admin"
import {
  HOME_CAROUSEL_CONFLICT_ERROR,
  HOME_CAROUSEL_GENERIC_ERROR,
  compareHomeCarouselOrder,
  homeCarouselVersion,
  isCollectionId,
  parseHomeCarouselIds,
  parseHomeCarouselVersion,
  planHomeCarouselMembership,
} from "@/lib/home-carousel"

function orderedLabels(
  rows: Awaited<ReturnType<typeof selectCollectionsForUpdate>>
) {
  return rows
    .filter((row) => row.showOnHome)
    .slice()
    .sort(compareHomeCarouselOrder)
    .map((row, index) => `${index + 1}. ${collectionCarouselLabel(row.name, row.slug)}`)
    .join(", ")
}

export async function setCollectionHomeCarouselAction(
  id: string,
  showOnHome: boolean
) {
  const session = await requireUsableAdminSession()
  if (!isCollectionId(id) || typeof showOnHome !== "boolean") {
    return actionFail(HOME_CAROUSEL_GENERIC_ERROR)
  }

  const outcome = await db.transaction(async (tx) => {
    const rows = await selectCollectionsForUpdate(tx)
    const current = rows.find((row) => row.id === id)
    if (!current) return actionFail(HOME_CAROUSEL_GENERIC_ERROR)

    const plan = planHomeCarouselMembership(rows, current, showOnHome)
    if (!plan.ok) return plan

    if (plan.changed) {
      await tx
        .update(collection)
        .set({ showOnHome: plan.showOnHome, homeOrder: plan.homeOrder })
        .where(eq(collection.id, id))
    }

    return {
      ok: true as const,
      changed: plan.changed,
      showOnHome: plan.showOnHome,
      homeOrder: plan.homeOrder,
      beforeOrder: current.homeOrder,
      wasOnHome: current.showOnHome,
      name: collectionCarouselLabel(current.name, current.slug),
    }
  })

  if (!outcome.ok) return outcome
  if (!outcome.changed) return actionOk()

  await recordAudit(session, {
    action: "update",
    area: "collection",
    entityLabel: outcome.name,
    summary: outcome.showOnHome
      ? `Thêm ${outcome.name} vào carousel trang chủ`
      : `Bỏ ${outcome.name} khỏi carousel trang chủ`,
    changes: diffFields([
      {
        label: "Carousel trang chủ",
        before: outcome.wasOnHome ? "Hiện" : "Ẩn",
        after: outcome.showOnHome ? "Hiện" : "Ẩn",
      },
      {
        label: "Thứ tự carousel",
        before: outcome.beforeOrder ?? "",
        after: outcome.homeOrder ?? "",
      },
    ]),
  })
  await revalidateAdmin(["/"])
  return actionOk()
}

export async function saveHomeCarouselAction(input: {
  ids: string[]
  version: string
}) {
  const session = await requireUsableAdminSession()
  const ids = parseHomeCarouselIds(input?.ids)
  if (!ids.ok) return ids
  const version = parseHomeCarouselVersion(input?.version)
  if (version === null) return actionFail(HOME_CAROUSEL_GENERIC_ERROR)

  const outcome = await db.transaction(async (tx) => {
    const rows = await selectCollectionsForUpdate(tx)
    if (homeCarouselVersion(rows) !== version) {
      return actionFail(HOME_CAROUSEL_CONFLICT_ERROR)
    }

    const known = new Set(rows.map((row) => row.id))
    if (ids.ids.some((id) => !known.has(id))) {
      return actionFail(HOME_CAROUSEL_GENERIC_ERROR)
    }

    const before = orderedLabels(rows)
    const wanted = new Set(ids.ids)

    for (const row of rows) {
      if (!row.showOnHome || wanted.has(row.id)) continue
      await tx
        .update(collection)
        .set({ showOnHome: false, homeOrder: null })
        .where(eq(collection.id, row.id))
    }

    for (const [index, id] of ids.ids.entries()) {
      const order = index + 1
      const row = rows.find((item) => item.id === id)
      if (row?.showOnHome && row.homeOrder === order) continue
      await tx
        .update(collection)
        .set({ showOnHome: true, homeOrder: order })
        .where(eq(collection.id, id))
    }

    const afterRows = rows.map((row) => {
      const index = ids.ids.indexOf(row.id)
      if (index < 0) {
        return { ...row, showOnHome: false, homeOrder: null }
      }
      return { ...row, showOnHome: true, homeOrder: index + 1 }
    })

    return { ok: true as const, before, after: orderedLabels(afterRows) }
  })

  if (!outcome.ok) return outcome

  await recordAudit(session, {
    action: "update",
    area: "content",
    entityLabel: "Carousel trang chủ",
    summary: "Cập nhật carousel trang chủ",
    changes: diffFields([
      { label: "Thứ tự", before: outcome.before, after: outcome.after },
    ]),
  })
  await revalidateAdmin(["/"])
  return actionOk()
}
