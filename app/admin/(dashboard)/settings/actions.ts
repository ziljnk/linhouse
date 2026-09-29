"use server"

import { actionOk, revalidateAdmin } from "@/lib/admin-actions"
import { requireUsableAdminSession } from "@/lib/admin-session"
import { validateSiteSettings, type SiteSettings } from "@/lib/site-settings"
import { getSiteSettings, writeSiteSettings } from "@/lib/site-settings-store"

export async function saveSiteSettingsAction(input: SiteSettings) {
  await requireUsableAdminSession()

  const result = validateSiteSettings(input)
  if (!result.ok) return result

  const current = await getSiteSettings()
  await writeSiteSettings({
    ...result.data,
    notifications: current.notifications,
  })
  await revalidateAdmin(["/"])

  return actionOk()
}
