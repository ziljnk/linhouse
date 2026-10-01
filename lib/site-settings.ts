import { sanitizePlainText } from "@/lib/sanitize-content"
import { sanitizeExternalUrl } from "@/lib/sanitize-url"

export type LocaleCode = "vi" | "en"

export type LocalizedText = Record<LocaleCode, string>

export type BookingContactMethod = {
  id: string
  label: LocalizedText
}

export type BusinessFooterVisibility = {
  legalName: boolean
  taxCode: boolean
  representative: boolean
  licenseNumber: boolean
  workingHours: boolean
}

export type AddressFooterVisibility = {
  store: boolean
  company: boolean
  map: boolean
}

export const FLOAT_ICON_IDS = [
  "gmail",
  "zalo",
  "instagram",
  "facebook",
  "whatsapp",
] as const

export type FloatIconId = (typeof FLOAT_ICON_IDS)[number]

export type FloatTooltips = Record<FloatIconId, LocalizedText>

export const DEFAULT_FLOAT_TOOLTIPS: FloatTooltips = {
  gmail: { vi: "Gmail", en: "Gmail" },
  zalo: { vi: "Zalo", en: "Zalo" },
  instagram: { vi: "Instagram", en: "Instagram" },
  facebook: { vi: "Facebook", en: "Facebook" },
  whatsapp: { vi: "WhatsApp", en: "WhatsApp" },
}

export type SiteSettings = {
  contact: {
    hotline: string
    email: string
    zalo: string
  }
  notifications: {
    emails: string[]
  }
  contactMethods: BookingContactMethod[]
  address: {
    vi: string
    en: string
    company: LocalizedText
    mapQuery: string
    footerVisible: AddressFooterVisibility
  }
  business: {
    brandName: string
    legalName: string
    taxCode: string
    representative: string
    licenseNumber: string
    workingHours: LocalizedText
    footerVisible: BusinessFooterVisibility
  }
  social: {
    facebookUrl: string
    instagramUrl: string
    floatOrder: FloatIconId[]
    tooltips: FloatTooltips
  }
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  contact: {
    hotline: "0902 678 114",
    email: "info@linhouse.com.vn",
    zalo: "0902678114",
  },
  notifications: {
    emails: [],
  },
  contactMethods: [
    { id: "phone", label: { vi: "Điện thoại", en: "Phone" } },
    { id: "zalo", label: { vi: "Zalo", en: "Zalo" } },
    { id: "whatsapp", label: { vi: "WhatsApp", en: "WhatsApp" } },
    { id: "sms", label: { vi: "Tin nhắn SMS", en: "SMS" } },
  ],
  address: {
    vi: "45 Nguyễn Trọng Tuyển, Phường 15, Phú Nhuận, Tp. Hồ Chí Minh",
    en: "45 Nguyen Trong Tuyen, Ward 15, Phu Nhuan, Ho Chi Minh City",
    company: {
      vi: "",
      en: "",
    },
    mapQuery: "45 Nguyễn Trọng Tuyển, Phường 15, Phú Nhuận, Hồ Chí Minh",
    footerVisible: {
      store: true,
      company: true,
      map: true,
    },
  },
  business: {
    brandName: "LINHouse",
    legalName: "",
    taxCode: "",
    representative: "",
    licenseNumber: "",
    workingHours: {
      vi: "",
      en: "",
    },
    footerVisible: {
      legalName: true,
      taxCode: true,
      representative: true,
      licenseNumber: true,
      workingHours: true,
    },
  },
  social: {
    facebookUrl: "https://www.facebook.com/linhousebigsize",
    instagramUrl: "https://www.instagram.com/linhouse.bridal",
    floatOrder: ["gmail", "zalo", "instagram", "facebook", "whatsapp"],
    tooltips: DEFAULT_FLOAT_TOOLTIPS,
  },
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback
}

function asAddressFooterVisibility(value: unknown): AddressFooterVisibility {
  const record = asRecord(value)
  const defaults = DEFAULT_SITE_SETTINGS.address.footerVisible
  return {
    store: asBoolean(record.store, defaults.store),
    company: asBoolean(record.company, defaults.company),
    map: asBoolean(record.map, defaults.map),
  }
}

