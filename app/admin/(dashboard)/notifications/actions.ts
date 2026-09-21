"use server"

import { actionOk, revalidateAdmin } from "@/lib/admin-actions"
import { requireUsableAdminSession } from "@/lib/admin-session"
import { validateNotificationEmails } from "@/lib/site-settings"
import { getSiteSettings, writeSiteSettings } from "@/lib/site-settings-store"

export async function saveNotificationEmailsAction(emails: string[]) {
  await requireUsableAdminSession()

  const result = validateNotificationEmails(emails)
  if (!result.ok) return result

  const current = await getSiteSettings()
  await writeSiteSettings({
    ...current,
    notifications: { emails: result.data },
  })
  await revalidateAdmin()

  return actionOk()
}
