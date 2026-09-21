import { defineConfig } from "drizzle-kit"
import { assertDatabaseUrl } from "./lib/db/database-url"
import { encodeMysqlUrl } from "./lib/db/mysql-url.mjs"

const rawConnectionString = process.env.DATABASE_URL

if (!rawConnectionString) {
  throw new Error("DATABASE_URL is missing")
}

const connectionString = encodeMysqlUrl(rawConnectionString)
assertDatabaseUrl(connectionString)

export default defineConfig({
  schema: "./lib/db/schema/index.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: connectionString,
  },
})
