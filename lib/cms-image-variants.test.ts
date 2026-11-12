import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { planVariantWrites } from "./cms-image-variant-plan"

describe("planVariantWrites", () => {
  it("copies an oriented WebP onto slots that would not shrink it", () => {
    const plan = planVariantWrites({
      width: 320,
      height: 480,
      format: "webp",
      orientation: 1,
      widths: [400, 800, 1200],
    })
    assert.equal(plan.every((step) => step.copySource), true)
    assert.deepEqual(
      plan.map((step) => step.outputWidth),
      [320, 320, 320]
    )
  })

  it("encodes each smaller width once and does not copy a rotated or jpeg source", () => {
    const jpeg = planVariantWrites({
      width: 600,
      height: 800,
      format: "jpeg",
      widths: [400, 800, 1200],
    })
    assert.deepEqual(
      jpeg.map((step) => [step.filenameWidth, step.outputWidth, step.copySource]),
      [
        [400, 400, false],
        [800, 600, false],
        [1200, 600, false],
      ]
    )

    const rotated = planVariantWrites({
      width: 2400,
      height: 1600,
      format: "webp",
      orientation: 6,
      widths: [400, 800, 1200, 2400, 2880],
    })
    assert.equal(rotated.every((step) => step.copySource === false), true)
    assert.equal(rotated.find((step) => step.filenameWidth === 2880)?.outputWidth, 1600)
  })
})
