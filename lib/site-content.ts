import "server-only"
import { cache } from "react"
import viDict from "@/app/[locale]/dictionaries/vi.json"
import enDict from "@/app/[locale]/dictionaries/en.json"
import type { Dictionary, Locale } from "@/app/[locale]/dictionaries"
import { db } from "@/lib/db"
import { siteCopy } from "@/lib/db/schema"
import { getImageUrl, parseCmsStorageKey } from "@/lib/cms-image"
import { sanitizePlainText, sanitizeRichTextHtml } from "@/lib/sanitize-content"
import {
  ABOUT_FAQ_ANSWER_MAX,
  ABOUT_FAQ_QUESTION_MAX,
  ABOUT_MILESTONE_ALT_MAX,
  ABOUT_MILESTONE_BODY_MAX,
  ABOUT_MILESTONE_TITLE_MAX,
  ABOUT_MILESTONE_YEAR_MAX,
  DEFAULT_ABOUT_MILESTONE_IMAGE,
  MAX_ABOUT_FAQ_ITEMS,
  MAX_ABOUT_MILESTONES,
  aboutFaqItemKey,
  aboutMilestoneKey,
  withAboutFaqItems,
  withAboutMilestones,
} from "@/lib/about-list-items"
import {
  MAX_SHIPPING_SECTIONS,
  SHIPPING_SECTION_BODY_MAX,
  SHIPPING_SECTION_TITLE_MAX,
  shippingSectionKey,
  withShippingSections,
} from "@/lib/shipping-policy-sections"

export type ContentPair = { vi: string; en: string }

export type ContentField = {
  key: string
  label: string
  hint?: string
  tooltip?: string
  group?: string
  nameTokens?: { vi: { label: string; token: string }[]; en: { label: string; token: string }[] }
  multiline?: boolean
  lines?: boolean
  rich?: boolean
  maxLength: number
}

export type ContentSection = {
  id: string
  title: string
  description: string
  fields: ContentField[]
}

export type SiteContentFormData = {
  values: Record<string, ContentPair>
  defaults: Record<string, ContentPair>
  sections: ContentSection[]
}

const SHORT = 180
const MEDIUM = 400
const LONG = 2000
const RICH = 40000
const LINE = 160
const MAX_LINES = 12

type CopyMap = Record<string, unknown>

type CleanedContent = {
  pairs: Record<string, ContentPair>
  lines: Record<string, { vi: string[]; en: string[] }>
}

function field(
  key: string,
  label: string,
  options?: {
    hint?: string
    tooltip?: string
    group?: string
    multiline?: boolean
    lines?: boolean
    rich?: boolean
    maxLength?: number
  }
): ContentField {
  return {
    key,
    label,
    hint: options?.hint,
    tooltip: options?.tooltip,
    group: options?.group,
    multiline: options?.multiline || options?.lines,
    lines: options?.lines,
    rich: options?.rich,
    maxLength: options?.maxLength ?? SHORT,
  }
}

function record(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function serviceMenuHref(value: unknown, fallback: string) {
  const data = record(value)
  const vi = typeof data.vi === "string" ? data.vi.trim() : ""
  const en = typeof data.en === "string" ? data.en.trim() : ""
  const href = vi || en || fallback
  return isServiceMenuHref(href) ? href : fallback
}

function isServiceMenuHref(href: string) {
  return (
    href.startsWith("/") ||
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("http://") ||
    href.startsWith("https://")
  )
}

function localizedText(value: unknown, locale: Locale, fallback: string) {
  const data = record(value)
  const primary = data[locale]
  if (typeof primary === "string" && primary.trim()) return primary.trim()
  const vi = data.vi
  if (typeof vi === "string" && vi.trim()) return vi.trim()
  return fallback
}

function localizedLines(value: unknown, locale: Locale, fallback: string[]) {
  const data = record(value)
  const pick = (key: string) => {
    const list = data[key]
    if (!Array.isArray(list)) return []
    return list
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
  }
  const primary = pick(locale)
  if (primary.length > 0) return primary
  const vi = pick("vi")
  if (vi.length > 0) return vi
  return fallback
}

function displayPair(value: unknown, fallback: ContentPair): ContentPair {
  const data = record(value)
  const vi = typeof data.vi === "string" && data.vi.trim() ? data.vi : fallback.vi
  const en = typeof data.en === "string" && data.en.trim() ? data.en : fallback.en
  return { vi, en }
}

function displayLines(value: unknown, fallback: ContentPair): ContentPair {
  const data = record(value)
  const text = (list: unknown, fallbackText: string) => {
    if (!Array.isArray(list)) return fallbackText
    const lines = list
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
    return lines.length > 0 ? lines.join("\n") : fallbackText
  }
  return {
    vi: text(data.vi, fallback.vi),
    en: text(data.en, fallback.en),
  }
}

function joinLines(lines: readonly string[]) {
  return lines.join("\n")
}

const RETIRED_FOOTER_LINKS = new Set([
  "chính sách bảo hành",
  "warranty policy",
  "chính sách đổi trả",
  "returns",
  "vận chuyển",
  "shipping",
])

function keptFooterLines(value: unknown) {
  return (Array.isArray(value) ? value : [])
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item && !RETIRED_FOOTER_LINKS.has(item.toLocaleLowerCase("vi")))
}

function mergedFooterServiceLinks(footer: Record<string, unknown>) {
  const customer = record(footer.customerServiceLinks)
  const support = record(footer.supportLinks)
  const merge = (locale: "vi" | "en") => {
    const seen = new Set<string>()
    return [...keptFooterLines(customer[locale]), ...keptFooterLines(support[locale])].filter(
      (line) => {
        const key = line.toLocaleLowerCase("vi")
        if (seen.has(key)) return false
        seen.add(key)
        return true
      }
    )
  }
  return { vi: merge("vi"), en: merge("en") }
}

function footerServiceLinks(
  footer: Record<string, unknown>,
  locale: Locale,
  fallback: string[]
) {
  const merged = mergedFooterServiceLinks(footer)
  if (merged[locale].length > 0) return merged[locale]
  if (merged.vi.length > 0) return merged.vi
  return fallback.filter(
    (line) => !RETIRED_FOOTER_LINKS.has(line.trim().toLocaleLowerCase("vi"))
  )
}

