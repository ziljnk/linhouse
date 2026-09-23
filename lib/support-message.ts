import "server-only"

import { createHash } from "node:crypto"
import { headers } from "next/headers"
import { getDictionary, hasLocale, type Locale } from "@/app/[locale]/dictionaries"
import { actionFail, actionOk, type ActionResult } from "@/lib/admin-actions"
import { sendSupportNotification } from "@/lib/mail"
import { sanitizePlainText } from "@/lib/sanitize-content"
import { bookingNotificationEmails, isValidEmail } from "@/lib/site-settings"
import { getSiteSettings } from "@/lib/site-settings-store"

const RATE_WINDOW_MS = 10 * 60 * 1000
const RATE_MAX = 5

const recentSubmits = new Map<string, number[]>()

type SupportError = "required" | "invalidEmail" | "rateLimit" | "error"

async function errorFor(locale: Locale, key: SupportError) {
  const dict = await getDictionary(locale)
  return actionFail(dict.customerSupport[key])
}

function readField(formData: FormData, name: string) {
  const value = formData.get(name)
  return typeof value === "string" ? value.trim() : ""
}

function clientIp(requestHeaders: Headers) {
  return (
    requestHeaders.get("cf-connecting-ip") ||
    requestHeaders.get("x-real-ip") ||
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    ""
  )
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

  const secret = process.env.BETTER_AUTH_SECRET ?? "linhouse-support"
  const key = createHash("sha256")
    .update(`${secret}:support:${ip || "unknown"}`)
    .digest("hex")
    .slice(0, 24)
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

export async function submitSupportMessage(
  formData: FormData
): Promise<ActionResult> {
  const localeRaw = readField(formData, "locale")
  const locale: Locale = hasLocale(localeRaw) ? localeRaw : "vi"

  if (readField(formData, "website")) return actionOk()

  const name = sanitizePlainText(readField(formData, "name")).slice(0, 120)
  const email = readField(formData, "email").slice(0, 254)
  const message = sanitizePlainText(readField(formData, "message")).slice(0, 2000)

  if (name.length < 2 || !email || message.length < 2) {
    return errorFor(locale, "required")
  }

  if (!isValidEmail(email)) return errorFor(locale, "invalidEmail")

  const requestHeaders = await headers()
  if (!allowSubmit(clientIp(requestHeaders))) {
    return errorFor(locale, "rateLimit")
  }

  try {
    const settings = await getSiteSettings()
    const to = bookingNotificationEmails(settings)
    if (to.length === 0) return errorFor(locale, "error")

    const sent = await sendSupportNotification({
      to,
      message: { name, email, message },
    })

    return sent ? actionOk() : errorFor(locale, "error")
  } catch (error) {
    console.error("Failed to send support message", error)
    return errorFor(locale, "error")
  }
}
