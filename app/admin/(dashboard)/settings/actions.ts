"use server"

import { revalidatePath } from "next/cache"
import { validateSiteSettings, type SiteSettings } from "@/lib/site-settings"
import { writeSiteSettings } from "@/lib/site-settings-store"

export async function saveSiteSettingsAction(input: SiteSettings) {
  const result = validateSiteSettings(input)
  if (!result.ok) return result

  await writeSiteSettings(result.data)

  revalidatePath("/vi", "layout")
  revalidatePath("/en", "layout")
  revalidatePath("/admin/settings")

  return { ok: true as const }
}