function asFooterVisibility(value: unknown): BusinessFooterVisibility {
  const record = asRecord(value)
  const defaults = DEFAULT_SITE_SETTINGS.business.footerVisible
  return {
    legalName: asBoolean(record.legalName, defaults.legalName),
    taxCode: asBoolean(record.taxCode, defaults.taxCode),
    representative: asBoolean(record.representative, defaults.representative),
    licenseNumber: asBoolean(record.licenseNumber, defaults.licenseNumber),
    workingHours: asBoolean(record.workingHours, defaults.workingHours),
  }
}

function asEmailList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string")
  }
  if (typeof value === "string" && value.trim()) {
    return value.split(/[,;]+/).map((item) => item.trim()).filter(Boolean)
  }
  return []
}

function asLocalizedText(
  value: unknown,
  fallback: LocalizedText
): LocalizedText {
  const record = asRecord(value)
  return {
    vi: asString(record.vi, fallback.vi),
    en: asString(record.en, fallback.en),
  }
}

export const MAX_CONTACT_METHODS = 20

function slugifyContactMethodId(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("đ", "d")
    .replaceAll("Đ", "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
}

function uniqueContactMethodId(base: string, used: Set<string>) {
  const fallback = base || "method"
  if (!used.has(fallback)) return fallback
  let index = 2
  while (used.has(`${fallback}-${index}`)) index += 1
  return `${fallback}-${index}`
}

function isFloatIconId(value: string): value is FloatIconId {
  return (FLOAT_ICON_IDS as readonly string[]).includes(value)
}

function asFloatTooltips(value: unknown): FloatTooltips {
  const record = asRecord(value)
  return {
    gmail: asLocalizedText(record.gmail, DEFAULT_FLOAT_TOOLTIPS.gmail),
    zalo: asLocalizedText(record.zalo, DEFAULT_FLOAT_TOOLTIPS.zalo),
    instagram: asLocalizedText(
      record.instagram,
      DEFAULT_FLOAT_TOOLTIPS.instagram
    ),
    facebook: asLocalizedText(record.facebook, DEFAULT_FLOAT_TOOLTIPS.facebook),
    whatsapp: asLocalizedText(record.whatsapp, DEFAULT_FLOAT_TOOLTIPS.whatsapp),
  }
}

function sanitizeFloatTooltips(value: unknown): FloatTooltips {
  const tooltips = asFloatTooltips(value)
  return {
    gmail: { vi: trim(tooltips.gmail.vi), en: trim(tooltips.gmail.en) },
    zalo: { vi: trim(tooltips.zalo.vi), en: trim(tooltips.zalo.en) },
    instagram: {
      vi: trim(tooltips.instagram.vi),
      en: trim(tooltips.instagram.en),
    },
    facebook: {
      vi: trim(tooltips.facebook.vi),
      en: trim(tooltips.facebook.en),
    },
    whatsapp: {
      vi: trim(tooltips.whatsapp.vi),
      en: trim(tooltips.whatsapp.en),
    },
  }
}

function asFloatOrder(value: unknown): FloatIconId[] {
  const defaults = DEFAULT_SITE_SETTINGS.social.floatOrder
  if (!Array.isArray(value)) return [...defaults]

  const seen = new Set<FloatIconId>()
  const order: FloatIconId[] = []

  for (const item of value) {
    if (typeof item !== "string" || !isFloatIconId(item) || seen.has(item)) {
      continue
    }
    seen.add(item)
    order.push(item)
  }

  for (const id of defaults) {
    if (!seen.has(id)) order.push(id)
  }

  return order
}

function asContactMethods(value: unknown): BookingContactMethod[] {
  if (!Array.isArray(value)) return DEFAULT_SITE_SETTINGS.contactMethods

  const used = new Set<string>()
  const methods: BookingContactMethod[] = []

  for (const item of value) {
    const record = asRecord(item)
    const label = asLocalizedText(record.label, { vi: "", en: "" })
    const rawId = asString(record.id) || label.vi || label.en
    const baseId = slugifyContactMethodId(rawId)
    if (!baseId || (!label.vi && !label.en)) continue

    const id = uniqueContactMethodId(baseId, used)
    used.add(id)
    methods.push({
      id,
      label: {
        vi: label.vi || label.en,
        en: label.en || label.vi,
      },
    })
    if (methods.length >= MAX_CONTACT_METHODS) break
  }

  return methods
}

export function normalizeSiteSettings(value: unknown): SiteSettings {
  const root = asRecord(value)
  const contact = asRecord(root.contact)
  const notifications = asRecord(root.notifications)
  const address = asRecord(root.address)
  const business = asRecord(root.business)
  const social = asRecord(root.social)
  const defaults = DEFAULT_SITE_SETTINGS
  const emails = asEmailList(notifications.emails)
  const legacyEmails = asEmailList(
    contact.notificationEmails ?? contact.notificationEmail
  )

  return {
    contact: {
      hotline: asString(contact.hotline, defaults.contact.hotline),
      email: asString(contact.email, defaults.contact.email),
      zalo: asString(contact.zalo, defaults.contact.zalo),
    },
    notifications: {
      emails: emails.length > 0 ? emails : legacyEmails,
    },
    contactMethods: asContactMethods(root.contactMethods),
    address: {
      vi: asString(address.vi, defaults.address.vi),
      en: asString(address.en, defaults.address.en),
      company: asLocalizedText(address.company, defaults.address.company),
      mapQuery: asString(address.mapQuery, defaults.address.mapQuery),
      footerVisible: asAddressFooterVisibility(address.footerVisible),
    },
    business: {
      brandName: asString(business.brandName, defaults.business.brandName),
      legalName: asString(business.legalName, defaults.business.legalName),
      taxCode: asString(business.taxCode, defaults.business.taxCode),
      representative: asString(
        business.representative,
        defaults.business.representative
      ),
      licenseNumber: asString(
        business.licenseNumber,
        defaults.business.licenseNumber
      ),
      workingHours: asLocalizedText(
        business.workingHours,
        defaults.business.workingHours
      ),
      footerVisible: asFooterVisibility(business.footerVisible),
    },
    social: {
      facebookUrl: asString(social.facebookUrl, defaults.social.facebookUrl),
      instagramUrl: asString(social.instagramUrl, defaults.social.instagramUrl),
      floatOrder: asFloatOrder(social.floatOrder),
      tooltips: asFloatTooltips(social.tooltips),
    },
  }
}

function trim(value: string) {
  return sanitizePlainText(value)
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type SiteSettingsResult =
  | { ok: true; data: SiteSettings }
  | { ok: false; error: string }

export function sanitizeSiteSettings(input: SiteSettings): SiteSettings {
  const hotline = trim(input.contact.hotline)
  const addressVi = trim(input.address.vi)
  const zaloInput = trim(input.contact.zalo)
  const zalo = zaloInput
    ? zaloInput.startsWith("http://") || zaloInput.startsWith("https://")
      ? (sanitizeExternalUrl(zaloInput) ?? "")
      : zaloInput
    : hotline.replaceAll(" ", "")
  const mapQuery = trim(input.address.mapQuery) || addressVi

  return {
    contact: {
      hotline,
      email: trim(input.contact.email),
      zalo,
    },
    notifications: {
      emails: sanitizeNotificationEmails(input.notifications?.emails ?? []),
    },
    contactMethods: asContactMethods(input.contactMethods),
    address: {
      vi: addressVi,
      en: trim(input.address.en),
      company: {
        vi: trim(input.address.company?.vi ?? ""),
        en: trim(input.address.company?.en ?? ""),
      },
      mapQuery,
      footerVisible: asAddressFooterVisibility(input.address.footerVisible),
    },
    business: {
      brandName: trim(input.business.brandName),
      legalName: trim(input.business.legalName),
      taxCode: trim(input.business.taxCode),
      representative: trim(input.business.representative),
      licenseNumber: trim(input.business.licenseNumber),
      workingHours: {
        vi: trim(input.business.workingHours.vi),
        en: trim(input.business.workingHours.en),
      },
      footerVisible: asFooterVisibility(input.business.footerVisible),
    },
    social: {
      facebookUrl: sanitizeExternalUrl(input.social.facebookUrl) ?? "",
      instagramUrl: sanitizeExternalUrl(input.social.instagramUrl) ?? "",
      floatOrder: asFloatOrder(input.social.floatOrder),
      tooltips: sanitizeFloatTooltips(input.social.tooltips),
    },
  }
}

export function validateSiteSettings(input: SiteSettings): SiteSettingsResult {
  const data = sanitizeSiteSettings(input)

  if (!data.business.brandName) {
    return { ok: false, error: "Vui lòng nhập tên thương hiệu." }
  }

  if (!data.contact.hotline) {
    return { ok: false, error: "Vui lòng nhập số hotline." }
  }

  if (!data.contact.email) {
    return { ok: false, error: "Vui lòng nhập email." }
  }

  if (!EMAIL_PATTERN.test(data.contact.email)) {
    return { ok: false, error: "Email không hợp lệ." }
  }

  if (!data.address.vi) {
    return { ok: false, error: "Vui lòng nhập địa chỉ cửa hàng tiếng Việt." }
  }

  if (
    trim(input.contact.zalo).startsWith("http") &&
    !isHttpUrl(data.contact.zalo)
  ) {
    return { ok: false, error: "Link Zalo không hợp lệ." }
  }

  if (data.social.facebookUrl && !isHttpUrl(data.social.facebookUrl)) {
    return { ok: false, error: "Link Facebook không hợp lệ." }
  }

  if (data.social.instagramUrl && !isHttpUrl(data.social.instagramUrl)) {
    return { ok: false, error: "Link Instagram không hợp lệ." }
  }

  return { ok: true, data }
}

export function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value)
}

