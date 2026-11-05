import { mkdtemp, readdir, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"
import { build } from "esbuild"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")

async function collect(dir, acc = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue
      await collect(path, acc)
    } else if (entry.name.endsWith(".test.ts")) {
      acc.push(path)
    }
  }
  return acc
}

const files = await collect(join(root, "lib"))
if (files.length === 0) {
  console.error("No unit tests found")
  process.exit(1)
}

const outdir = await mkdtemp(join(tmpdir(), "linhouse-unit-"))

try {
  await build({
    absWorkingDir: root,
    entryPoints: files,
    outdir,
    outbase: root,
    bundle: true,
    platform: "node",
    format: "cjs",
    packages: "external",
    logLevel: "silent",
    alias: { "@": root },
  })
} catch (error) {
  console.error(error instanceof Error ? error.message : "Failed to compile unit tests")
  await rm(outdir, { recursive: true, force: true }).catch(() => undefined)
  process.exit(1)
}

const tests = files.map((file) =>
  join(outdir, file.slice(root.length + 1).replace(/\.ts$/, ".js"))
)

const child = spawn(process.execPath, ["--test", ...tests], {
  stdio: "inherit",
  cwd: root,
})

child.on("exit", async (code) => {
  await rm(outdir, { recursive: true, force: true }).catch(() => undefined)
  process.exit(code ?? 1)
})
