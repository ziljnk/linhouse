import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"
import { build } from "esbuild"
import { loadLocalEnv } from "./load-local-env.mjs"

loadLocalEnv()

const entry = process.argv[2]
if (!entry) {
  console.error("Usage: node scripts/run-ts.mjs <file.ts> [...args]")
  process.exit(1)
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const outfileDir = await mkdtemp(join(tmpdir(), "linhouse-ts-"))
const outfile = join(outfileDir, "script.cjs")

try {
  await build({
    absWorkingDir: root,
    entryPoints: [resolve(root, entry)],
    outfile,
    bundle: true,
    platform: "node",
    format: "cjs",
    packages: "external",
    logLevel: "silent",
    alias: {
      "@": root,
    },
  })
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Failed to compile TypeScript script"
  )
  await rm(outfileDir, { recursive: true, force: true }).catch(() => undefined)
  process.exit(1)
}

const child = spawn(
  process.execPath,
  [outfile, ...process.argv.slice(3)],
  {
    stdio: "inherit",
    cwd: root,
    env: process.env,
  }
)

child.on("exit", async (code) => {
  await rm(outfileDir, { recursive: true, force: true }).catch(() => undefined)
  process.exit(code ?? 1)
})