export const MAX_NOTIFICATION_EMAILS = 20

export type NotificationEmailsResult =
  | { ok: true; data: string[] }
  | { ok: false; error: string }

export function sanitizeNotificationEmails(emails: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const raw of emails) {
    const email = trim(raw)
    if (!email) continue
    const key = email.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(email)
  }

  return result
}

export function validateNotificationEmails(
  emails: string[]
): NotificationEmailsResult {
  const data = sanitizeNotificationEmails(emails)

  if (data.length > MAX_NOTIFICATION_EMAILS) {
    return {
      ok: false,
      error: `Tối đa ${MAX_NOTIFICATION_EMAILS} email nhận thông báo.`,
    }
  }

  for (const email of data) {
    if (!EMAIL_PATTERN.test(email)) {
      return { ok: false, error: `Email không hợp lệ: ${email}` }
    }
  }

  return { ok: true, data }
}

export function bookingContactMethods(
  settings: SiteSettings,
  locale: LocaleCode
) {
  return settings.contactMethods
    .map((method) => ({
      id: method.id,
      label: localizedValue(method.label, locale),
    }))
    .filter((method) => method.label)
}

export function bookingContactMethodLabel(
  settings: SiteSettings,
  id: string
) {
  const method = settings.contactMethods.find((item) => item.id === id)
  if (!method) return ""
  return method.label.vi || method.label.en
}

