"use server"

import { asc, eq, inArray } from "drizzle-orm"
import { actionFail, actionOk, revalidateAdmin } from "@/lib/admin-actions"
import { recordAudit } from "@/lib/admin-audit"
import { diffFields } from "@/lib/admin-audit-shared"
import { requireUsableAdminSession } from "@/lib/admin-session"
import { db } from "@/lib/db"
import { product, productSuggestionItem } from "@/lib/db/schema"
import { suggestionRailLabel } from "@/lib/product-suggestion-rails-admin"
import {
  SUGGESTION_RAIL_CONFLICT_ERROR,
  SUGGESTION_RAIL_GENERIC_ERROR,
  parseSuggestionRailSave,
  suggestionRailVersion,
} from "@/lib/product-suggestion-rails"
import { decodeStoredPlainText } from "@/lib/sanitize-content"

export async function saveSuggestionRailAction(input: {
  rail: string
  ids: string[]
  version: string
}) {
  const session = await requireUsableAdminSession()
  const parsed = parseSuggestionRailSave(input)
  if (!parsed.ok) return parsed

  const outcome = await db.transaction(async (tx) => {
    const itemRows = await tx
      .select({
        productId: productSuggestionItem.productId,
        sortOrder: productSuggestionItem.sortOrder,
      })
      .from(productSuggestionItem)
      .where(eq(productSuggestionItem.rail, parsed.rail))
      .orderBy(
        asc(productSuggestionItem.sortOrder),
        asc(productSuggestionItem.productId)
      )
      .for("update")

    const currentIds = itemRows.map((row) => row.productId)
    if (suggestionRailVersion(currentIds) !== parsed.version) {
      return actionFail(SUGGESTION_RAIL_CONFLICT_ERROR)
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
      return actionFail(SUGGESTION_RAIL_GENERIC_ERROR)
    }

    const labelOf = (id: string) => {
      const row = names.find((item) => item.id === id)
      if (!row) return id
      const name = decodeStoredPlainText(row.name).trim()
      const code = decodeStoredPlainText(row.code).trim()
      return code ? `${name} (${code})` : name || code
    }

    await tx
      .delete(productSuggestionItem)
      .where(eq(productSuggestionItem.rail, parsed.rail))

    if (parsed.ids.length > 0) {
      await tx.insert(productSuggestionItem).values(
        parsed.ids.map((productId, index) => ({
          rail: parsed.rail,
          productId,
          sortOrder: index + 1,
        }))
      )
    }

    return {
      ok: true as const,
      beforeOrder: currentIds.map((id, index) => `${index + 1}. ${labelOf(id)}`).join(", "),
      afterOrder: parsed.ids.map((id, index) => `${index + 1}. ${labelOf(id)}`).join(", "),
    }
  })

  if (!outcome.ok) return outcome

  const slugs = await db.select({ slug: product.slug }).from(product)
  await recordAudit(session, {
    action: "update",
    area: "content",
    entityLabel: suggestionRailLabel(parsed.rail),
    summary: `Cập nhật carousel ${suggestionRailLabel(parsed.rail).toLowerCase()} trên trang sản phẩm`,
    changes: diffFields([
      { label: "Sản phẩm", before: outcome.beforeOrder, after: outcome.afterOrder },
    ]),
  })
  await revalidateAdmin(["/", ...slugs.map((row) => `/product/${row.slug}`)])
  return actionOk()
}
