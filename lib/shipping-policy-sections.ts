export const MAX_SHIPPING_SECTIONS = 20
export const SHIPPING_SECTION_TITLE_MAX = 180
export const SHIPPING_SECTION_BODY_MAX = 2000

export type ShippingContentPair = { vi: string; en: string }

export type ShippingSectionDraft = {
  title: ShippingContentPair
  body: ShippingContentPair
}

const SECTION_KEY = /^shipping\.section\.(\d+)\.(title|body)$/

export function shippingSectionKey(index: number, part: "title" | "body") {
  return `shipping.section.${index}.${part}`
}

export function shippingSectionIndexes(values: Record<string, ShippingContentPair>) {
  const indexes = new Set<number>()
  for (const key of Object.keys(values)) {
    const match = SECTION_KEY.exec(key)
    if (!match) continue
    indexes.add(Number(match[1]))
  }
  return [...indexes].sort((left, right) => left - right)
}

export function shippingSectionsFrom(values: Record<string, ShippingContentPair>) {
  return shippingSectionIndexes(values).map((index) => ({
    title: values[shippingSectionKey(index, "title")] ?? { vi: "", en: "" },
    body: values[shippingSectionKey(index, "body")] ?? { vi: "", en: "" },
  }))
}

export function withShippingSections<T extends Record<string, ShippingContentPair>>(
  values: T,
  sections: ShippingSectionDraft[]
): T {
  const next = Object.fromEntries(
    Object.entries(values).filter(([key]) => !key.startsWith("shipping.section."))
  ) as T

  sections.forEach((section, index) => {
    next[shippingSectionKey(index, "title") as keyof T] = {
      ...section.title,
    } as T[keyof T]
    next[shippingSectionKey(index, "body") as keyof T] = {
      ...section.body,
    } as T[keyof T]
  })

  return next
}
