import { join } from "node:path"
import { migrate } from "drizzle-orm/mysql2/migrator"
import { db, pool } from "../lib/db/index"

const migrationsFolder = join(process.cwd(), "drizzle")

async function run() {
  await migrate(db, { migrationsFolder })
  console.log("Database migrations are up to date")
}

run()
  .then(async () => {
    await pool.end()
    process.exit(0)
  })
  .catch(async (error: unknown) => {
    console.error(
      error instanceof Error ? error.message : "Failed to migrate database"
    )
    await pool.end().catch(() => undefined)
    process.exit(1)
  })