export function contentModel() {
  const defaults: Record<string, ContentPair> = {}
  const put = (key: string, vi: string, en: string) => {
    defaults[key] = { vi, en }
  }

  put("footer.companyTitle", viDict.footer.company.title, enDict.footer.company.title)
  put("footer.phoneLabel", viDict.footer.company.phoneLabel, enDict.footer.company.phoneLabel)
  put("footer.emailLabel", viDict.footer.company.emailLabel, enDict.footer.company.emailLabel)
  put("footer.customerService", viDict.footer.customerService, enDict.footer.customerService)
  put(
    "footer.customerServiceLinks",
    joinLines(viDict.footer.customerServiceLinks),
    joinLines(enDict.footer.customerServiceLinks)
  )
  put("footer.legal", viDict.footer.legal, enDict.footer.legal)
  put("footer.legalLinks", joinLines(viDict.footer.legalLinks), joinLines(enDict.footer.legalLinks))
  put("footer.map", viDict.footer.map, enDict.footer.map)
  put("footer.copy", viDict.footer.copy, enDict.footer.copy)

  put("shipping.title", viDict.shippingPolicy.title, enDict.shippingPolicy.title)
  put("shipping.intro", viDict.shippingPolicy.intro, enDict.shippingPolicy.intro)
  put(
    "shipping.metaDescription",
    viDict.shippingPolicy.metaDescription,
    enDict.shippingPolicy.metaDescription
  )

  viDict.shippingPolicy.sections.forEach((section, index) => {
    const enSection = enDict.shippingPolicy.sections[index]
    put(shippingSectionKey(index, "title"), section.title, enSection?.title ?? "")
    put(shippingSectionKey(index, "body"), section.body, enSection?.body ?? "")
  })

  put("terms.title", viDict.termsOfUse.title, enDict.termsOfUse.title)
  put("terms.metaDescription", viDict.termsOfUse.metaDescription, enDict.termsOfUse.metaDescription)
  put("terms.body", viDict.termsOfUse.body, enDict.termsOfUse.body)
  put("privacy.title", viDict.privacyPolicy.title, enDict.privacyPolicy.title)
  put(
    "privacy.metaDescription",
    viDict.privacyPolicy.metaDescription,
    enDict.privacyPolicy.metaDescription
  )
  put("privacy.body", viDict.privacyPolicy.body, enDict.privacyPolicy.body)

  put("support.title", viDict.customerSupport.title, enDict.customerSupport.title)
  put(
    "support.metaDescription",
    viDict.customerSupport.metaDescription,
    enDict.customerSupport.metaDescription
  )
  put("support.intro", viDict.customerSupport.intro, enDict.customerSupport.intro)
  put("support.name", viDict.customerSupport.name, enDict.customerSupport.name)
  put("support.email", viDict.customerSupport.email, enDict.customerSupport.email)
  put("support.message", viDict.customerSupport.message, enDict.customerSupport.message)
  put("support.submit", viDict.customerSupport.submit, enDict.customerSupport.submit)
  put("support.sending", viDict.customerSupport.sending, enDict.customerSupport.sending)
  put("support.success", viDict.customerSupport.success, enDict.customerSupport.success)
  put("support.error", viDict.customerSupport.error, enDict.customerSupport.error)
  put("support.required", viDict.customerSupport.required, enDict.customerSupport.required)
  put(
    "support.invalidEmail",
    viDict.customerSupport.invalidEmail,
    enDict.customerSupport.invalidEmail
  )
  put("support.rateLimit", viDict.customerSupport.rateLimit, enDict.customerSupport.rateLimit)

  put("home.headline", viDict.home.headline, enDict.home.headline)
  put("home.subhead", viDict.home.subhead, enDict.home.subhead)
  put("home.description", viDict.home.description, enDict.home.description)
  put("home.cta", viDict.home.cta, enDict.home.cta)
  put("home.imageAlt", viDict.home.imageAlt, enDict.home.imageAlt)
  put("home.collectionTitle", viDict.home.collection.title, enDict.home.collection.title)
  put("home.featuredTitle", viDict.home.featured.title, enDict.home.featured.title)
  put("home.featuredLoadMore", viDict.home.featured.loadMore, enDict.home.featured.loadMore)
  put("home.featuredShowLess", viDict.home.featured.showLess, enDict.home.featured.showLess)
  put("home.aboutLabel", viDict.home.about.label, enDict.home.about.label)
  put("home.aboutHeadline", viDict.home.about.headline, enDict.home.about.headline)
  put("home.aboutBody", viDict.home.about.body, enDict.home.about.body)

  const aboutStepFields: ContentField[] = []
  viDict.home.about.steps.forEach((step, index) => {
    const enStep = enDict.home.about.steps[index]
    const titleKey = `home.aboutStep.${index}.title`
    const bodyKey = `home.aboutStep.${index}.body`
    put(titleKey, step.title, enStep?.title ?? "")
    put(bodyKey, step.body, enStep?.body ?? "")
    aboutStepFields.push(
      field(titleKey, `Bước ${step.number} — tiêu đề`, { group: "Đặt hàng từ nước ngoài" }),
      field(bodyKey, `Bước ${step.number} — nội dung`, {
        group: "Đặt hàng từ nước ngoài",
        multiline: true,
        maxLength: LONG,
      })
    )
  })

  put("home.blogTitle", viDict.home.blog.title, enDict.home.blog.title)
  put("home.blogDescription", viDict.home.blog.description, enDict.home.blog.description)
  put("home.blogReadMore", viDict.home.blog.readMore, enDict.home.blog.readMore)
  put("home.blogViewAll", viDict.home.blog.viewAll, enDict.home.blog.viewAll)
  put("home.blogEmpty", viDict.home.blog.empty, enDict.home.blog.empty)
  put("home.blogBack", viDict.home.blog.back, enDict.home.blog.back)

  put("nav.home", viDict.nav.home, enDict.nav.home)
  put("nav.collection", viDict.nav.collection, enDict.nav.collection)
  put("nav.bridal", viDict.nav.bridal, enDict.nav.bridal)
  put("nav.aodai", viDict.nav.aodai, enDict.nav.aodai)
  put("nav.services", viDict.nav.services, enDict.nav.services)
  put("nav.book", viDict.nav.book, enDict.nav.book)
  put("nav.bookHint", viDict.nav.bookHint, enDict.nav.bookHint)
  put("nav.bookSubmit", viDict.nav.bookSubmit, enDict.nav.bookSubmit)
  put("nav.top.contact", viDict.nav.top.contact, enDict.nav.top.contact)
  put("nav.top.reviews", viDict.nav.top.reviews, enDict.nav.top.reviews)
  put("nav.top.shipping", viDict.nav.top.shipping, enDict.nav.top.shipping)
  put("nav.top.faq", viDict.nav.top.faq, enDict.nav.top.faq)
  put("nav.top.services", viDict.nav.top.services, enDict.nav.top.services)

  const serviceMenuFields: ContentField[] = []
  viDict.nav.serviceItems.forEach((item, index) => {
    const enItem = enDict.nav.serviceItems[index]
    const labelKey = `nav.service.${index}.label`
    const hrefKey = `nav.service.${index}.href`
    put(labelKey, item.label, enItem?.label ?? "")
    put(hrefKey, item.href, enItem?.href ?? item.href)
    const group = `Mục ${index + 1}`
    serviceMenuFields.push(
      field(labelKey, "Tên trên menu", { group }),
      field(hrefKey, "Liên kết", {
        group,
        maxLength: 500,
        hint: "Đường dẫn trong site như /about, neo như #footer, hoặc URL đầy đủ. Để trống sẽ dùng liên kết mặc định.",
      })
    )
  })

  put("about.metaTitle", viDict.aboutPage.metaTitle, enDict.aboutPage.metaTitle)
  put("about.metaDescription", viDict.aboutPage.metaDescription, enDict.aboutPage.metaDescription)
  put("nav.about", viDict.nav.about, enDict.nav.about)
  put("about.title", viDict.aboutPage.title, enDict.aboutPage.title)
  put("about.heroAlt", viDict.aboutPage.heroAlt, enDict.aboutPage.heroAlt)
  put("about.eyebrow", viDict.aboutPage.eyebrow, enDict.aboutPage.eyebrow)
  put("about.headline", viDict.aboutPage.headline, enDict.aboutPage.headline)
  put("about.body", viDict.aboutPage.body, enDict.aboutPage.body)
  put("about.valuesCta", viDict.aboutPage.valuesCta, enDict.aboutPage.valuesCta)
  put("about.statement", viDict.aboutPage.statement, enDict.aboutPage.statement)
  put("about.pillarsImageAlt", viDict.aboutPage.pillarsImageAlt, enDict.aboutPage.pillarsImageAlt)
  put("about.journeyTitle", viDict.aboutPage.journeyTitle, enDict.aboutPage.journeyTitle)
  put("about.faq.eyebrow", viDict.aboutPage.faq.eyebrow, enDict.aboutPage.faq.eyebrow)
  put("about.faq.title", viDict.aboutPage.faq.title, enDict.aboutPage.faq.title)

  const aboutFields: ContentField[] = [
    field("about.metaTitle", "Tiêu đề trang", {
      group: "Trang",
      maxLength: MEDIUM,
      hint: "Hiện trên tab trình duyệt.",
    }),
    field("about.metaDescription", "Mô tả ngắn", {
      group: "Trang",
      multiline: true,
      maxLength: MEDIUM,
      hint: "Hiện trong kết quả tìm kiếm.",
    }),
    field("about.title", "Tiêu đề lớn", { group: "Ảnh đầu trang", maxLength: MEDIUM }),
    field("about.heroAlt", "Mô tả ảnh", { group: "Ảnh đầu trang", maxLength: MEDIUM }),
    field("about.eyebrow", "Nhãn nhỏ", { group: "Đoạn giới thiệu" }),
    field("about.headline", "Tiêu đề", {
      group: "Đoạn giới thiệu",
      multiline: true,
      maxLength: MEDIUM,
    }),
    field("about.body", "Đoạn mô tả", {
      group: "Đoạn giới thiệu",
      multiline: true,
      maxLength: LONG,
    }),
    field("about.valuesCta", "Nút giá trị", { group: "Đoạn giới thiệu" }),
    field("about.statement", "Dòng chữ lớn", { group: "Dòng chữ lớn", maxLength: MEDIUM }),
    field("about.pillarsImageAlt", "Mô tả ảnh", { group: "Giá trị", maxLength: MEDIUM }),
  ]

  viDict.aboutPage.pillars.forEach((pillar, index) => {
    const enPillar = enDict.aboutPage.pillars[index]
    const labelKey = `about.pillar.${index}.label`
    const titleKey = `about.pillar.${index}.title`
    const bodyKey = `about.pillar.${index}.body`
    put(labelKey, pillar.label, enPillar?.label ?? "")
    put(titleKey, pillar.title, enPillar?.title ?? "")
    put(bodyKey, pillar.body, enPillar?.body ?? "")
    const group = `Giá trị ${index + 1}`
    aboutFields.push(
      field(labelKey, "Nhãn", { group }),
      field(titleKey, "Tiêu đề", { group, multiline: true, maxLength: MEDIUM }),
      field(bodyKey, "Nội dung", { group, multiline: true, maxLength: LONG })
    )
  })

  aboutFields.push(
    field("about.journeyTitle", "Tiêu đề", {
      group: "Hành trình",
      multiline: true,
      maxLength: MEDIUM,
      hint: "Xuống dòng để tách tiêu đề thành hai dòng.",
    })
  )

  viDict.aboutPage.milestones.forEach((milestone, index) => {
    const enMilestone = enDict.aboutPage.milestones[index]
    const yearKey = `about.milestone.${index}.year`
    const titleKey = `about.milestone.${index}.title`
    const bodyKey = `about.milestone.${index}.body`
    const altKey = `about.milestone.${index}.imageAlt`
    put(yearKey, milestone.year, enMilestone?.year ?? "")
    put(titleKey, milestone.title, enMilestone?.title ?? "")
    put(bodyKey, milestone.body, enMilestone?.body ?? "")
    put(altKey, milestone.imageAlt, enMilestone?.imageAlt ?? "")
    put(
      aboutMilestoneKey(index, "image"),
      milestone.image,
      enMilestone?.image ?? milestone.image
    )
  })

  aboutFields.push(
    field("about.faq.eyebrow", "Nhãn nhỏ", { group: "Câu hỏi thường gặp" }),
    field("about.faq.title", "Tiêu đề", {
      group: "Câu hỏi thường gặp",
      multiline: true,
      maxLength: MEDIUM,
      hint: "Xuống dòng để tách tiêu đề thành hai dòng.",
    })
  )

  viDict.aboutPage.faq.items.forEach((item, index) => {
    const enItem = enDict.aboutPage.faq.items[index]
    const questionKey = `about.faq.${index}.question`
    const answerKey = `about.faq.${index}.answer`
    put(questionKey, item.question, enItem?.question ?? "")
    put(answerKey, item.answer, enItem?.answer ?? "")
  })

  put("booking.title", viDict.booking.title, enDict.booking.title)
  put("booking.subtitle", viDict.booking.subtitle, enDict.booking.subtitle)
  put("booking.fullName", viDict.booking.fullName, enDict.booking.fullName)
  put("booking.phone", viDict.booking.phone, enDict.booking.phone)
  put("booking.email", viDict.booking.email, enDict.booking.email)
  put("booking.contactMethod", viDict.booking.contactMethod, enDict.booking.contactMethod)
  put("booking.selectStore", viDict.booking.selectStore, enDict.booking.selectStore)
  put("booking.date", viDict.booking.date, enDict.booking.date)
  put("booking.message", viDict.booking.message, enDict.booking.message)
  put("booking.productInterest", viDict.booking.productInterest, enDict.booking.productInterest)
  put("booking.submit", viDict.booking.submit, enDict.booking.submit)
  put("booking.sending", viDict.booking.sending, enDict.booking.sending)
  put("booking.success", viDict.booking.success, enDict.booking.success)
  put("booking.error", viDict.booking.error, enDict.booking.error)

  put("catalog.filters", viDict.catalogPage.filters, enDict.catalogPage.filters)
  put("catalog.clear", viDict.catalogPage.clear, enDict.catalogPage.clear)
  put("catalog.results", viDict.catalogPage.results, enDict.catalogPage.results)
  put("catalog.empty", viDict.catalogPage.empty, enDict.catalogPage.empty)
  put("catalog.loadMore", viDict.catalogPage.loadMore, enDict.catalogPage.loadMore)
  put("catalog.readMore", viDict.catalogPage.readMore, enDict.catalogPage.readMore)
  put("catalog.showLess", viDict.catalogPage.showLess, enDict.catalogPage.showLess)
  put("catalog.otherCollections", viDict.catalogPage.otherCollections, enDict.catalogPage.otherCollections)
  put("catalog.sort", viDict.catalogPage.sort, enDict.catalogPage.sort)

  put("product.related", viDict.productPage.related, enDict.productPage.related)
  put("product.youMayAlsoLike", viDict.productPage.youMayAlsoLike, enDict.productPage.youMayAlsoLike)
  put("product.details", viDict.productPage.details, enDict.productPage.details)
  put("product.book", viDict.productPage.book, enDict.productPage.book)
  put("product.contact", viDict.products.contact, enDict.products.contact)
  put("product.purchaseRent", viDict.productPage.purchaseOptions.rent, enDict.productPage.purchaseOptions.rent)
  put(
    "product.purchaseMadeToOrder",
    viDict.productPage.purchaseOptions["made-to-order"],
    enDict.productPage.purchaseOptions["made-to-order"]
  )
  put(
    "product.purchaseReady",
    viDict.productPage.purchaseOptions["ready-to-purchase"],
    enDict.productPage.purchaseOptions["ready-to-purchase"]
  )
  put("product.careTitle", viDict.productPage.careTitle, enDict.productPage.careTitle)
  put("product.care", viDict.productPage.care, enDict.productPage.care)
  put("product.shippingTitle", viDict.productPage.shippingTitle, enDict.productPage.shippingTitle)
  put("product.shipping", viDict.productPage.shipping, enDict.productPage.shipping)
  put(
    "product.madeToMeasureTitle",
    viDict.productPage.madeToMeasureTitle,
    enDict.productPage.madeToMeasureTitle
  )
  put("product.madeToMeasure", viDict.productPage.madeToMeasure, enDict.productPage.madeToMeasure)
  put("product.nameFormat", "[tên]", "[name]")
  put("product.nameFormatAoDai", "[tên]", "[name]")
  put("product.lead", viDict.productPage.lead, enDict.productPage.lead)
  put("product.leadAoDai", viDict.productPage.leadAoDai, enDict.productPage.leadAoDai)
  put("product.body", viDict.productPage.body, enDict.productPage.body)

  const sections: ContentSection[] = [
    {
      id: "services-menu",
      title: "Menu Our services",
      description:
        "Ba mục trong menu Our services trên header. Tên có bản tiếng Việt và tiếng Anh. Liên kết dùng giá trị tiếng Việt nếu có, nếu không thì dùng tiếng Anh.",
      fields: serviceMenuFields,
    },
    {
      id: "shipping",
      title: "Chính sách giao hàng",
      description:
        "Nội dung trang chính sách giao hàng. Tiêu đề cũng là liên kết cùng tên trong cột Dịch vụ khách hàng ở footer. Thêm hoặc xóa từng mục bên dưới.",
      fields: [
        field("shipping.title", "Tiêu đề", {
          group: "Trang",
          maxLength: MEDIUM,
          hint: "Dùng làm tên liên kết ở footer.",
        }),
        field("shipping.metaDescription", "Mô tả ngắn", {
          group: "Trang",
          multiline: true,
          maxLength: MEDIUM,
          hint: "Hiện trong kết quả tìm kiếm.",
        }),
        field("shipping.intro", "Đoạn mở đầu", {
          group: "Trang",
          multiline: true,
          maxLength: LONG,
        }),
      ],
    },
    {
      id: "terms",
      title: "Điều khoản sử dụng",
      description:
        "Nội dung trang điều khoản sử dụng. Tiêu đề cũng là tên mục tương ứng trong cột Điều khoản ở footer.",
      fields: [
        field("terms.title", "Tiêu đề", {
          group: "Trang",
          maxLength: MEDIUM,
          hint: "Dùng làm tên liên kết ở footer.",
        }),
        field("terms.metaDescription", "Mô tả ngắn", {
          group: "Trang",
          multiline: true,
          maxLength: MEDIUM,
          hint: "Hiện trong kết quả tìm kiếm.",
        }),
        field("terms.body", "Nội dung", {
          group: "Trang",
          rich: true,
          maxLength: RICH,
        }),
      ],
    },
    {
      id: "privacy",
      title: "Chính sách bảo mật",
      description:
        "Nội dung trang chính sách bảo mật. Tiêu đề cũng là tên mục tương ứng trong cột Điều khoản ở footer.",
      fields: [
        field("privacy.title", "Tiêu đề", {
          group: "Trang",
          maxLength: MEDIUM,
          hint: "Dùng làm tên liên kết ở footer.",
        }),
        field("privacy.metaDescription", "Mô tả ngắn", {
          group: "Trang",
          multiline: true,
          maxLength: MEDIUM,
          hint: "Hiện trong kết quả tìm kiếm.",
        }),
        field("privacy.body", "Nội dung", {
          group: "Trang",
          rich: true,
          maxLength: RICH,
        }),
      ],
    },
    {
      id: "support",
      title: "Hỗ trợ khách hàng",
      description:
        "Chữ trên trang hỗ trợ khách hàng. Tiêu đề cũng là tên mục tương ứng trong cột Dịch vụ khách hàng ở footer.",
      fields: [
        field("support.title", "Tiêu đề", {
          group: "Trang",
          maxLength: MEDIUM,
          hint: "Dùng làm tiêu đề trang và tên liên kết ở footer.",
        }),
        field("support.metaDescription", "Mô tả ngắn", {
          group: "Trang",
          multiline: true,
          maxLength: MEDIUM,
          hint: "Hiện trong kết quả tìm kiếm.",
        }),
        field("support.intro", "Đoạn mở đầu", {
          group: "Trang",
          multiline: true,
          maxLength: LONG,
        }),
        field("support.name", "Nhãn họ tên", { group: "Nhãn biểu mẫu" }),
        field("support.email", "Nhãn email", { group: "Nhãn biểu mẫu" }),
        field("support.message", "Nhãn nội dung", { group: "Nhãn biểu mẫu" }),
        field("support.submit", "Nút gửi", { group: "Nút và thông báo" }),
        field("support.sending", "Trạng thái đang gửi", { group: "Nút và thông báo" }),
        field("support.success", "Thông báo thành công", {
          group: "Nút và thông báo",
          multiline: true,
          maxLength: MEDIUM,
        }),
        field("support.error", "Thông báo không gửi được", {
          group: "Nút và thông báo",
          multiline: true,
          maxLength: MEDIUM,
        }),
        field("support.required", "Thiếu thông tin", {
          group: "Nút và thông báo",
          multiline: true,
          maxLength: MEDIUM,
        }),
        field("support.invalidEmail", "Email không hợp lệ", {
          group: "Nút và thông báo",
          multiline: true,
          maxLength: MEDIUM,
        }),
        field("support.rateLimit", "Gửi quá nhiều", {
          group: "Nút và thông báo",
          multiline: true,
          maxLength: MEDIUM,
        }),
      ],
    },
    {
      id: "home",
      title: "Trang chủ",
      description:
        "Banner, tiêu đề các section và phần đặt hàng từ nước ngoài. Tiêu đề câu chuyện cô dâu sửa ở trang Câu chuyện cô dâu.",
      fields: [
        field("home.headline", "Tiêu đề lớn", { group: "Banner", maxLength: MEDIUM }),
        field("home.subhead", "Tiêu đề phụ", { group: "Banner", maxLength: MEDIUM }),
        field("home.description", "Đoạn giới thiệu", {
          group: "Banner",
          multiline: true,
          maxLength: LONG,
        }),
        field("home.cta", "Nút kêu gọi", { group: "Banner" }),
        field("home.imageAlt", "Mô tả ảnh banner", { group: "Banner", maxLength: MEDIUM }),
        field("home.collectionTitle", "Tiêu đề", { group: "Bộ sưu tập" }),
        field("home.featuredTitle", "Tiêu đề", { group: "Sản phẩm nổi bật" }),
        field("home.featuredLoadMore", "Nút xem thêm", { group: "Sản phẩm nổi bật" }),
        field("home.featuredShowLess", "Nút thu gọn", { group: "Sản phẩm nổi bật" }),
        field("home.aboutLabel", "Nhãn nhỏ", { group: "Đặt hàng từ nước ngoài" }),
        field("home.aboutHeadline", "Tiêu đề", { group: "Đặt hàng từ nước ngoài", maxLength: MEDIUM }),
        field("home.aboutBody", "Đoạn mô tả", {
          group: "Đặt hàng từ nước ngoài",
          multiline: true,
          maxLength: LONG,
        }),
        ...aboutStepFields,
        field("home.blogTitle", "Tiêu đề", { group: "Kinh nghiệm cưới" }),
        field("home.blogDescription", "Mô tả", {
          group: "Kinh nghiệm cưới",
          multiline: true,
          maxLength: LONG,
        }),
        field("home.blogReadMore", "Nút đọc tiếp", { group: "Kinh nghiệm cưới" }),
        field("home.blogViewAll", "Nút xem tất cả", { group: "Kinh nghiệm cưới" }),
        field("home.blogEmpty", "Khi chưa có bài", { group: "Kinh nghiệm cưới", maxLength: MEDIUM }),
        field("home.blogBack", "Nút quay lại", { group: "Kinh nghiệm cưới", maxLength: MEDIUM }),
      ],
    },
    {
      id: "about",
      title: "Giới thiệu",
      description:
        "Chữ trên trang About. Có thể thêm hoặc xóa mốc năm và câu hỏi, và tải ảnh cho từng mốc.",
      fields: aboutFields,
    },
    {
      id: "booking",
      title: "Đặt lịch",
      description: "Chữ trong hộp thoại đặt lịch hẹn.",
      fields: [
        field("booking.title", "Tiêu đề", { group: "Tiêu đề" }),
        field("booking.subtitle", "Mô tả", {
          group: "Tiêu đề",
          multiline: true,
          maxLength: MEDIUM,
        }),
        field("booking.fullName", "Nhãn họ tên", { group: "Nhãn biểu mẫu" }),
        field("booking.phone", "Nhãn số điện thoại", { group: "Nhãn biểu mẫu" }),
        field("booking.email", "Nhãn email", { group: "Nhãn biểu mẫu" }),
        field("booking.contactMethod", "Nhãn phương thức liên lạc", { group: "Nhãn biểu mẫu" }),
        field("booking.selectStore", "Nhãn chọn cửa hàng", { group: "Nhãn biểu mẫu" }),
        field("booking.date", "Nhãn ngày giờ", { group: "Nhãn biểu mẫu" }),
        field("booking.message", "Nhãn lời nhắn", { group: "Nhãn biểu mẫu" }),
        field("booking.productInterest", "Nhãn sản phẩm quan tâm", { group: "Nhãn biểu mẫu" }),
        field("booking.submit", "Nút gửi", { group: "Nút và thông báo" }),
        field("booking.sending", "Trạng thái đang gửi", { group: "Nút và thông báo" }),
        field("booking.success", "Thông báo thành công", {
          group: "Nút và thông báo",
          multiline: true,
          maxLength: MEDIUM,
        }),
        field("booking.error", "Thông báo lỗi", {
          group: "Nút và thông báo",
          multiline: true,
          maxLength: MEDIUM,
        }),
      ],
    },
    {
      id: "catalog",
      title: "Trang danh mục",
      description: "Chữ trên trang bộ sưu tập và bộ lọc sản phẩm.",
      fields: [
        field("catalog.filters", "Bộ lọc", { group: "Bộ lọc" }),
        field("catalog.clear", "Xóa bộ lọc", { group: "Bộ lọc" }),
        field("catalog.sort", "Nhãn sắp xếp", { group: "Bộ lọc" }),
        field("catalog.results", "Đơn vị đếm kết quả", {
          group: "Kết quả",
          hint: "Ví dụ: mẫu váy",
        }),
        field("catalog.empty", "Khi không có kết quả", {
          group: "Kết quả",
          multiline: true,
          maxLength: MEDIUM,
        }),
        field("catalog.loadMore", "Nút xem thêm", { group: "Kết quả" }),
        field("catalog.readMore", "Nút xem thêm mô tả", { group: "Mô tả bộ sưu tập" }),
        field("catalog.showLess", "Nút thu gọn", { group: "Mô tả bộ sưu tập" }),
        field("catalog.otherCollections", "Tiêu đề bộ sưu tập khác", { group: "Mô tả bộ sưu tập" }),
      ],
    },
    {
      id: "product",
      title: "Trang sản phẩm",
      description: "Tiêu đề, nút và đoạn mô tả dùng chung trên mọi trang sản phẩm.",
      fields: [
        field("product.related", "Tiêu đề sản phẩm liên quan", { group: "Tiêu đề và nút" }),
        field("product.youMayAlsoLike", "Tiêu đề gợi ý", { group: "Tiêu đề và nút" }),
        field("product.details", "Tiêu đề chi tiết", { group: "Tiêu đề và nút" }),
        field("product.book", "Nút liên hệ tư vấn", { group: "Tiêu đề và nút" }),
        field("product.contact", "Nút liên hệ trên thẻ sản phẩm", { group: "Tiêu đề và nút" }),
        field("product.purchaseRent", "Hình thức cho thuê", { group: "Hình thức mua" }),
        field("product.purchaseMadeToOrder", "Hình thức may đo", { group: "Hình thức mua" }),
        field("product.purchaseReady", "Hình thức mua sẵn", { group: "Hình thức mua" }),
        field("product.careTitle", "Tiêu đề bảo quản", { group: "Bảo quản, vận chuyển, may đo" }),
        field("product.care", "Nội dung bảo quản", {
          group: "Bảo quản, vận chuyển, may đo",
          multiline: true,
          maxLength: LONG,
        }),
        field("product.shippingTitle", "Tiêu đề vận chuyển", { group: "Bảo quản, vận chuyển, may đo" }),
        field("product.shipping", "Nội dung vận chuyển", {
          group: "Bảo quản, vận chuyển, may đo",
          multiline: true,
          maxLength: LONG,
        }),
        field("product.madeToMeasureTitle", "Tiêu đề may đo", { group: "Bảo quản, vận chuyển, may đo" }),
        field("product.madeToMeasure", "Nội dung may đo", {
          group: "Bảo quản, vận chuyển, may đo",
          multiline: true,
          maxLength: LONG,
        }),
        field("product.nameFormat", "Mẫu tên váy cưới", {
          group: "Tên hiển thị",
          maxLength: MEDIUM,
          hint: "Bấm để chèn. Chữ ngoài dấu ngoặc giữ nguyên. Ví dụ: [tên] - [Dáng váy] [Chất liệu] big size wedding dress",
          tooltip:
            "Cách tên váy cưới hiện trên storefront. [tên] là tên nhập ở sản phẩm. Mỗi mục trong ngoặc vuông là giá trị bộ lọc của mẫu đó, theo nhãn nhóm ở trang Danh mục.",
        }),
        field("product.nameFormatAoDai", "Mẫu tên áo dài", {
          group: "Tên hiển thị",
          maxLength: MEDIUM,
          hint: "Bấm để chèn. Chữ ngoài dấu ngoặc giữ nguyên.",
          tooltip:
            "Cách tên áo dài hiện trên storefront. [tên] là tên nhập ở sản phẩm. Mỗi mục trong ngoặc vuông là giá trị bộ lọc của mẫu đó.",
        }),
        field("product.lead", "Đoạn mở đầu váy cưới", {
          group: "Mô tả mẫu",
          multiline: true,
          maxLength: LONG,
          hint: "Có thể dùng {name}, {silhouette}, {neckline}, {fabric}.",
          tooltip:
            "Đoạn văn đầu tiên trên trang chi tiết váy cưới, ngay dưới tên mẫu, giá và hình thức mua, trước bảng thông số. Chỉ hiện khi sản phẩm chưa có mô tả riêng. {name}, {silhouette}, {neckline} và {fabric} được thay bằng tên ngắn, dáng váy, kiểu cổ và chất liệu của mẫu đó.",
        }),
        field("product.leadAoDai", "Đoạn mở đầu áo dài", {
          group: "Mô tả mẫu",
          multiline: true,
          maxLength: LONG,
          hint: "Có thể dùng {name}, {details}.",
          tooltip:
            "Đoạn văn đầu tiên trên trang chi tiết áo dài, ngay dưới tên mẫu, giá và hình thức mua, trước bảng thông số. Chỉ hiện khi sản phẩm chưa có mô tả riêng. {name} được thay bằng tên ngắn; {details} được thay bằng các thông số của mẫu.",
        }),
        field("product.body", "Đoạn mô tả chung", {
          group: "Mô tả mẫu",
          multiline: true,
          maxLength: LONG,
          tooltip:
            "Đoạn văn thứ hai trên trang chi tiết sản phẩm, ngay dưới đoạn mở đầu và trước bảng thông số. Dùng chung cho cả váy cưới và áo dài. Chỉ hiện khi sản phẩm chưa có mô tả riêng.",
        }),
      ],
    },
  ]

  return { defaults, sections }
}

