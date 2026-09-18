import "server-only"

import { cache } from "react"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { siteSettings } from "@/lib/db/schema"
import {
  DEFAULT_SITE_SETTINGS,
  normalizeSiteSettings,
  type SiteSettings,
} from "@/lib/site-settings"

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const [row] = await db
      .select({ data: siteSettings.data })
      .from(siteSettings)
      .where(eq(siteSettings.id, "default"))
      .limit(1)

    if (!row) return DEFAULT_SITE_SETTINGS
    return normalizeSiteSettings(row.data)
  } catch {
    return DEFAULT_SITE_SETTINGS
  }
})

export async function writeSiteSettings(settings: SiteSettings) {
  await db
    .insert(siteSettings)
    .values({
      id: "default",
      data: settings,
    })
    .onDuplicateKeyUpdate({
      set: { data: settings },
    })
}
