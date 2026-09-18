import { defineConfig } from "drizzle-kit"
import { assertDatabaseUrl } from "./lib/db/database-url"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is missing")
}

assertDatabaseUrl(connectionString)

export default defineConfig({
  schema: "./lib/db/schema/index.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: connectionString,
  },
})
