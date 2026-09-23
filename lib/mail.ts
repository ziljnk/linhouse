import "server-only"

import { createTransport, type Transporter } from "nodemailer"
import {
  buildAppointmentEmail,
  type AppointmentMailInput,
} from "@/lib/appointment-email"
import {
  buildSupportEmail,
  type SupportMailInput,
} from "@/lib/support-email"

export type { AppointmentMailInput, SupportMailInput }

type SmtpConfig = {
  host: string
  port: number
  secure: boolean
  user?: string
  pass?: string
  from: string
}

const globalForMail = globalThis as unknown as {
  smtpTransporter?: Transporter
  smtpTransporterVersion?: number
}

const SMTP_TRANSPORTER_VERSION = 2

function smtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim()
  if (!host) return null

  const port = Number.parseInt(process.env.SMTP_PORT ?? "587", 10)
  const secure =
    process.env.SMTP_SECURE === "true" ||
    process.env.SMTP_SECURE === "1" ||
    port === 465
  const user = process.env.SMTP_USER?.trim()
  const from = process.env.SMTP_FROM?.trim() || user

  if (!from) return null

  return {
    host,
    port: Number.isFinite(port) ? port : 587,
    secure,
    user,
    pass: process.env.SMTP_PASS,
    from,
  }
}

function getTransporter() {
  if (
    globalForMail.smtpTransporter &&
    globalForMail.smtpTransporterVersion === SMTP_TRANSPORTER_VERSION
  ) {
    return globalForMail.smtpTransporter
  }

  const config = smtpConfig()
  if (!config) return null

  const transporter = createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    auth: config.user
      ? { user: config.user, pass: config.pass ?? "" }
      : undefined,
  })

  globalForMail.smtpTransporter = transporter
  globalForMail.smtpTransporterVersion = SMTP_TRANSPORTER_VERSION
  return transporter
}

function headerSafe(value: string) {
  return value.replace(/[\u0000-\u001F\u007F]/g, "").trim()
}

async function deliverMail(input: {
  to: string | string[]
  replyTo: string
  subject: string
  text: string
  html: string
  logLabel: string
}) {
  const config = smtpConfig()
  const transporter = getTransporter()

  if (!config || !transporter) {
    console.error(`SMTP is not configured; skipped ${input.logLabel}`)
    return false
  }

  const recipients = (Array.isArray(input.to) ? input.to : [input.to])
    .map((email) => email.trim())
    .filter(Boolean)

  if (recipients.length === 0) return false

  try {
    await transporter.sendMail({
      from: config.from,
      to: recipients,
      replyTo: headerSafe(input.replyTo),
      subject: input.subject,
      text: input.text,
      html: input.html,
    })
    return true
  } catch (error) {
    console.error(`Failed to send ${input.logLabel}`, error)
    return false
  }
}

export async function sendAppointmentNotification(input: {
  to: string | string[]
  appointment: AppointmentMailInput
}): Promise<boolean> {
  const { subject, text, html } = buildAppointmentEmail(input.appointment)
  return deliverMail({
    to: input.to,
    replyTo: input.appointment.email,
    subject,
    text,
    html,
    logLabel: "appointment email",
  })
}

export async function sendSupportNotification(input: {
  to: string | string[]
  message: SupportMailInput
}): Promise<boolean> {
  const { subject, text, html } = buildSupportEmail(input.message)
  return deliverMail({
    to: input.to,
    replyTo: input.message.email,
    subject,
    text,
    html,
    logLabel: "support email",
  })
}
