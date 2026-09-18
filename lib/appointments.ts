import "server-only"

import { createHash } from "node:crypto"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { hasLocale, type Locale } from "@/app/[locale]/dictionaries"
import { actionFail, actionOk, type ActionResult } from "@/lib/admin-actions"
import { db } from "@/lib/db"
import { appointment } from "@/lib/db/schema"
import { sendAppointmentNotification } from "@/lib/mail"
import { sanitizePlainText } from "@/lib/sanitize-content"
import {
  bookingNotificationEmail,
  isValidEmail,
  type SiteSettings,
} from "@/lib/site-settings"
import { getSiteSettings } from "@/lib/site-settings-store"

const RATE_WINDOW_MS = 10 * 60 * 1000
const RATE_MAX = 5
const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g

const recentSubmits = new Map<string, number[]>()

const ERRORS = {
  vi: {
    required: "Vui lòng điền đầy đủ thông tin.",
    email: "Email không hợp lệ.",
    phone: "Số điện thoại không hợp lệ.",
    store: "Cửa hàng không hợp lệ.",
    date: "Ngày giờ hẹn không hợp lệ.",
    past: "Vui lòng chọn thời gian từ hiện tại trở đi.",
    rate: "Bạn đã gửi quá nhiều. Vui lòng thử lại sau.",
    failed: "Không gửi được. Vui lòng thử lại.",
  },
  en: {
    required: "Please fill in all required fields.",
    email: "Please enter a valid email.",
    phone: "Please enter a valid phone number.",
    store: "Please choose a valid store.",
    date: "Please choose a valid appointment date and time.",
    past: "Please choose a time from now onward.",
    rate: "Too many requests. Please try again later.",
    failed: "Could not send your request. Please try again.",
  },
} as const

type BookingError = keyof typeof ERRORS.vi

export type AppointmentInput = {
  name: string
  phone: string
  email: string
  store: string
  preferredDate: string
  preferredTime: string
  message: string
  locale: Locale
}

function errorFor(locale: Locale, key: BookingError) {
  return actionFail(ERRORS[locale][key])
}

function clientIp(requestHeaders: Headers) {
  return (
    requestHeaders.get("cf-connecting-ip") ||
    requestHeaders.get("x-real-ip") ||
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    ""
  )
}

function rateLimitKey(ip: string) {
  const secret = process.env.BETTER_AUTH_SECRET ?? "linhouse-booking"
  return createHash("sha256")
    .update(`${secret}:appointment:${ip || "unknown"}`)
    .digest("hex")
    .slice(0, 24)
}

function allowSubmit(ip: string) {
  const now = Date.now()
  if (recentSubmits.size > 5_000) {
    for (const [key, stamps] of recentSubmits) {
      const fresh = stamps.filter((stamp) => now - stamp < RATE_WINDOW_MS)
      if (fresh.length === 0) recentSubmits.delete(key)
      else recentSubmits.set(key, fresh)
    }
  }

  const key = rateLimitKey(ip)
  const stamps = (recentSubmits.get(key) ?? []).filter(
    (stamp) => now - stamp < RATE_WINDOW_MS
  )
  if (stamps.length >= RATE_MAX) {
    recentSubmits.set(key, stamps)
    return false
  }

  stamps.push(now)
  recentSubmits.set(key, stamps)
  return true
}

function nowInVietnam() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date())
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  )

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

function splitDateTime(value: string) {
  const [date, time] = value.split("T")
  return {
    date: date ?? "",
    time: (time ?? "").slice(0, 5),
  }
}

function readField(formData: FormData, key: string) {
  const value = formData.get(key)
  if (typeof value !== "string") return ""
  return sanitizePlainText(value).replace(CONTROL_CHARS, "").trim()
}

function isValidPhone(value: string) {
  const compact = value.replace(/[^\d+]/g, "")
  if (!compact) return false
  if (compact.startsWith("+")) return /^\+[1-9]\d{7,14}$/.test(compact)
  if (/^84\d{9,10}$/.test(compact)) return true
  return /^0\d{9,10}$/.test(compact)
}