function overlayStored(defaults: Record<string, ContentPair>, copy: CopyMap) {
  const values: Record<string, ContentPair> = { ...defaults }
  const setPair = (key: string, value: unknown) => {
    if (!(key in defaults)) return
    values[key] = displayPair(value, defaults[key])
  }
  const setLines = (key: string, value: unknown) => {
    if (!(key in defaults)) return
    values[key] = displayLines(value, defaults[key])
  }

  const hero = record(copy["home.hero"])
  setPair("home.headline", hero.headline)
  setPair("home.subhead", hero.subhead)
  setPair("home.description", hero.description)
  setPair("home.cta", hero.cta)
  setPair("home.imageAlt", hero.image_alt)

  const about = record(copy["home.about"])
  setPair("home.aboutLabel", about.label)
  setPair("home.aboutHeadline", about.headline)
  setPair("home.aboutBody", about.body)
  const steps = Array.isArray(about.steps) ? about.steps : []
  steps.forEach((step, index) => {
    const item = record(step)
    setPair(`home.aboutStep.${index}.title`, item.title)
    setPair(`home.aboutStep.${index}.body`, item.body)
  })

  setPair("home.collectionTitle", copy["home.collectionTitle"])
  setPair("home.featuredTitle", copy["home.featuredTitle"])
  setPair("home.blogTitle", copy["home.blogTitle"])

  const care = record(copy["product.care"])
  setPair("product.careTitle", care.title)
  setPair("product.care", care.body)
  const shipping = record(copy["product.shipping"])
  setPair("product.shippingTitle", shipping.title)
  setPair("product.shipping", shipping.body)
  const madeToMeasure = record(copy["product.madeToMeasure"])
  setPair("product.madeToMeasureTitle", madeToMeasure.title)
  setPair("product.madeToMeasure", madeToMeasure.body)
  setPair("product.nameFormat", copy["product.nameFormat"])
  setPair("product.nameFormatAoDai", copy["product.nameFormatAoDai"])
  setPair("product.lead", copy["product.lead"])
  setPair("product.body", copy["product.body"])

  const ui = record(copy["site.ui"])
  const footer = record(ui.footer)
  setPair("footer.companyTitle", footer.companyTitle)
  setPair("footer.phoneLabel", footer.phoneLabel)
  setPair("footer.emailLabel", footer.emailLabel)
  setPair("footer.customerService", footer.customerService)
  setLines("footer.customerServiceLinks", mergedFooterServiceLinks(footer))
  setPair("footer.legal", footer.legal)
  setLines("footer.legalLinks", footer.legalLinks)
  setPair("footer.map", footer.map)
  setPair("footer.copy", footer.copy)

  const shippingPolicy = record(copy["shipping.policy"])
  setPair("shipping.title", shippingPolicy.title)
  setPair("shipping.intro", shippingPolicy.intro)
  setPair("shipping.metaDescription", shippingPolicy.metaDescription)

  const termsPage = record(copy["terms.page"])
  setPair("terms.title", termsPage.title)
  setPair("terms.metaDescription", termsPage.metaDescription)
  setPair("terms.body", termsPage.body)

  const privacyPage = record(copy["privacy.page"])
  setPair("privacy.title", privacyPage.title)
  setPair("privacy.metaDescription", privacyPage.metaDescription)
  setPair("privacy.body", privacyPage.body)

  const supportPage = record(copy["support.page"])
  setPair("support.title", supportPage.title)
  setPair("support.metaDescription", supportPage.metaDescription)
  setPair("support.intro", supportPage.intro)
  setPair("support.name", supportPage.name)
  setPair("support.email", supportPage.email)
  setPair("support.message", supportPage.message)
  setPair("support.submit", supportPage.submit)
  setPair("support.sending", supportPage.sending)
  setPair("support.success", supportPage.success)
  setPair("support.error", supportPage.error)
  setPair("support.required", supportPage.required)
  setPair("support.invalidEmail", supportPage.invalidEmail)
  setPair("support.rateLimit", supportPage.rateLimit)

  const home = record(ui.home)
  setPair("home.featuredLoadMore", home.featuredLoadMore)
  setPair("home.featuredShowLess", home.featuredShowLess)
  setPair("home.blogDescription", home.blogDescription)
  setPair("home.blogReadMore", home.blogReadMore)
  setPair("home.blogViewAll", home.blogViewAll)
  setPair("home.blogEmpty", home.blogEmpty)
  setPair("home.blogBack", home.blogBack)

  const nav = record(ui.nav)
  setPair("nav.home", nav.home)
  setPair("nav.collection", nav.collection)
  setPair("nav.bridal", nav.bridal)
  setPair("nav.aodai", nav.aodai)
  setPair("nav.services", nav.services)
  setPair("nav.book", nav.book)
  setPair("nav.bookHint", nav.bookHint)
  setPair("nav.bookSubmit", nav.bookSubmit)
  const top = record(nav.top)
  setPair("nav.top.contact", top.contact)
  setPair("nav.top.reviews", top.reviews)
  setPair("nav.top.shipping", top.shipping)
  setPair("nav.top.faq", top.faq)
  setPair("nav.top.services", top.services)
  const serviceLabels = Array.isArray(nav.serviceItemLabels) ? nav.serviceItemLabels : []
  serviceLabels.forEach((label, index) => {
    setPair(`nav.service.${index}.label`, label)
  })
  const serviceHrefs = Array.isArray(nav.serviceItemHrefs) ? nav.serviceItemHrefs : []
  serviceHrefs.forEach((href, index) => {
    setPair(`nav.service.${index}.href`, href)
  })
  setPair("nav.about", nav.about)

  const aboutPage = record(copy["about.page"])
  setPair("about.metaTitle", aboutPage.metaTitle)
  setPair("about.metaDescription", aboutPage.metaDescription)
  setPair("about.title", aboutPage.title)
  setPair("about.heroAlt", aboutPage.heroAlt)
  setPair("about.eyebrow", aboutPage.eyebrow)
  setPair("about.headline", aboutPage.headline)
  setPair("about.body", aboutPage.body)
  setPair("about.valuesCta", aboutPage.valuesCta)
  setPair("about.statement", aboutPage.statement)
  setPair("about.pillarsImageAlt", aboutPage.pillarsImageAlt)
  setPair("about.journeyTitle", aboutPage.journeyTitle)
  const aboutPillars = Array.isArray(aboutPage.pillars) ? aboutPage.pillars : []
  aboutPillars.forEach((pillar, index) => {
    const item = record(pillar)
    setPair(`about.pillar.${index}.label`, item.label)
    setPair(`about.pillar.${index}.title`, item.title)
    setPair(`about.pillar.${index}.body`, item.body)
  })
  const aboutMilestones = Array.isArray(aboutPage.milestones) ? aboutPage.milestones : null
  const aboutFaq = record(aboutPage.faq)
  setPair("about.faq.eyebrow", aboutFaq.eyebrow)
  setPair("about.faq.title", aboutFaq.title)
  const aboutFaqItems = Array.isArray(aboutFaq.items) ? aboutFaq.items : null

  const booking = record(ui.booking)
  for (const key of [
    "title",
    "subtitle",
    "fullName",
    "phone",
    "email",
    "contactMethod",
    "selectStore",
    "date",
    "message",
    "productInterest",
    "submit",
    "sending",
    "success",
    "error",
  ]) {
    setPair(`booking.${key}`, booking[key])
  }

  const catalog = record(ui.catalogPage)
  for (const key of [
    "filters",
    "clear",
    "results",
    "empty",
    "loadMore",
    "readMore",
    "showLess",
    "otherCollections",
    "sort",
  ]) {
    setPair(`catalog.${key}`, catalog[key])
  }

  const product = record(ui.productPage)
  setPair("product.related", product.related)
  setPair("product.youMayAlsoLike", product.youMayAlsoLike)
  setPair("product.details", product.details)
  setPair("product.book", product.book)
  setPair("product.contact", product.contact)
  setPair("product.leadAoDai", product.leadAoDai)
  setPair("product.purchaseRent", product.purchaseRent)
  setPair("product.purchaseMadeToOrder", product.purchaseMadeToOrder)
  setPair("product.purchaseReady", product.purchaseReady)

  const withAboutLists = (current: Record<string, ContentPair>) => {
    let next = current
    if (aboutMilestones) {
      next = withAboutMilestones(
        next,
        aboutMilestones.slice(0, MAX_ABOUT_MILESTONES).map((milestone, index) => {
          const item = record(milestone)
          const image =
            typeof item.image === "string" && item.image.trim()
              ? item.image.trim()
              : defaults[aboutMilestoneKey(index, "image")]?.vi || DEFAULT_ABOUT_MILESTONE_IMAGE
          return {
            year: displayPair(item.year, defaults[aboutMilestoneKey(index, "year")] ?? { vi: "", en: "" }),
            title: displayPair(item.title, defaults[aboutMilestoneKey(index, "title")] ?? { vi: "", en: "" }),
            body: displayPair(item.body, defaults[aboutMilestoneKey(index, "body")] ?? { vi: "", en: "" }),
            imageAlt: displayPair(
              item.imageAlt,
              defaults[aboutMilestoneKey(index, "imageAlt")] ?? { vi: "", en: "" }
            ),
            image,
          }
        })
      )
    }
    if (aboutFaqItems) {
      next = withAboutFaqItems(
        next,
        aboutFaqItems.slice(0, MAX_ABOUT_FAQ_ITEMS).map((entry, index) => {
          const item = record(entry)
          return {
            question: displayPair(
              item.question,
              defaults[aboutFaqItemKey(index, "question")] ?? { vi: "", en: "" }
            ),
            answer: displayPair(
              item.answer,
              defaults[aboutFaqItemKey(index, "answer")] ?? { vi: "", en: "" }
            ),
          }
        })
      )
    }
    return next
  }

  if (!Object.hasOwn(copy, "shipping.policy")) return withAboutLists(values)

  const storedSections = Array.isArray(shippingPolicy.sections) ? shippingPolicy.sections : []
  return withAboutLists(
    withShippingSections(
      values,
      storedSections.slice(0, MAX_SHIPPING_SECTIONS).map((section) => {
        const item = record(section)
        return {
          title: rawPair(item.title),
          body: rawPair(item.body),
        }
      })
    )
  )
}

