"use server"

import { actionOk, revalidateAdmin } from "@/lib/admin-actions"
import { requireUsableAdminSession } from "@/lib/admin-session"
import { validateSiteSettings, type SiteSettings } from "@/lib/site-settings"
import { writeSiteSettings } from "@/lib/site-settings-store"

export async function saveSiteSettingsAction(input: SiteSettings) {
  await requireUsableAdminSession()

  const result = validateSiteSettings(input)
  if (!result.ok) return result

  await writeSiteSettings(result.data)
  await revalidateAdmin()

  return actionOk()
}