function allowedStoreAddresses(settings: SiteSettings) {
  return [
    ...new Set(
      [settings.address.vi, settings.address.en]
        .map((value) => sanitizePlainText(value).replace(CONTROL_CHARS, "").trim())
        .filter(Boolean)
    ),
  ]
}

function resolveStore(
  submitted: string,
  locale: Locale,
  settings: SiteSettings
) {
  const allowed = allowedStoreAddresses(settings)
  if (allowed.length === 0) return submitted

  if (submitted && !allowed.includes(submitted)) return null

  const localized = locale === "en" ? settings.address.en : settings.address.vi
  const canonical = sanitizePlainText(localized).replace(CONTROL_CHARS, "").trim()
  return canonical || allowed[0] || null
}

function parseAppointmentForm(
  formData: FormData
): { ok: true; data: AppointmentInput } | { ok: false; locale: Locale; error: BookingError } {
  const localeRaw = readField(formData, "locale")
  const locale: Locale = hasLocale(localeRaw) ? localeRaw : "vi"
  const storeValue = readField(formData, "store")
  const storeAddress = readField(formData, "storeAddress")
  const store =
    storeAddress || (storeValue && storeValue !== "main" ? storeValue : "")

  const dateTime = readField(formData, "datetime") || readField(formData, "date")
  const { date, time } = splitDateTime(dateTime)

  const data: AppointmentInput = {
    name: readField(formData, "name").slice(0, 120),
    phone: readField(formData, "phone").slice(0, 40),
    email: readField(formData, "email").slice(0, 254),
    store: store.slice(0, 300),
    preferredDate: date,
    preferredTime: time,
    message: readField(formData, "message").slice(0, 2000),
    locale,
  }

  if (
    data.name.length < 2 ||
    !data.phone ||
    !data.email ||
    !data.preferredDate ||
    !data.preferredTime
  ) {
    return { ok: false, locale, error: "required" }
  }

  if (!isValidPhone(data.phone)) {
    return { ok: false, locale, error: "phone" }
  }

  if (!isValidEmail(data.email)) {
    return { ok: false, locale, error: "email" }
  }

  if (!DATE_TIME_PATTERN.test(`${data.preferredDate}T${data.preferredTime}`)) {
    return { ok: false, locale, error: "date" }
  }

  if (`${data.preferredDate}T${data.preferredTime}` < nowInVietnam()) {
    return { ok: false, locale, error: "past" }
  }

  return { ok: true, data }
}

export async function submitAppointment(
  formData: FormData
): Promise<ActionResult> {
  const parsed = parseAppointmentForm(formData)
  if (!parsed.ok) return errorFor(parsed.locale, parsed.error)

  const requestHeaders = await headers()
  if (!allowSubmit(clientIp(requestHeaders))) {
    return errorFor(parsed.data.locale, "rate")
  }

  try {
    const settings = await getSiteSettings()
    const store = resolveStore(
      parsed.data.store,
      parsed.data.locale,
      settings
    )
    if (!store) {
      return errorFor(
        parsed.data.locale,
        parsed.data.store ? "store" : "required"
      )
    }

    return createAppointment({ ...parsed.data, store }, settings)
  } catch (error) {
    console.error("Failed to create appointment", error)
    return errorFor(parsed.data.locale, "failed")
  }
}

async function createAppointment(
  input: AppointmentInput,
  settings: SiteSettings
): Promise<ActionResult> {
  try {
    const rows = await db
      .insert(appointment)
      .values({
        name: input.name,
        phone: input.phone,
        email: input.email,
        store: input.store,
        preferredDate: input.preferredDate,
        preferredTime: input.preferredTime,
        message: input.message,
        locale: input.locale,
      })
      .$returningId()
    const row = rows[0]

    if (!row) return errorFor(input.locale, "failed")

    const to = bookingNotificationEmail(settings)
    const sent = to
      ? await sendAppointmentNotification({
          to,
          appointment: input,
        })
      : false

    if (sent) {
      await db
        .update(appointment)
        .set({ emailSentAt: new Date() })
        .where(eq(appointment.id, row.id))
    }

    return actionOk()
  } catch (error) {
    console.error("Failed to create appointment", error)
    return errorFor(input.locale, "failed")
  }
}