export const loadSiteCopyMap = cache(async (): Promise<CopyMap> => {
  const rows = await db.select({ key: siteCopy.key, value: siteCopy.value }).from(siteCopy)
  return Object.fromEntries(rows.map((row) => [row.key, row.value]))
})

export async function getSiteContentForm(): Promise<SiteContentFormData> {
  const { defaults, sections } = contentModel()
  const copy = await loadSiteCopyMap()
  return {
    defaults,
    sections,
    values: overlayStored(defaults, copy),
  }
}

type WritableCopy = {
  products: { contact: string }
  nav: {
    home: string
    collection: string
    bridal: string
    aodai: string
    services: string
    book: string
    bookHint: string
    bookSubmit: string
    top: {
      contact: string
      reviews: string
      shipping: string
      faq: string
      services: string
    }
    about: string
    serviceItems: Array<{ label: string; href: string }>
  }
  booking: Record<
    | "title"
    | "subtitle"
    | "fullName"
    | "phone"
    | "email"
    | "contactMethod"
    | "selectStore"
    | "date"
    | "message"
    | "productInterest"
    | "submit"
    | "sending"
    | "success"
    | "error",
    string
  >
  home: {
    headline: string
    subhead: string
    description: string
    cta: string
    imageAlt: string
    collection: { title: string }
    featured: { title: string; loadMore: string; showLess: string }
    about: {
      label: string
      headline: string
      body: string
      steps: Array<{ number: string; title: string; body: string }>
    }
    blog: {
      title: string
      description: string
      readMore: string
      viewAll: string
      empty: string
      back: string
    }
  }
  catalogPage: Record<
    | "filters"
    | "clear"
    | "results"
    | "empty"
    | "loadMore"
    | "readMore"
    | "showLess"
    | "otherCollections"
    | "sort",
    string
  >
  productPage: {
    related: string
    youMayAlsoLike: string
    details: string
    book: string
    careTitle: string
    care: string
    shippingTitle: string
    shipping: string
    madeToMeasureTitle: string
    madeToMeasure: string
    lead: string
    leadAoDai: string
    body: string
    purchaseOptions: {
      rent: string
      "made-to-order": string
      "ready-to-purchase": string
    }
  }
  footer: {
    company: { title: string; phoneLabel: string; emailLabel: string }
    customerService: string
    customerServiceLinks: string[]
    legal: string
    legalLinks: string[]
    map: string
    copy: string
  }
  shippingPolicy: {
    metaTitle: string
    metaDescription: string
    title: string
    intro: string
    sections: Array<{ title: string; body: string }>
  }
  termsOfUse: {
    metaTitle: string
    metaDescription: string
    title: string
    body: string
  }
  privacyPolicy: {
    metaTitle: string
    metaDescription: string
    title: string
    body: string
  }
  customerSupport: {
    metaTitle: string
    metaDescription: string
    title: string
    intro: string
    name: string
    email: string
    message: string
    submit: string
    sending: string
    success: string
    error: string
    required: string
    invalidEmail: string
    rateLimit: string
  }
  aboutPage: {
    metaTitle: string
    metaDescription: string
    title: string
    heroAlt: string
    eyebrow: string
    headline: string
    body: string
    valuesCta: string
    statement: string
    pillarsImageAlt: string
    journeyTitle: string
    pillars: Array<{ label: string; title: string; body: string }>
    milestones: Array<{
      year: string
      title: string
      body: string
      image: string
      imageAlt: string
    }>
    faq: {
      eyebrow: string
      title: string
      items: Array<{ question: string; answer: string }>
    }
  }
}

