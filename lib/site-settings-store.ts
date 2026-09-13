import "server-only"

import { cache } from "react"
import { promises as fs } from "node:fs"
import path from "node:path"
import {
  DEFAULT_SITE_SETTINGS,
  normalizeSiteSettings,
  type SiteSettings,
} from "@/lib/site-settings"

const SETTINGS_PATH = path.join(process.cwd(), "data", "site-settings.json")

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, "utf8")
    return normalizeSiteSettings(JSON.parse(raw) as unknown)
  } catch {
    return DEFAULT_SITE_SETTINGS
  }
})

export async function writeSiteSettings(settings: SiteSettings) {
  await fs.mkdir(path.dirname(SETTINGS_PATH), { recursive: true })
  await fs.writeFile(
    SETTINGS_PATH,
    `${JSON.stringify(settings, null, 2)}\n`,
    "utf8"
  )
}
