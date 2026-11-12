function orientationSwapsAxes(orientation: number | undefined) {
  return orientation != null && orientation >= 5 && orientation <= 8
}

export type VariantWritePlan = {
  filenameWidth: number
  outputWidth: number
  /** True when the source bytes can be copied instead of re-encoded. */
  copySource: boolean
}

/**
 * One encode per distinct output width. An already-oriented WebP is copied
 * onto every slot that would not shrink it, instead of being re-encoded.
 */
export function planVariantWrites(input: {
  width: number
  height: number
  orientation?: number
  format?: string
  widths: readonly number[]
}): VariantWritePlan[] {
  const swaps = orientationSwapsAxes(input.orientation)
  const orientedWidth = swaps ? input.height : input.width
  const copyFull =
    input.format === "webp" && (input.orientation == null || input.orientation === 1)
  const planned: VariantWritePlan[] = []

  for (const filenameWidth of input.widths) {
    const outputWidth = Math.min(filenameWidth, orientedWidth)
    planned.push({
      filenameWidth,
      outputWidth,
      copySource: copyFull && outputWidth === orientedWidth,
    })
  }

  return planned
}
