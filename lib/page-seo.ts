import "server-only"

import type { Dictionary, Locale } from "@/app/[locale]/dictionaries"
import { getDictionary } from "@/app/[locale]/dictionaries"
import { db } from "@/lib/db"
import { siteCopy } from "@/lib/db/schema"
import { sanitizePlainText } from "@/lib/sanitize-content"
import type { StorefrontLocale } from "@/lib/seo"
import { loadSiteCopyMap } from "@/lib/site-content"
import type { LocalizedText } from "@/lib/site-settings"
import { withStorefrontSeo } from "@/lib/storefront-metadata"

const SEO_PAGES_KEY = "seo.pages"
const TITLE_MAX = 180
const DESCRIPTION_MAX = 400
const KEYWORDS_MAX = 500

const HOME_SEO = {
  vi: {
    title: "LINHouse | Váy Cưới Thiết Kế",
    description:
      "LINHouse – Bridal studio chuyên váy cưới thiết kế, mang đến những thiết kế tinh tế và thanh lịch dành cho mọi cô dâu, với lựa chọn đặc biệt cho cô dâu Big Size.",
  },
  en: {
    title: "LINHouse | Designer Wedding Dresses",
    description:
      "LINHouse – A bridal studio specializing in thoughtfully designed wedding dresses, offering elegant and refined styles for every bride, with a special selection for plus-size brides.",
  },
} as const

export const STATIC_SEO_PAGES = [
  { id: "home", path: "/", label: "Trang chủ" },
  { id: "about", path: "/about", label: "Về chúng tôi" },
  { id: "support", path: "/support", label: "Liên hệ" },
  { id: "reviews", path: "/reviews", label: "Đánh giá khách hàng" },
  { id: "blog", path: "/blog", label: "Kinh nghiệm cưới" },
  { id: "shipping", path: "/shipping", label: "Chính sách giao hàng" },
  { id: "terms", path: "/terms", label: "Điều khoản sử dụng" },
  { id: "privacy", path: "/privacy", label: "Chính sách bảo mật" },
] as const

export type StaticSeoPageId = (typeof STATIC_SEO_PAGES)[number]["id"]

export type PageSeoFields = {
  titleVi: string
  titleEn: string
  descriptionVi: string
  descriptionEn: string
  keywordsVi: string
  keywordsEn: string
}

export type StaticPageSeoEditorPage = {
  id: StaticSeoPageId
  label: string
  path: string
  values: PageSeoFields
  placeholders: {
    vi: { title: string; description: string; keywords: string }
    en: { title: string; description: string; keywords: string }
  }
  preview: {
    vi: { title: string; description: string }
    en: { title: string; description: string }
  }
}

type StoredPageSeo = {
  title: LocalizedText
  description: LocalizedText
  keywords: LocalizedText
}

type StoredPageSeoMap = Partial<Record<StaticSeoPageId, StoredPageSeo>>

const KEYWORD_PLACEHOLDERS = {
  vi: "váy cưới, áo dài, LINHouse",
  en: "wedding dress, ao dai, LINHouse",
} as const