export function applySiteContent<T extends Dictionary>(
  dict: T,
  locale: Locale,
  copy: CopyMap
): T {
  const next = structuredClone(dict) as unknown as WritableCopy
  const ui = record(copy["site.ui"])

  const hero = record(copy["home.hero"])
  next.home.headline = localizedText(hero.headline, locale, dict.home.headline)
  next.home.subhead = localizedText(hero.subhead, locale, dict.home.subhead)
  next.home.description = localizedText(hero.description, locale, dict.home.description)
  next.home.cta = localizedText(hero.cta, locale, dict.home.cta)
  next.home.imageAlt = localizedText(hero.image_alt, locale, dict.home.imageAlt)
  next.home.collection.title = localizedText(
    copy["home.collectionTitle"],
    locale,
    dict.home.collection.title
  )
  next.home.featured.title = localizedText(
    copy["home.featuredTitle"],
    locale,
    dict.home.featured.title
  )
  next.home.blog.title = localizedText(copy["home.blogTitle"], locale, dict.home.blog.title)

  const about = record(copy["home.about"])
  const aboutSteps = Array.isArray(about.steps) ? about.steps : []
  next.home.about.label = localizedText(about.label, locale, dict.home.about.label)
  next.home.about.headline = localizedText(about.headline, locale, dict.home.about.headline)
  next.home.about.body = localizedText(about.body, locale, dict.home.about.body)
  next.home.about.steps = dict.home.about.steps.map((step, index) => {
    const item = record(aboutSteps[index])
    return {
      number: typeof item.number === "string" && item.number.trim() ? item.number : step.number,
      title: localizedText(item.title, locale, step.title),
      body: localizedText(item.body, locale, step.body),
    }
  })

  const homeUi = record(ui.home)
  next.home.featured.loadMore = localizedText(
    homeUi.featuredLoadMore,
    locale,
    dict.home.featured.loadMore
  )
  next.home.featured.showLess = localizedText(
    homeUi.featuredShowLess,
    locale,
    dict.home.featured.showLess
  )
  next.home.blog.description = localizedText(
    homeUi.blogDescription,
    locale,
    dict.home.blog.description
  )
  next.home.blog.readMore = localizedText(homeUi.blogReadMore, locale, dict.home.blog.readMore)
  next.home.blog.viewAll = localizedText(homeUi.blogViewAll, locale, dict.home.blog.viewAll)
  next.home.blog.empty = localizedText(homeUi.blogEmpty, locale, dict.home.blog.empty)
  next.home.blog.back = localizedText(homeUi.blogBack, locale, dict.home.blog.back)

  const footer = record(ui.footer)
  next.footer.company.title = localizedText(
    footer.companyTitle,
    locale,
    dict.footer.company.title
  )
  next.footer.company.phoneLabel = localizedText(
    footer.phoneLabel,
    locale,
    dict.footer.company.phoneLabel
  )
  next.footer.company.emailLabel = localizedText(
    footer.emailLabel,
    locale,
    dict.footer.company.emailLabel
  )
  next.footer.customerService = localizedText(
    footer.customerService,
    locale,
    dict.footer.customerService
  )
  next.footer.customerServiceLinks = footerServiceLinks(
    footer,
    locale,
    [...dict.footer.customerServiceLinks]
  )
  next.footer.legal = localizedText(footer.legal, locale, dict.footer.legal)
  next.footer.legalLinks = localizedLines(footer.legalLinks, locale, [...dict.footer.legalLinks])
  next.footer.map = localizedText(footer.map, locale, dict.footer.map)
  next.footer.copy = localizedText(footer.copy, locale, dict.footer.copy)

  const shippingPolicy = record(copy["shipping.policy"])
  const shippingSections = Array.isArray(shippingPolicy.sections) ? shippingPolicy.sections : []
  next.shippingPolicy.title = localizedText(
    shippingPolicy.title,
    locale,
    dict.shippingPolicy.title
  )
  next.shippingPolicy.metaTitle = next.shippingPolicy.title
  next.shippingPolicy.metaDescription = localizedText(
    shippingPolicy.metaDescription,
    locale,
    dict.shippingPolicy.metaDescription
  )
  next.shippingPolicy.intro = localizedText(
    shippingPolicy.intro,
    locale,
    dict.shippingPolicy.intro
  )
  if (Object.hasOwn(copy, "shipping.policy")) {
    next.shippingPolicy.sections = shippingSections.flatMap((section) => {
      const item = record(section)
      const title = localizedText(item.title, locale, "")
      const body = localizedText(item.body, locale, "")
      return title || body ? [{ title, body }] : []
    })
  }

  const termsPage = record(copy["terms.page"])
  next.termsOfUse.title = localizedText(termsPage.title, locale, dict.termsOfUse.title)
  next.termsOfUse.metaTitle = next.termsOfUse.title
  next.termsOfUse.metaDescription = localizedText(
    termsPage.metaDescription,
    locale,
    dict.termsOfUse.metaDescription
  )
  next.termsOfUse.body = localizedText(termsPage.body, locale, dict.termsOfUse.body)

  const privacyPage = record(copy["privacy.page"])
  next.privacyPolicy.title = localizedText(
    privacyPage.title,
    locale,
    dict.privacyPolicy.title
  )
  next.privacyPolicy.metaTitle = next.privacyPolicy.title
  next.privacyPolicy.metaDescription = localizedText(
    privacyPage.metaDescription,
    locale,
    dict.privacyPolicy.metaDescription
  )
  next.privacyPolicy.body = localizedText(
    privacyPage.body,
    locale,
    dict.privacyPolicy.body
  )

  const supportPage = record(copy["support.page"])
  const supportKeys = [
    "metaDescription",
    "title",
    "intro",
    "name",
    "email",
    "message",
    "submit",
    "sending",
    "success",
    "error",
    "required",
    "invalidEmail",
    "rateLimit",
  ] as const
  for (const key of supportKeys) {
    next.customerSupport[key] = localizedText(
      supportPage[key],
      locale,
      dict.customerSupport[key]
    )
  }
  next.customerSupport.metaTitle = next.customerSupport.title

  const nav = record(ui.nav)
  next.nav.home = localizedText(nav.home, locale, dict.nav.home)
  next.nav.collection = localizedText(nav.collection, locale, dict.nav.collection)
  next.nav.bridal = localizedText(nav.bridal, locale, dict.nav.bridal)
  next.nav.aodai = localizedText(nav.aodai, locale, dict.nav.aodai)
  next.nav.services = localizedText(nav.services, locale, dict.nav.services)
  next.nav.book = localizedText(nav.book, locale, dict.nav.book)
  next.nav.bookHint = localizedText(nav.bookHint, locale, dict.nav.bookHint)
  next.nav.bookSubmit = localizedText(nav.bookSubmit, locale, dict.nav.bookSubmit)
  const top = record(nav.top)
  next.nav.top.contact = localizedText(top.contact, locale, dict.nav.top.contact)
  next.nav.top.reviews = localizedText(top.reviews, locale, dict.nav.top.reviews)
  next.nav.top.shipping = localizedText(top.shipping, locale, dict.nav.top.shipping)
  next.nav.top.faq = localizedText(top.faq, locale, dict.nav.top.faq)
  next.nav.top.services = localizedText(top.services, locale, dict.nav.top.services)
  const serviceLabels = Array.isArray(nav.serviceItemLabels) ? nav.serviceItemLabels : []
  const serviceHrefs = Array.isArray(nav.serviceItemHrefs) ? nav.serviceItemHrefs : []
  next.nav.serviceItems = dict.nav.serviceItems.map((item, index) => ({
    href: serviceMenuHref(serviceHrefs[index], item.href),
    label: localizedText(serviceLabels[index], locale, item.label),
  }))
  next.nav.about = localizedText(nav.about, locale, dict.nav.about)

  const aboutPage = record(copy["about.page"])
  next.aboutPage.metaTitle = localizedText(
    aboutPage.metaTitle,
    locale,
    dict.aboutPage.metaTitle
  )
  next.aboutPage.metaDescription = localizedText(
    aboutPage.metaDescription,
    locale,
    dict.aboutPage.metaDescription
  )
  next.aboutPage.title = localizedText(aboutPage.title, locale, dict.aboutPage.title)
  next.aboutPage.heroAlt = localizedText(aboutPage.heroAlt, locale, dict.aboutPage.heroAlt)
  next.aboutPage.eyebrow = localizedText(aboutPage.eyebrow, locale, dict.aboutPage.eyebrow)
  next.aboutPage.headline = localizedText(aboutPage.headline, locale, dict.aboutPage.headline)
  next.aboutPage.body = localizedText(aboutPage.body, locale, dict.aboutPage.body)
  next.aboutPage.valuesCta = localizedText(
    aboutPage.valuesCta,
    locale,
    dict.aboutPage.valuesCta
  )
  next.aboutPage.statement = localizedText(
    aboutPage.statement,
    locale,
    dict.aboutPage.statement
  )
  next.aboutPage.pillarsImageAlt = localizedText(
    aboutPage.pillarsImageAlt,
    locale,
    dict.aboutPage.pillarsImageAlt
  )
  next.aboutPage.journeyTitle = localizedText(
    aboutPage.journeyTitle,
    locale,
    dict.aboutPage.journeyTitle
  )
  const aboutPillars = Array.isArray(aboutPage.pillars) ? aboutPage.pillars : []
  next.aboutPage.pillars = dict.aboutPage.pillars.map((pillar, index) => {
    const item = record(aboutPillars[index])
    return {
      label: localizedText(item.label, locale, pillar.label),
      title: localizedText(item.title, locale, pillar.title),
      body: localizedText(item.body, locale, pillar.body),
    }
  })
  const aboutMilestones = Array.isArray(aboutPage.milestones) ? aboutPage.milestones : null
  if (aboutMilestones) {
    next.aboutPage.milestones = aboutMilestones.slice(0, MAX_ABOUT_MILESTONES).map((milestone, index) => {
      const item = record(milestone)
      const fallback = dict.aboutPage.milestones[index]
      return {
        year: localizedText(item.year, locale, fallback?.year ?? ""),
        title: localizedText(item.title, locale, fallback?.title ?? ""),
        body: localizedText(item.body, locale, fallback?.body ?? ""),
        imageAlt: localizedText(item.imageAlt, locale, fallback?.imageAlt ?? ""),
        image: allowedMilestoneImage(
          typeof item.image === "string" ? item.image : fallback?.image,
          index
        ),
      }
    })
  }
  const aboutFaq = record(aboutPage.faq)
  const aboutFaqItems = Array.isArray(aboutFaq.items) ? aboutFaq.items : null
  next.aboutPage.faq.eyebrow = localizedText(
    aboutFaq.eyebrow,
    locale,
    dict.aboutPage.faq.eyebrow
  )
  next.aboutPage.faq.title = localizedText(aboutFaq.title, locale, dict.aboutPage.faq.title)
  if (aboutFaqItems) {
    next.aboutPage.faq.items = aboutFaqItems.slice(0, MAX_ABOUT_FAQ_ITEMS).map((entry, index) => {
      const item = record(entry)
      const fallback = dict.aboutPage.faq.items[index]
      return {
        question: localizedText(item.question, locale, fallback?.question ?? ""),
        answer: localizedText(item.answer, locale, fallback?.answer ?? ""),
      }
    })
  }

  const booking = record(ui.booking)
  const bookingKeys = [
    "title",
    "subtitle",
    "fullName",
    "phone",
    "email",
    "contactMethod",
    "selectStore",
    "date",
    "message",
    "productInterest",
    "submit",
    "sending",
    "success",
    "error",
  ] as const
  for (const key of bookingKeys) {
    next.booking[key] = localizedText(booking[key], locale, dict.booking[key])
  }

  const catalog = record(ui.catalogPage)
  const catalogKeys = [
    "filters",
    "clear",
    "results",
    "empty",
    "loadMore",
    "readMore",
    "showLess",
    "otherCollections",
    "sort",
  ] as const
  for (const key of catalogKeys) {
    next.catalogPage[key] = localizedText(catalog[key], locale, dict.catalogPage[key])
  }

  const product = record(ui.productPage)
  next.productPage.related = localizedText(product.related, locale, dict.productPage.related)
  next.productPage.youMayAlsoLike = localizedText(
    product.youMayAlsoLike,
    locale,
    dict.productPage.youMayAlsoLike
  )
  next.productPage.details = localizedText(product.details, locale, dict.productPage.details)
  next.productPage.book = localizedText(product.book, locale, dict.productPage.book)
  next.productPage.leadAoDai = localizedText(
    product.leadAoDai,
    locale,
    dict.productPage.leadAoDai
  )
  next.productPage.purchaseOptions.rent = localizedText(
    product.purchaseRent,
    locale,
    dict.productPage.purchaseOptions.rent
  )
  next.productPage.purchaseOptions["made-to-order"] = localizedText(
    product.purchaseMadeToOrder,
    locale,
    dict.productPage.purchaseOptions["made-to-order"]
  )
  next.productPage.purchaseOptions["ready-to-purchase"] = localizedText(
    product.purchaseReady,
    locale,
    dict.productPage.purchaseOptions["ready-to-purchase"]
  )
  next.products.contact = localizedText(product.contact, locale, dict.products.contact)

  const care = record(copy["product.care"])
  next.productPage.careTitle = localizedText(care.title, locale, dict.productPage.careTitle)
  next.productPage.care = localizedText(care.body, locale, dict.productPage.care)
  const shipping = record(copy["product.shipping"])
  next.productPage.shippingTitle = localizedText(
    shipping.title,
    locale,
    dict.productPage.shippingTitle
  )
  next.productPage.shipping = localizedText(shipping.body, locale, dict.productPage.shipping)
  const madeToMeasure = record(copy["product.madeToMeasure"])
  next.productPage.madeToMeasureTitle = localizedText(
    madeToMeasure.title,
    locale,
    dict.productPage.madeToMeasureTitle
  )
  next.productPage.madeToMeasure = localizedText(
    madeToMeasure.body,
    locale,
    dict.productPage.madeToMeasure
  )
  next.productPage.lead = localizedText(copy["product.lead"], locale, dict.productPage.lead)
  next.productPage.body = localizedText(copy["product.body"], locale, dict.productPage.body)

  return next as T
}

