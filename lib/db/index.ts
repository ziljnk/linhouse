import { drizzle } from "drizzle-orm/mysql2"
import mysql from "mysql2/promise"
import { assertDatabaseUrl } from "./database-url"
import { encodeMysqlUrl } from "./mysql-url.mjs"
import * as schema from "./schema"

const rawConnectionString = process.env.DATABASE_URL

if (!rawConnectionString) {
  throw new Error("DATABASE_URL is missing")
}

const connectionString = encodeMysqlUrl(rawConnectionString)
assertDatabaseUrl(connectionString)

const globalForDb = globalThis as unknown as {
  mysqlPool?: mysql.Pool
}

export const pool =
  globalForDb.mysqlPool ??
  mysql.createPool({
    uri: connectionString,
    connectionLimit: 10,
    timezone: "Z",
  })

if (process.env.NODE_ENV !== "production") {
  globalForDb.mysqlPool = pool
}

export const db = drizzle(pool, { schema, mode: "default" })
