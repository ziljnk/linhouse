import { join } from "node:path"
import { drizzle } from "drizzle-orm/mysql2"
import { migrate } from "drizzle-orm/mysql2/migrator"
import mysql from "mysql2/promise"
import { loadLocalEnv } from "./load-local-env.mjs"

loadLocalEnv()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error("DATABASE_URL is missing")
  process.exit(1)
}

let parsed
try {
  parsed = new URL(connectionString)
} catch {
  console.error("DATABASE_URL is invalid")
  process.exit(1)
}

if (parsed.protocol !== "mysql:" && parsed.protocol !== "mysql2:") {
  console.error("DATABASE_URL must be a mysql connection string")
  process.exit(1)
}

const pool = mysql.createPool({
  uri: connectionString,
  connectionLimit: 1,
  timezone: "Z",
})
const db = drizzle(pool, { mode: "default" })
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
  .catch(async (error) => {
    console.error(
      error instanceof Error ? error.message : "Failed to migrate database"
    )
    await pool.end().catch(() => undefined)
    process.exit(1)
  })