export function bookingNotificationEmails(settings: SiteSettings) {
  if (settings.notifications.emails.length > 0) {
    return settings.notifications.emails
  }
  return settings.contact.email ? [settings.contact.email] : []
}

export function localizedValue(
  value: LocalizedText,
  locale: LocaleCode
): string {
  return value[locale] || value.vi
}

export function googleMapsUrls(query: string) {
  const encoded = encodeURIComponent(query)
  return {
    href: `https://www.google.com/maps?q=${encoded}`,
    embedSrc: `https://maps.google.com/maps?q=${encoded}&z=16&output=embed`,
  }
}

export function floatIconLabel(
  settings: SiteSettings,
  id: FloatIconId,
  locale: LocaleCode,
  fallback: string
) {
  const text = settings.social.tooltips?.[id]
  if (!text) return fallback
  return localizedValue(text, locale).trim() || fallback
}

export function whatsappHref(phone: string) {
  const digits = phone.replace(/\D/g, "")
  if (!digits) return ""
  const international = digits.startsWith("0") ? `84${digits.slice(1)}` : digits
  return `https://wa.me/${international}`
}

export function zaloHref(zalo: string, hotline: string) {
  const value = (zalo || hotline).trim()
  if (!value) return ""
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return sanitizeExternalUrl(value) ?? ""
  }
  const phone = value.replaceAll(" ", "")
  if (!phone) return ""
  return `https://zalo.me/${phone}`
}
