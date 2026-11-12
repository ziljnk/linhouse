import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { resolveSuggestionRail } from "./catalog"
import {
  SUGGESTION_RAIL_LIMIT,
  SUGGESTION_RAIL_LIMIT_ERROR,
  SUGGESTION_RAIL_MINIMUM,
  SUGGESTION_RAIL_MINIMUM_ERROR,
  parseSuggestionRailSave,
  suggestionRailVersion,
} from "./product-suggestion-rails"

const catalog = [
  { slug: "celeste", name: "Celeste" },
  { slug: "camille", name: "Camille" },
  { slug: "fern", name: "Fern" },
]

describe("product suggestion rails", () => {
  it("keeps the chosen order and skips the product being viewed", () => {
    const shown = resolveSuggestionRail(
      catalog,
      ["fern", "celeste", "camille"],
      new Set(["celeste"]),
      () => [{ slug: "fallback", name: "Fallback" }]
    )
    assert.deepEqual(
      shown.map((item) => item.slug),
      ["fern", "camille"]
    )
  })

  it("uses the random fallback when nothing is selected or nothing can be shown", () => {
    assert.equal(
      resolveSuggestionRail(catalog, [], new Set(), () => [catalog[0]])[0]?.slug,
      "celeste"
    )
    assert.equal(
      resolveSuggestionRail(catalog, ["missing"], new Set(), () => [catalog[2]])[0]?.slug,
      "fern"
    )
  })

  it("rejects an unknown rail and too many products", () => {
    assert.equal(parseSuggestionRailSave({ rail: "home", ids: [], version: "[]" }).ok, false)
    const ids = Array.from({ length: SUGGESTION_RAIL_LIMIT + 1 }, (_, index) =>
      `7c9e6679-7425-40de-944b-${String(index).padStart(12, "0")}`
    )
    assert.deepEqual(
      parseSuggestionRailSave({ rail: "related", ids, version: suggestionRailVersion([]) }),
      { ok: false, error: SUGGESTION_RAIL_LIMIT_ERROR }
    )
  })

  it("allows an empty list and requires at least five products when one is chosen", () => {
    const ids = (count: number) =>
      Array.from(
        { length: count },
        (_, index) => `7c9e6679-7425-40de-944b-${String(index).padStart(12, "0")}`
      )
    assert.equal(
      parseSuggestionRailSave({ rail: "related", ids: [], version: "[]" }).ok,
      true
    )
    assert.deepEqual(
      parseSuggestionRailSave({
        rail: "recommended",
        ids: ids(SUGGESTION_RAIL_MINIMUM - 1),
        version: "[]",
      }),
      { ok: false, error: SUGGESTION_RAIL_MINIMUM_ERROR }
    )
    assert.equal(
      parseSuggestionRailSave({
        rail: "recommended",
        ids: ids(SUGGESTION_RAIL_MINIMUM),
        version: "[]",
      }).ok,
      true
    )
  })
})