export async function applyStoredSiteContent<T extends Dictionary>(dict: T, locale: Locale) {
  const copy = await loadSiteCopyMap()
  return applySiteContent(dict, locale, copy)
}

function cleanContent(
  input: Record<string, ContentPair>,
  sections: ContentSection[]
): { ok: true; data: CleanedContent } | { ok: false; error: string } {
  const pairs: Record<string, ContentPair> = {}
  const lines: Record<string, { vi: string[]; en: string[] }> = {}

  for (const section of sections) {
    for (const item of section.fields) {
      const raw = input[item.key]
      if (!raw || typeof raw.vi !== "string" || typeof raw.en !== "string") {
        return { ok: false, error: "Dữ liệu form không đầy đủ. Tải lại trang và thử lại." }
      }

      if (item.lines) {
        const parse = (value: string) =>
          value
            .split("\n")
            .map((line) => sanitizePlainText(line))
            .filter(Boolean)
        const vi = parse(raw.vi)
        const en = parse(raw.en)
        if (vi.length > MAX_LINES || en.length > MAX_LINES) {
          return {
            ok: false,
            error: `${item.label} chỉ được tối đa ${MAX_LINES} dòng.`,
          }
        }
        const tooLong = [...vi, ...en].find((line) => line.length > item.maxLength)
        if (tooLong) {
          return {
            ok: false,
            error: `Mỗi dòng của “${item.label}” tối đa ${item.maxLength} ký tự.`,
          }
        }
        lines[item.key] = { vi, en }
        continue
      }

      if (item.rich) {
        const vi = sanitizeRichTextHtml(raw.vi)
        const en = sanitizeRichTextHtml(raw.en)
        if (vi.length > item.maxLength || en.length > item.maxLength) {
          return {
            ok: false,
            error: `“${item.label}” tối đa ${item.maxLength} ký tự.`,
          }
        }
        pairs[item.key] = { vi, en }
        continue
      }

      const vi = sanitizePlainText(raw.vi)
      const en = sanitizePlainText(raw.en)
      if (vi.length > item.maxLength || en.length > item.maxLength) {
        return {
          ok: false,
          error: `“${item.label}” tối đa ${item.maxLength} ký tự.`,
        }
      }
      pairs[item.key] = { vi, en }
    }
  }

  return { ok: true, data: { pairs, lines } }
}

