import {
  boolean,
  date,
  int,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core"

const timestamptz = (name: string) => timestamp(name, { mode: "date", fsp: 3 })

/** Singleton row (`id` = default) for the homepage promotion dialog. */
export const promotionPopup = mysqlTable("promotion_popup", {
  id: varchar("id", { length: 32 }).primaryKey().default("default"),
  enabled: boolean("enabled").notNull().default(false),
  imageStorageKey: varchar("image_storage_key", { length: 255 }),
  imageFilename: varchar("image_filename", { length: 255 }),
  imageBytes: int("image_bytes"),
  imageAlt: varchar("image_alt", { length: 500 }).notNull().default(""),
  linkUrl: varchar("link_url", { length: 2048 }),
  startsOn: date("starts_on", { mode: "string" }),
  endsOn: date("ends_on", { mode: "string" }),
  updatedAt: timestamptz("updated_at").defaultNow().notNull(),
})
