import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  SALE_MINUS,
  SALE_PERCENT_ERROR,
  SALE_PRICE_ERROR,
  effectiveProductPrice,
  percentFromPrices,
  productSale,
  productSaleFormError,
  salePriceFromPercent,
  salePriceInputError,
} from "./catalog"

describe("productSale", () => {
  it("computes an exact percent and a minus-sign label", () => {
    const sale = productSale({
      priceDisplay: "amount",
      priceVnd: 18_000_000,
      salePriceVnd: 14_400_000,
    })

    assert.ok(sale)
    assert.equal(sale.percent, 20)
    assert.equal(sale.label, `${SALE_MINUS}20%`)
    assert.equal(sale.label.codePointAt(0), 0x2212)
    assert.equal(sale.regularPriceVnd, 18_000_000)
    assert.equal(sale.salePriceVnd, 14_400_000)
    assert.equal(effectiveProductPrice({
      priceDisplay: "amount",
      priceVnd: 18_000_000,
      salePriceVnd: 14_400_000,
    }), 14_400_000)
  })

  it("rounds half away from zero and keeps fractional discounts active", () => {
    assert.equal(percentFromPrices(200, 133), 34)
    assert.equal(percentFromPrices(1000, 666), 33)
    assert.equal(percentFromPrices(1000, 665), 34)
    assert.equal(percentFromPrices(3, 1), 67)
    assert.equal(percentFromPrices(200, 1), 100)
    assert.equal(percentFromPrices(1000, 999), 0)

    const half = productSale({
      priceDisplay: "amount",
      priceVnd: 200,
      salePriceVnd: 133,
    })
    assert.equal(half?.percent, 34)
    assert.equal(half?.label, `${SALE_MINUS}34%`)

    const tiny = productSale({
      priceDisplay: "amount",
      priceVnd: 1000,
      salePriceVnd: 999,
    })
    assert.equal(tiny?.percent, 0)
    assert.equal(effectiveProductPrice({
      priceDisplay: "amount",
      priceVnd: 1000,
      salePriceVnd: 999,
    }), 999)
  })

  it("derives the sale price from a percent with the same rounding", () => {
    assert.equal(salePriceFromPercent(18_000_000, 20), 14_400_000)
    assert.equal(salePriceFromPercent(20_000_000, 15), 17_000_000)
    assert.equal(salePriceFromPercent(10_000_001, 20), 8_000_001)
    assert.equal(
      percentFromPrices(10_000_001, salePriceFromPercent(10_000_001, 20)!),
      20
    )
  })

  it("stays off unless the amount is shown and the sale price is strictly lower", () => {
    const inactive = [
      { priceDisplay: "contact" as const, priceVnd: 18_000_000, salePriceVnd: 14_400_000 },
      { priceDisplay: "amount" as const, priceVnd: 18_000_000, salePriceVnd: null },
      { priceDisplay: "amount" as const, priceVnd: 18_000_000, salePriceVnd: 0 },
      { priceDisplay: "amount" as const, priceVnd: 18_000_000, salePriceVnd: 18_000_000 },
      { priceDisplay: "amount" as const, priceVnd: 18_000_000, salePriceVnd: 19_000_000 },
      { priceDisplay: "amount" as const, priceVnd: 0, salePriceVnd: -1 },
      { priceDisplay: "amount" as const, priceVnd: null, salePriceVnd: 1 },
      { priceVnd: 18_000_000, salePriceVnd: 14_400_000 },
    ]

    for (const product of inactive) {
      assert.equal(productSale(product), null)
      assert.equal(
        effectiveProductPrice(product),
        product.priceDisplay === "amount" &&
          product.priceVnd != null &&
          product.priceVnd > 0
          ? product.priceVnd
          : null
      )
    }
  })
})

describe("sale validation", () => {
  it("accepts an empty sale and rejects a percent outside 1–99 or a sale that is not lower", () => {
    assert.equal(salePriceInputError(18_000_000, null), null)
    assert.equal(salePriceInputError(18_000_000, 14_400_000), null)
    assert.equal(salePriceInputError(18_000_000, 18_000_000), SALE_PRICE_ERROR)
    assert.equal(salePriceInputError(18_000_000, 0), SALE_PRICE_ERROR)
    assert.equal(salePriceInputError(18_000_000, 19_000_000), SALE_PRICE_ERROR)
    assert.equal(salePriceInputError(null, 1000), SALE_PRICE_ERROR)
    assert.equal(salePriceInputError(1000, 999), SALE_PERCENT_ERROR)
    assert.equal(salePriceInputError(200, 1), SALE_PERCENT_ERROR)
    assert.equal(salePriceInputError(18_000_000, 14_400_000.5), SALE_PRICE_ERROR)

    assert.equal(
      productSaleFormError({ priceVnd: 18_000_000, percent: null, salePriceVnd: null }),
      null
    )
    assert.equal(
      productSaleFormError({ priceVnd: 18_000_000, percent: 0, salePriceVnd: null }),
      SALE_PERCENT_ERROR
    )
    assert.equal(
      productSaleFormError({ priceVnd: 18_000_000, percent: 100, salePriceVnd: null }),
      SALE_PERCENT_ERROR
    )
    assert.equal(
      productSaleFormError({ priceVnd: 18_000_000, percent: 0, salePriceVnd: 18_000_000 }),
      SALE_PRICE_ERROR
    )
    assert.equal(
      productSaleFormError({ priceVnd: 18_000_000, percent: 20, salePriceVnd: 14_400_000 }),
      null
    )
  })
})