function pageById(pageId: StaticSeoPageId) {
  const page = STATIC_SEO_PAGES.find((item) => item.id === pageId)
  if (!page) throw new Error(`Unknown SEO page: ${pageId}`)
  return page
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function asLocalized(value: unknown): LocalizedText {
  const record = asRecord(value)
  return {
    vi: typeof record.vi === "string" ? record.vi : "",
    en: typeof record.en === "string" ? record.en : "",
  }
}

function parseStoredPageSeo(value: unknown): StoredPageSeoMap {
  const record = asRecord(value)
  const stored: StoredPageSeoMap = {}
  for (const page of STATIC_SEO_PAGES) {
    const entry = asRecord(record[page.id])
    stored[page.id] = {
      title: asLocalized(entry.title),
      description: asLocalized(entry.description),
      keywords: asLocalized(entry.keywords),
    }
  }
  return stored
}

async function loadStoredPageSeo() {
  const copy = await loadSiteCopyMap()
  return parseStoredPageSeo(copy[SEO_PAGES_KEY])
}

function pick(text: LocalizedText | undefined, locale: Locale) {
  const primary = text?.[locale]?.trim() ?? ""
  if (primary) return primary
  if (locale === "en") return text?.vi?.trim() ?? ""
  return ""
}

function documentTitle(title: string) {
  const value = title.trim()
  if (!value) return ""
  if (/linhouse/i.test(value)) return value
  return `${value} | LINHouse`
}

function keywordList(value: string) {
  const keywords = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
  return keywords.length ? keywords : undefined
}

function fallbackFor(pageId: StaticSeoPageId, dict: Dictionary) {
  switch (pageId) {
    case "home":
      return null
    case "about":
      return {
        title: dict.aboutPage.metaTitle,
        description: dict.aboutPage.metaDescription,
      }
    case "support":
      return {
        title: dict.customerSupport.metaTitle,
        description: dict.customerSupport.metaDescription,
      }
    case "reviews":
      return {
        title: dict.reviewsPage.metaTitle,
        description: dict.reviewsPage.metaDescription,
      }
    case "blog":
      return {
        title: dict.home.blog.title,
        description: dict.home.blog.description,
      }
    case "shipping":
      return {
        title: dict.shippingPolicy.metaTitle,
        description: dict.shippingPolicy.metaDescription,
      }
    case "terms":
      return {
        title: dict.termsOfUse.metaTitle,
        description: dict.termsOfUse.metaDescription,
      }
    case "privacy":
      return {
        title: dict.privacyPolicy.metaTitle,
        description: dict.privacyPolicy.metaDescription,
      }
  }
}

function fallbackCopy(pageId: StaticSeoPageId, dict: Dictionary, locale: Locale) {
  if (pageId === "home") return HOME_SEO[locale]
  const copy = fallbackFor(pageId, dict)
  if (!copy) return HOME_SEO[locale]
  return {
    title: documentTitle(copy.title),
    description: copy.description,
  }
}

function resolveFrom(
  pageId: StaticSeoPageId,
  locale: Locale,
  stored: StoredPageSeoMap,
  dict: Dictionary
) {
  const fallback = fallbackCopy(pageId, dict, locale)
  const entry = stored[pageId]
  const title = documentTitle(pick(entry?.title, locale) || fallback.title)
  const description = pick(entry?.description, locale) || fallback.description
  return {
    title,
    description,
    keywords: keywordList(pick(entry?.keywords, locale)),
  }
}

function fieldsFrom(entry: StoredPageSeo | undefined): PageSeoFields {
  return {
    titleVi: entry?.title.vi ?? "",
    titleEn: entry?.title.en ?? "",
    descriptionVi: entry?.description.vi ?? "",
    descriptionEn: entry?.description.en ?? "",
    keywordsVi: entry?.keywords.vi ?? "",
    keywordsEn: entry?.keywords.en ?? "",
  }
}

function cleanLocalized(
  vi: unknown,
  en: unknown,
  max: number,
  label: string
): { ok: true; value: LocalizedText } | { ok: false; error: string } {
  if (typeof vi !== "string" || typeof en !== "string") {
    return { ok: false, error: "Dữ liệu form không đầy đủ. Tải lại trang và thử lại." }
  }
  const value = {
    vi: sanitizePlainText(vi),
    en: sanitizePlainText(en),
  }
  if (value.vi.length > max || value.en.length > max) {
    return { ok: false, error: `${label} tối đa ${max} ký tự.` }
  }
  return { ok: true, value }
}

export async function getStaticPageSeoEditor(): Promise<StaticPageSeoEditorPage[]> {
  const [stored, viDict, enDict] = await Promise.all([
    loadStoredPageSeo(),
    getDictionary("vi"),
    getDictionary("en"),
  ])

  return STATIC_SEO_PAGES.map((page) => {
    const viFallback = fallbackCopy(page.id, viDict, "vi")
    const enFallback = fallbackCopy(page.id, enDict, "en")
    const viPreview = resolveFrom(page.id, "vi", stored, viDict)
    const enPreview = resolveFrom(page.id, "en", stored, enDict)
    return {
      id: page.id,
      label: page.label,
      path: page.path,
      values: fieldsFrom(stored[page.id]),
      placeholders: {
        vi: {
          title: viFallback.title,
          description: viFallback.description,
          keywords: KEYWORD_PLACEHOLDERS.vi,
        },
        en: {
          title: enFallback.title,
          description: enFallback.description,
          keywords: KEYWORD_PLACEHOLDERS.en,
        },
      },
      preview: {
        vi: { title: viPreview.title, description: viPreview.description },
        en: { title: enPreview.title, description: enPreview.description },
      },
    }
  })
}

export async function writeStaticPageSeo(
  input: Record<string, PageSeoFields>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const current = await loadStoredPageSeo()
  const next: StoredPageSeoMap = { ...current }

  for (const page of STATIC_SEO_PAGES) {
    const fields = input[page.id]
    if (!fields) continue

    const title = cleanLocalized(fields.titleVi, fields.titleEn, TITLE_MAX, `Tiêu đề SEO của ${page.label}`)
    if (!title.ok) return title
    const description = cleanLocalized(
      fields.descriptionVi,
      fields.descriptionEn,
      DESCRIPTION_MAX,
      `Mô tả SEO của ${page.label}`
    )
    if (!description.ok) return description
    const keywords = cleanLocalized(
      fields.keywordsVi,
      fields.keywordsEn,
      KEYWORDS_MAX,
      `Từ khóa của ${page.label}`
    )
    if (!keywords.ok) return keywords

    next[page.id] = {
      title: title.value,
      description: description.value,
      keywords: keywords.value,
    }
  }

  await db
    .insert(siteCopy)
    .values({ key: SEO_PAGES_KEY, value: next })
    .onDuplicateKeyUpdate({ set: { value: next } })

  return { ok: true }
}

export async function resolveStaticPageSeo(locale: StorefrontLocale, pageId: StaticSeoPageId) {
  const [stored, dict] = await Promise.all([loadStoredPageSeo(), getDictionary(locale)])
  return resolveFrom(pageId, locale, stored, dict)
}

export async function staticPageMetadata(locale: StorefrontLocale, pageId: StaticSeoPageId) {
  const page = pageById(pageId)
  const seo = await resolveStaticPageSeo(locale, pageId)
  return withStorefrontSeo(locale, page.path, {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    ...(pageId === "home" ? { image: "/og-image.webp", imageAlt: "LINHouse" } : {}),
  })
}

export function staticSeoPaths() {
  return STATIC_SEO_PAGES.map((page) => page.path)
}
