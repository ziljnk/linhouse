export type ProductNameToken = {
  slug: string
  label: string
  text: string
}

function tokenKey(value: string) {
  return value.trim().toLocaleLowerCase("vi").normalize("NFC")
}

export function formatProductDisplayName(
  template: string,
  name: string,
  tokens: ProductNameToken[]
) {
  const source = template.trim()
  if (!source) return name

  const values = new Map<string, string>()
  values.set("tên", name)
  values.set("ten", name)
  values.set("name", name)
  for (const token of tokens) {
    if (token.text.trim() === "") continue
    if (token.label.trim()) values.set(tokenKey(token.label), token.text)
    if (token.slug.trim()) values.set(tokenKey(token.slug), token.text)
  }

  const formatted = source.replace(/\[([^\]]+)\]/g, (_match, raw: string) => {
    return values.get(tokenKey(raw)) ?? ""
  })

  const cleaned = formatted
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.;])/g, "$1")
    .replace(/(?:\s*-\s*){2,}/g, " - ")
    .replace(/^\s*-\s*/, "")
    .replace(/\s*-\s*$/, "")
    .trim()

  return cleaned || name
}
