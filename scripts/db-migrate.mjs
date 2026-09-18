import { join } from "node:path"
import { drizzle } from "drizzle-orm/mysql2"
import { migrate } from "drizzle-orm/mysql2/migrator"
import mysql from "mysql2/promise"
import { encodeMysqlUrl } from "../lib/db/mysql-url.mjs"
import { loadLocalEnv } from "./load-local-env.mjs"

loadLocalEnv()

const rawConnectionString = process.env.DATABASE_URL
if (!rawConnectionString) {
  console.error("DATABASE_URL is missing")
  process.exit(1)
}

let connectionString
try {
  connectionString = encodeMysqlUrl(rawConnectionString)
} catch (error) {
  console.error(
    error instanceof Error
      ? error.message
      : "DATABASE_URL is invalid. Use mysql://USER:PASSWORD@HOST:3306/DATABASE"
  )
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
