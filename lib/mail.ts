import "server-only"

import { createTransport, type Transporter } from "nodemailer"
import {
  buildAppointmentEmail,
  type AppointmentMailInput,
} from "@/lib/appointment-email"

export type { AppointmentMailInput }

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
}

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
  if (globalForMail.smtpTransporter) return globalForMail.smtpTransporter

  const config = smtpConfig()
  if (!config) return null

  const transporter = createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user
      ? { user: config.user, pass: config.pass ?? "" }
      : undefined,
  })

  globalForMail.smtpTransporter = transporter
  return transporter
}

export async function sendAppointmentNotification(input: {
  to: string | string[]
  appointment: AppointmentMailInput
}): Promise<boolean> {
  const config = smtpConfig()
  const transporter = getTransporter()

  if (!config || !transporter) {
    console.error("SMTP is not configured; skipped appointment email")
    return false
  }

  const recipients = (Array.isArray(input.to) ? input.to : [input.to])
    .map((email) => email.trim())
    .filter(Boolean)

  if (recipients.length === 0) {
    return false
  }

  try {
    const { subject, text, html } = buildAppointmentEmail(input.appointment)
    await transporter.sendMail({
      from: config.from,
      to: recipients,
      replyTo: input.appointment.email.replace(/[\u0000-\u001F\u007F]/g, ""),
      subject,
      text,
      html,
    })
    return true
  } catch (error) {
    console.error("Failed to send appointment email", error)
    return false
  }
}
