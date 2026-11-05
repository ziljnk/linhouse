export function catalogSlugForKind(kind: string) {
  if (kind === "gown") return "all-gowns"
  if (kind === "ao-dai") return "all-ao-dai"
  return `all-${kind}`
}

export function catalogPathForKind(kind: string) {
  return `/catalog/${catalogSlugForKind(kind)}`
}

export function kindFromCatalogSlug(slug: string) {
  if (slug === "all-gowns") return "gown"
  if (slug === "all-ao-dai") return "ao-dai"
  if (!slug.startsWith("all-")) return null
  const kind = slug.slice(4)
  return kind || null
}

export function isBuiltinProductKind(slug: string) {
  return slug === "gown" || slug === "ao-dai"
}