function rawPair(value: unknown): ContentPair {
  const data = record(value)
  return {
    vi: typeof data.vi === "string" ? data.vi : "",
    en: typeof data.en === "string" ? data.en : "",
  }
}

function cleanShippingPair(
  raw: ContentPair | undefined,
  label: string,
  maxLength: number
): { ok: true; pair: ContentPair } | { ok: false; error: string } {
  const vi = sanitizePlainText(raw?.vi ?? "")
  const en = sanitizePlainText(raw?.en ?? "")
  if (vi.length > maxLength || en.length > maxLength) {
    return { ok: false, error: `Mỗi ${label} của mục tối đa ${maxLength} ký tự.` }
  }
  return { ok: true, pair: { vi, en } }
}

const SHIPPING_SECTION_KEY = /^shipping\.section\.(\d+)\.(title|body)$/

function readShippingSections(
  input: Record<string, ContentPair>
): { ok: true; sections: Array<{ title: ContentPair; body: ContentPair }> } | { ok: false; error: string } {
  const byIndex = new Map<number, { title?: ContentPair; body?: ContentPair }>()

  for (const [key, raw] of Object.entries(input)) {
    const match = SHIPPING_SECTION_KEY.exec(key)
    if (!match) continue
    const index = Number(match[1])
    if (!Number.isInteger(index) || index < 0 || index >= MAX_SHIPPING_SECTIONS) {
      return { ok: false, error: `Chỉ được tối đa ${MAX_SHIPPING_SECTIONS} mục.` }
    }
    if (!raw || typeof raw.vi !== "string" || typeof raw.en !== "string") {
      return { ok: false, error: "Dữ liệu form không đầy đủ. Tải lại trang và thử lại." }
    }
    const slot = byIndex.get(index) ?? {}
    slot[match[2] as "title" | "body"] = raw
    byIndex.set(index, slot)
  }

  if (byIndex.size > MAX_SHIPPING_SECTIONS) {
    return { ok: false, error: `Chỉ được tối đa ${MAX_SHIPPING_SECTIONS} mục.` }
  }

  const sections: Array<{ title: ContentPair; body: ContentPair }> = []
  for (const index of [...byIndex.keys()].sort((left, right) => left - right)) {
    const slot = byIndex.get(index)
    const title = cleanShippingPair(slot?.title, "tiêu đề", SHIPPING_SECTION_TITLE_MAX)
    if (!title.ok) return title
    const body = cleanShippingPair(slot?.body, "nội dung", SHIPPING_SECTION_BODY_MAX)
    if (!body.ok) return body
    sections.push({ title: title.pair, body: body.pair })
  }

  return { ok: true, sections }
}

const MILESTONE_KEY = /^about\.milestone\.(\d+)\.(year|title|body|imageAlt|image)$/
const FAQ_ITEM_KEY = /^about\.faq\.(\d+)\.(question|answer)$/

const milestoneImages = new Set([
  ...viDict.aboutPage.milestones.map((item) => item.image),
  ...enDict.aboutPage.milestones.map((item) => item.image),
  DEFAULT_ABOUT_MILESTONE_IMAGE,
])

function allowedMilestoneImage(image: string | undefined, index: number) {
  const value = image?.trim() ?? ""
  if (milestoneImages.has(value)) return value
  const key = parseCmsStorageKey(value)
  if (key?.startsWith("about/")) return getImageUrl(key)
  return viDict.aboutPage.milestones[index]?.image ?? DEFAULT_ABOUT_MILESTONE_IMAGE
}

function readAboutMilestones(input: Record<string, ContentPair>) {
  const byIndex = new Map<
    number,
    { year?: ContentPair; title?: ContentPair; body?: ContentPair; imageAlt?: ContentPair; image?: ContentPair }
  >()

  for (const [key, raw] of Object.entries(input)) {
    const match = MILESTONE_KEY.exec(key)
    if (!match) continue
    const index = Number(match[1])
    if (!Number.isInteger(index) || index < 0 || index >= MAX_ABOUT_MILESTONES) {
      return { ok: false as const, error: `Chỉ được tối đa ${MAX_ABOUT_MILESTONES} mốc năm.` }
    }
    if (!raw || typeof raw.vi !== "string" || typeof raw.en !== "string") {
      return { ok: false as const, error: "Dữ liệu form không đầy đủ. Tải lại trang và thử lại." }
    }
    const slot = byIndex.get(index) ?? {}
    slot[match[2] as "year" | "title" | "body" | "imageAlt" | "image"] = raw
    byIndex.set(index, slot)
  }

  if (byIndex.size > MAX_ABOUT_MILESTONES) {
    return { ok: false as const, error: `Chỉ được tối đa ${MAX_ABOUT_MILESTONES} mốc năm.` }
  }

  const milestones: Array<{
    year: ContentPair
    title: ContentPair
    body: ContentPair
    imageAlt: ContentPair
    image: string
  }> = []

  for (const index of [...byIndex.keys()].sort((left, right) => left - right)) {
    const slot = byIndex.get(index)
    const year = cleanShippingPair(slot?.year, "năm", ABOUT_MILESTONE_YEAR_MAX)
    if (!year.ok) return year
    const title = cleanShippingPair(slot?.title, "tiêu đề mốc", ABOUT_MILESTONE_TITLE_MAX)
    if (!title.ok) return title
    const body = cleanShippingPair(slot?.body, "nội dung mốc", ABOUT_MILESTONE_BODY_MAX)
    if (!body.ok) return body
    const imageAlt = cleanShippingPair(slot?.imageAlt, "mô tả ảnh", ABOUT_MILESTONE_ALT_MAX)
    if (!imageAlt.ok) return imageAlt
    milestones.push({
      year: year.pair,
      title: title.pair,
      body: body.pair,
      imageAlt: imageAlt.pair,
      image: allowedMilestoneImage(slot?.image?.vi || slot?.image?.en, index),
    })
  }

  return { ok: true as const, milestones }
}

