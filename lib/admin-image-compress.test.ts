import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  ADMIN_UPLOAD_MAX_EDGE,
  downscaleSteps,
  fileNameForMime,
  fittedSize,
  selectEncodeMime,
  shouldKeepOriginalFile,
} from "./admin-image-compress"

describe("fittedSize", () => {
  it("never upscales and leaves images already within the cap", () => {
    assert.deepEqual(fittedSize(800, 600), { width: 800, height: 600, scale: 1 })
    assert.deepEqual(fittedSize(2400, 1600), { width: 2400, height: 1600, scale: 1 })
    assert.deepEqual(fittedSize(100, 2400), { width: 100, height: 2400, scale: 1 })
  })

  it("caps the long side at 2400px and keeps the aspect ratio", () => {
    assert.deepEqual(fittedSize(4000, 3000), { width: 2400, height: 1800, scale: 0.6 })
    assert.deepEqual(fittedSize(3000, 4000), { width: 1800, height: 2400, scale: 0.6 })
    assert.deepEqual(fittedSize(10000, 15000), {
      width: 1600,
      height: 2400,
      scale: 2400 / 15000,
    })
  })

  it("rounds to whole pixels and does not collapse a thin edge to zero", () => {
    assert.deepEqual(fittedSize(5000, 1), { width: 2400, height: 1, scale: 2400 / 5000 })
    assert.equal(fittedSize(2401, 1000).width, 2400)
    assert.equal(Math.max(fittedSize(2401, 1000).width, fittedSize(2401, 1000).height), ADMIN_UPLOAD_MAX_EDGE)
  })
})

describe("downscaleSteps", () => {
  it("halves while the next half would still be larger than the target", () => {
    assert.deepEqual(downscaleSteps(8000, 4000, 2400, 1200), [
      { width: 4000, height: 2000 },
      { width: 2400, height: 1200 },
    ])
    assert.deepEqual(downscaleSteps(8000, 8000, 2400, 2400), [
      { width: 4000, height: 4000 },
      { width: 2400, height: 2400 },
    ])
  })

  it("jumps straight to the target when one step is enough", () => {
    assert.deepEqual(downscaleSteps(3000, 2000, 2400, 1600), [
      { width: 2400, height: 1600 },
    ])
  })

  it("returns no steps when the image is already small enough", () => {
    assert.deepEqual(downscaleSteps(1200, 800, 1200, 800), [])
    assert.deepEqual(downscaleSteps(800, 600, 2400, 1800), [])
  })
})

describe("selectEncodeMime", () => {
  it("prefers WebP, including images with alpha", () => {
    assert.equal(selectEncodeMime({ webpSupported: true, hasAlpha: false }), "image/webp")
    assert.equal(selectEncodeMime({ webpSupported: true, hasAlpha: true }), "image/webp")
  })

  it("falls back to JPEG for opaque images and PNG when WebP would flatten alpha", () => {
    assert.equal(selectEncodeMime({ webpSupported: false, hasAlpha: false }), "image/jpeg")
    assert.equal(selectEncodeMime({ webpSupported: false, hasAlpha: true }), "image/png")
  })
})

describe("shouldKeepOriginalFile", () => {
  it("keeps the original when compression grew the file and it is already within limits", () => {
    assert.equal(
      shouldKeepOriginalFile({
        originalBytes: 400_000,
        compressedBytes: 450_000,
        originalLongEdge: 2000,
      }),
      true
    )
  })

  it("uses the compressed file when it is smaller, or when the original exceeds the edge cap", () => {
    assert.equal(
      shouldKeepOriginalFile({
        originalBytes: 4_000_000,
        compressedBytes: 900_000,
        originalLongEdge: 6000,
      }),
      false
    )
    assert.equal(
      shouldKeepOriginalFile({
        originalBytes: 800_000,
        compressedBytes: 900_000,
        originalLongEdge: 5000,
      }),
      false
    )
  })

  it("does not treat an equal size as larger, and honors an optional byte cap", () => {
    assert.equal(
      shouldKeepOriginalFile({
        originalBytes: 1000,
        compressedBytes: 1000,
        originalLongEdge: 1000,
      }),
      false
    )
    assert.equal(
      shouldKeepOriginalFile({
        originalBytes: 6_000_000,
        compressedBytes: 6_500_000,
        originalLongEdge: 1800,
        maxBytes: 5 * 1024 * 1024,
      }),
      false
    )
  })

  it("rejects an empty encode", () => {
    assert.equal(
      shouldKeepOriginalFile({
        originalBytes: 1000,
        compressedBytes: 0,
        originalLongEdge: 1000,
      }),
      true
    )
  })
})

describe("fileNameForMime", () => {
  it("swaps the extension for the encoded type", () => {
    assert.equal(fileNameForMime("lookbook.JPG", "image/webp"), "lookbook.webp")
    assert.equal(fileNameForMime("lace.png", "image/jpeg"), "lace.jpg")
    assert.equal(fileNameForMime("logo.png", "image/png"), "logo.png")
  })
})
