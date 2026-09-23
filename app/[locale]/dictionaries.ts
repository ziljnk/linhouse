import 'server-only'
 
const dictionaries = {
  en: () => import('./dictionaries/en.json').then((module) => module.default),
  vi: () => import('./dictionaries/vi.json').then((module) => module.default),
}
 
export type Locale = keyof typeof dictionaries
 
export const hasLocale = (locale: string): locale is Locale =>
  locale in dictionaries

type DictionaryJson = Awaited<ReturnType<(typeof dictionaries)[Locale]>>

export type Dictionary = DictionaryJson

export const getDictionary = async (locale: Locale): Promise<Dictionary> => {
  const base = await dictionaries[locale]()
  const { applyStoredSiteContent } = await import("@/lib/site-content")
  return applyStoredSiteContent(base, locale)
}

export function findCategoryLabel(dict: Dictionary, slug: string) {
  const href = `/catalog/${slug}`
  const columns = [
    ...dict.nav.homeColumns,
    ...dict.nav.collectionColumns,
    ...dict.nav.bridalColumns,
    ...dict.nav.aodaiColumns,
  ]

  for (const column of columns) {
    const match = column.links.find((link) => link.href === href)
    if (match) return match.label
  }

  return slug
}

export function findBlogPost(dict: Dictionary, slug: string) {
  return dict.home.blog.posts.find((post) => post.slug === slug)
}