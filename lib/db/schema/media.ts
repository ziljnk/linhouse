import { randomUUID } from "node:crypto"
import {
  char,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/mysql-core"

const timestamptz = (name: string) => timestamp(name, { mode: "date", fsp: 3 })

export const media = mysqlTable(
  "media",
  {
    id: char("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
    type: mysqlEnum("type", [
      "products",
      "collections",
      "blog",
      "testimonials",
      "about",
    ]).notNull(),
    storageKey: varchar("storage_key", { length: 255 }).notNull(),
    width: int("width").notNull(),
    height: int("height").notNull(),
    mimeType: varchar("mime_type", { length: 64 }).notNull(),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
  },
  (table) => [unique("media_storage_key_unique").on(table.storageKey)]
)
