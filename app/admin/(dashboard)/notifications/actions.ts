"use server"

import { actionOk, revalidateAdmin } from "@/lib/admin-actions"
import { recordAudit } from "@/lib/admin-audit"
import { diffFields } from "@/lib/admin-audit-shared"
import { requireUsableAdminSession } from "@/lib/admin-session"
import { validateNotificationEmails } from "@/lib/site-settings"
import { getSiteSettings, writeSiteSettings } from "@/lib/site-settings-store"

export async function saveNotificationEmailsAction(emails: string[]) {
  const session = await requireUsableAdminSession()

  const result = validateNotificationEmails(emails)
  if (!result.ok) return result

  const current = await getSiteSettings()
  await writeSiteSettings({
    ...current,
    notifications: { emails: result.data },
  })
  await recordAudit(session, {
    action: "update",
    area: "notifications",
    entityLabel: "Email nhận thông báo",
    summary: "Cập nhật email nhận thông báo",
    changes: diffFields([
      {
        label: "Email nhận thông báo",
        before: current.notifications.emails.join(", "),
        after: result.data.join(", "),
      },
    ]),
  })
  await revalidateAdmin()

  return actionOk()
}
