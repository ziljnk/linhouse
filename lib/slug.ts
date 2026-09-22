export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("đ", "d")
    .replaceAll("Đ", "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** Keep generating from the source text until the slug was customized. */
export function nextAutoSlug(
  previousSource: string,
  currentSlug: string,
  nextSource: string
) {
  if (currentSlug && currentSlug !== slugify(previousSource)) {
    return currentSlug
  }
  return slugify(nextSource)
}
