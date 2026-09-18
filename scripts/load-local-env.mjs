import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }
  return value
}

export function loadLocalEnv() {
  for (const filename of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), filename)
    if (!existsSync(path)) continue

    for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line || line.startsWith("#")) continue

      const withoutExport = line.startsWith("export ")
        ? line.slice("export ".length).trim()
        : line
      const eq = withoutExport.indexOf("=")
      if (eq < 1) continue

      const key = withoutExport.slice(0, eq).trim()
      if (!key || process.env[key] !== undefined) continue
      process.env[key] = stripQuotes(withoutExport.slice(eq + 1).trim())
    }
  }
}
