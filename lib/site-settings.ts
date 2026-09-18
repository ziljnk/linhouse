import { sanitizePlainText } from "@/lib/sanitize-content"
import { sanitizeExternalUrl } from "@/lib/sanitize-url"

export type LocaleCode = "vi" | "en"

export type LocalizedText = Record<LocaleCode, string>

export type SiteSettings = {
  contact: {
    hotline: string
    email: string
    notificationEmail: string
    zalo: string
  }
  address: {
    vi: string
    en: string
    mapQuery: string
  }
  business: {
    brandName: string
    legalName: string
    taxCode: string
    representative: string
    licenseNumber: string
    workingHours: LocalizedText
  }
  social: {
    facebookUrl: string
    instagramUrl: string
  }
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  contact: {
    hotline: "0902 678 114",
    email: "info@linhouse.com.vn",
    notificationEmail: "",
    zalo: "0902678114",
  },
  address: {
    vi: "45 Nguyễn Trọng Tuyển, Phường 15, Phú Nhuận, Tp. Hồ Chí Minh",
    en: "45 Nguyen Trong Tuyen, Ward 15, Phu Nhuan, Ho Chi Minh City",
    mapQuery: "45 Nguyễn Trọng Tuyển, Phường 15, Phú Nhuận, Hồ Chí Minh",
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
  },
  social: {
    facebookUrl: "https://www.facebook.com/linhousebigsize",
    instagramUrl: "https://www.instagram.com/linhouse.bridal",
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

export function normalizeSiteSettings(value: unknown): SiteSettings {
  const root = asRecord(value)
  const contact = asRecord(root.contact)
  const address = asRecord(root.address)
  const business = asRecord(root.business)
  const social = asRecord(root.social)
  const defaults = DEFAULT_SITE_SETTINGS

  return {
    contact: {
      hotline: asString(contact.hotline, defaults.contact.hotline),
      email: asString(contact.email, defaults.contact.email),
      notificationEmail: asString(
        contact.notificationEmail,
        defaults.contact.notificationEmail
      ),
      zalo: asString(contact.zalo, defaults.contact.zalo),
    },
    address: {
      vi: asString(address.vi, defaults.address.vi),
      en: asString(address.en, defaults.address.en),
      mapQuery: asString(address.mapQuery, defaults.address.mapQuery),
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
    },
    social: {
      facebookUrl: asString(social.facebookUrl, defaults.social.facebookUrl),
      instagramUrl: asString(social.instagramUrl, defaults.social.instagramUrl),
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
      notificationEmail: trim(input.contact.notificationEmail),
      zalo,
    },
    address: {
      vi: addressVi,
      en: trim(input.address.en),
      mapQuery,
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
    },
    social: {
      facebookUrl: sanitizeExternalUrl(input.social.facebookUrl) ?? "",
      instagramUrl: sanitizeExternalUrl(input.social.instagramUrl) ?? "",
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

  if (
    data.contact.notificationEmail &&
    !EMAIL_PATTERN.test(data.contact.notificationEmail)
  ) {
    return { ok: false, error: "Email nhận thông báo đặt lịch không hợp lệ." }
  }

  if (!data.address.vi) {
    return { ok: false, error: "Vui lòng nhập địa chỉ tiếng Việt." }
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

export function bookingNotificationEmail(settings: SiteSettings) {
  return settings.contact.notificationEmail || settings.contact.email
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
