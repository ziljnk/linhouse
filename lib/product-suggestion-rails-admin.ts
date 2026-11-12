import { asc } from "drizzle-orm"
import { db } from "@/lib/db"
import { productSuggestionItem } from "@/lib/db/schema"
import {
  SUGGESTION_RAILS,
  isSuggestionRail,
  suggestionRailVersion,
  type SuggestionRailEditor,
  type SuggestionRailEditorData,
} from "@/lib/product-suggestion-rails"

export async function getSuggestionRailEditor(): Promise<SuggestionRailEditorData> {
  const items = await db
    .select({
      rail: productSuggestionItem.rail,
      productId: productSuggestionItem.productId,
      sortOrder: productSuggestionItem.sortOrder,
    })
    .from(productSuggestionItem)
    .orderBy(
      asc(productSuggestionItem.rail),
      asc(productSuggestionItem.sortOrder),
      asc(productSuggestionItem.productId)
    )

  const rails: SuggestionRailEditor[] = SUGGESTION_RAILS.map((rail) => {
    const productIds = items
      .filter((item) => item.rail === rail && isSuggestionRail(item.rail))
      .map((item) => item.productId)
    return {
      rail,
      productIds,
      version: suggestionRailVersion(productIds),
    }
  })

  return { rails }
}

export function suggestionRailLabel(rail: SuggestionRailEditor["rail"]) {
  return rail === "related" ? "Sản phẩm liên quan" : "Sản phẩm bạn có thể thích"
}