function readAboutFaqItems(input: Record<string, ContentPair>) {
  const byIndex = new Map<number, { question?: ContentPair; answer?: ContentPair }>()

  for (const [key, raw] of Object.entries(input)) {
    const match = FAQ_ITEM_KEY.exec(key)
    if (!match) continue
    const index = Number(match[1])
    if (!Number.isInteger(index) || index < 0 || index >= MAX_ABOUT_FAQ_ITEMS) {
      return { ok: false as const, error: `Chỉ được tối đa ${MAX_ABOUT_FAQ_ITEMS} câu hỏi.` }
    }
    if (!raw || typeof raw.vi !== "string" || typeof raw.en !== "string") {
      return { ok: false as const, error: "Dữ liệu form không đầy đủ. Tải lại trang và thử lại." }
    }
    const slot = byIndex.get(index) ?? {}
    slot[match[2] as "question" | "answer"] = raw
    byIndex.set(index, slot)
  }

  if (byIndex.size > MAX_ABOUT_FAQ_ITEMS) {
    return { ok: false as const, error: `Chỉ được tối đa ${MAX_ABOUT_FAQ_ITEMS} câu hỏi.` }
  }

  const items: Array<{ question: ContentPair; answer: ContentPair }> = []
  for (const index of [...byIndex.keys()].sort((left, right) => left - right)) {
    const slot = byIndex.get(index)
    const question = cleanShippingPair(slot?.question, "câu hỏi", ABOUT_FAQ_QUESTION_MAX)
    if (!question.ok) return question
    const answer = cleanShippingPair(slot?.answer, "câu trả lời", ABOUT_FAQ_ANSWER_MAX)
    if (!answer.ok) return answer
    items.push({ question: question.pair, answer: answer.pair })
  }

  return { ok: true as const, items }
}

function pairAt(data: CleanedContent, key: string): ContentPair {
  return data.pairs[key] ?? { vi: "", en: "" }
}

function linesAt(data: CleanedContent, key: string) {
  return data.lines[key] ?? { vi: [], en: [] }
}

async function upsertCopy(key: string, value: unknown) {
  await db
    .insert(siteCopy)
    .values({ key, value })
    .onDuplicateKeyUpdate({ set: { value } })
}

export async function writeSiteContent(
  input: Record<string, ContentPair>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { sections } = contentModel()
  const cleaned = cleanContent(input, sections)
  if (!cleaned.ok) return cleaned
  const shippingSectionsResult = readShippingSections(input)
  if (!shippingSectionsResult.ok) return shippingSectionsResult
  const aboutMilestonesResult = readAboutMilestones(input)
  if (!aboutMilestonesResult.ok) return aboutMilestonesResult
  const aboutFaqItemsResult = readAboutFaqItems(input)
  if (!aboutFaqItemsResult.ok) return aboutFaqItemsResult

  const data = cleaned.data
  const current = await loadSiteCopyMap()
  const hero = record(current["home.hero"])
  const imageUrl =
    typeof hero.image_url === "string" && hero.image_url.trim()
      ? hero.image_url
      : hero.image_url && typeof hero.image_url === "object"
        ? hero.image_url
        : "/hero/bridal.webp"

  const shippingSections = shippingSectionsResult.sections
  const aboutMilestones = aboutMilestonesResult.milestones
  const aboutFaqItems = aboutFaqItemsResult.items
  const aboutSteps = viDict.home.about.steps.map((step, index) => ({
    number: step.number,
    title: pairAt(data, `home.aboutStep.${index}.title`),
    body: pairAt(data, `home.aboutStep.${index}.body`),
  }))
  const aboutPillars = viDict.aboutPage.pillars.map((_, index) => ({
    label: pairAt(data, `about.pillar.${index}.label`),
    title: pairAt(data, `about.pillar.${index}.title`),
    body: pairAt(data, `about.pillar.${index}.body`),
  }))

  const storedNav = record(record(current["site.ui"]).nav)
  const storedTop = record(storedNav.top)

  const entries: Array<{ key: string; value: unknown }> = [
    {
      key: "home.hero",
      value: {
        headline: pairAt(data, "home.headline"),
        subhead: pairAt(data, "home.subhead"),
        description: pairAt(data, "home.description"),
        cta: pairAt(data, "home.cta"),
        image_alt: pairAt(data, "home.imageAlt"),
        image_url: imageUrl,
      },
    },
    {
      key: "home.about",
      value: {
        label: pairAt(data, "home.aboutLabel"),
        headline: pairAt(data, "home.aboutHeadline"),
        body: pairAt(data, "home.aboutBody"),
        steps: aboutSteps,
      },
    },
    { key: "home.collectionTitle", value: pairAt(data, "home.collectionTitle") },
    { key: "home.featuredTitle", value: pairAt(data, "home.featuredTitle") },
    { key: "home.blogTitle", value: pairAt(data, "home.blogTitle") },
    {
      key: "about.page",
      value: {
        metaTitle: pairAt(data, "about.metaTitle"),
        metaDescription: pairAt(data, "about.metaDescription"),
        title: pairAt(data, "about.title"),
        heroAlt: pairAt(data, "about.heroAlt"),
        eyebrow: pairAt(data, "about.eyebrow"),
        headline: pairAt(data, "about.headline"),
        body: pairAt(data, "about.body"),
        valuesCta: pairAt(data, "about.valuesCta"),
        statement: pairAt(data, "about.statement"),
        pillarsImageAlt: pairAt(data, "about.pillarsImageAlt"),
        pillars: aboutPillars,
        journeyTitle: pairAt(data, "about.journeyTitle"),
        milestones: aboutMilestones,
        faq: {
          eyebrow: pairAt(data, "about.faq.eyebrow"),
          title: pairAt(data, "about.faq.title"),
          items: aboutFaqItems,
        },
      },
    },
    {
      key: "product.care",
      value: {
        title: pairAt(data, "product.careTitle"),
        body: pairAt(data, "product.care"),
      },
    },
    {
      key: "product.shipping",
      value: {
        title: pairAt(data, "product.shippingTitle"),
        body: pairAt(data, "product.shipping"),
      },
    },
    {
      key: "product.madeToMeasure",
      value: {
        title: pairAt(data, "product.madeToMeasureTitle"),
        body: pairAt(data, "product.madeToMeasure"),
      },
    },
    { key: "product.nameFormat", value: pairAt(data, "product.nameFormat") },
    { key: "product.nameFormatAoDai", value: pairAt(data, "product.nameFormatAoDai") },
    { key: "product.lead", value: pairAt(data, "product.lead") },
    { key: "product.body", value: pairAt(data, "product.body") },
    {
      key: "shipping.policy",
      value: {
        title: pairAt(data, "shipping.title"),
        intro: pairAt(data, "shipping.intro"),
        metaDescription: pairAt(data, "shipping.metaDescription"),
        sections: shippingSections,
      },
    },
    {
      key: "terms.page",
      value: {
        title: pairAt(data, "terms.title"),
        metaDescription: pairAt(data, "terms.metaDescription"),
        body: pairAt(data, "terms.body"),
      },
    },
    {
      key: "privacy.page",
      value: {
        title: pairAt(data, "privacy.title"),
        metaDescription: pairAt(data, "privacy.metaDescription"),
        body: pairAt(data, "privacy.body"),
      },
    },
    {
      key: "support.page",
      value: {
        title: pairAt(data, "support.title"),
        metaDescription: pairAt(data, "support.metaDescription"),
        intro: pairAt(data, "support.intro"),
        name: pairAt(data, "support.name"),
        email: pairAt(data, "support.email"),
        message: pairAt(data, "support.message"),
        submit: pairAt(data, "support.submit"),
        sending: pairAt(data, "support.sending"),
        success: pairAt(data, "support.success"),
        error: pairAt(data, "support.error"),
        required: pairAt(data, "support.required"),
        invalidEmail: pairAt(data, "support.invalidEmail"),
        rateLimit: pairAt(data, "support.rateLimit"),
      },
    },
    {
      key: "site.ui",
      value: {
        footer: record(record(current["site.ui"]).footer),
        home: {
          featuredLoadMore: pairAt(data, "home.featuredLoadMore"),
          featuredShowLess: pairAt(data, "home.featuredShowLess"),
          blogDescription: pairAt(data, "home.blogDescription"),
          blogReadMore: pairAt(data, "home.blogReadMore"),
          blogViewAll: pairAt(data, "home.blogViewAll"),
          blogEmpty: pairAt(data, "home.blogEmpty"),
          blogBack: pairAt(data, "home.blogBack"),
        },
        nav: {
          ...storedNav,
          top: {
            contact: rawPair(storedTop.contact),
            reviews: rawPair(storedTop.reviews),
            shipping: rawPair(storedTop.shipping),
            faq: rawPair(storedTop.faq),
            services: rawPair(storedTop.services),
          },
          serviceItemLabels: viDict.nav.serviceItems.map((_, index) =>
            pairAt(data, `nav.service.${index}.label`)
          ),
          serviceItemHrefs: viDict.nav.serviceItems.map((_, index) =>
            pairAt(data, `nav.service.${index}.href`)
          ),
        },
        booking: {
          title: pairAt(data, "booking.title"),
          subtitle: pairAt(data, "booking.subtitle"),
          fullName: pairAt(data, "booking.fullName"),
          phone: pairAt(data, "booking.phone"),
          email: pairAt(data, "booking.email"),
          contactMethod: pairAt(data, "booking.contactMethod"),
          selectStore: pairAt(data, "booking.selectStore"),
          date: pairAt(data, "booking.date"),
          message: pairAt(data, "booking.message"),
          productInterest: pairAt(data, "booking.productInterest"),
          submit: pairAt(data, "booking.submit"),
          sending: pairAt(data, "booking.sending"),
          success: pairAt(data, "booking.success"),
          error: pairAt(data, "booking.error"),
        },
        catalogPage: {
          filters: pairAt(data, "catalog.filters"),
          clear: pairAt(data, "catalog.clear"),
          results: pairAt(data, "catalog.results"),
          empty: pairAt(data, "catalog.empty"),
          loadMore: pairAt(data, "catalog.loadMore"),
          readMore: pairAt(data, "catalog.readMore"),
          showLess: pairAt(data, "catalog.showLess"),
          otherCollections: pairAt(data, "catalog.otherCollections"),
          sort: pairAt(data, "catalog.sort"),
        },
        productPage: {
          related: pairAt(data, "product.related"),
          youMayAlsoLike: pairAt(data, "product.youMayAlsoLike"),
          details: pairAt(data, "product.details"),
          book: pairAt(data, "product.book"),
          contact: pairAt(data, "product.contact"),
          leadAoDai: pairAt(data, "product.leadAoDai"),
          purchaseRent: pairAt(data, "product.purchaseRent"),
          purchaseMadeToOrder: pairAt(data, "product.purchaseMadeToOrder"),
          purchaseReady: pairAt(data, "product.purchaseReady"),
        },
      },
    },
  ]

  for (const entry of entries) {
    await upsertCopy(entry.key, entry.value)
  }

  return { ok: true }
}
