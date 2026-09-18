import { randomUUID } from "node:crypto"
import { char, index, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core"

const timestamptz = (name: string) => timestamp(name, { mode: "date", fsp: 3 })

export type AnalyticsEntityType = "product" | "blog_post"
export type AnalyticsDeviceType = "mobile" | "tablet" | "desktop"

export const analyticsPageview = mysqlTable(
  "analytics_pageview",
  {
    id: char("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
    path: varchar("path", { length: 512 }).notNull(),
    locale: varchar("locale", { length: 8 }),
    entityType: varchar("entity_type", { length: 32 }).$type<
      AnalyticsEntityType | null
    >(),
    entityId: char("entity_id", { length: 36 }),
    countryCode: varchar("country_code", { length: 8 }).notNull().default("XX"),
    referrerHost: varchar("referrer_host", { length: 255 })
      .notNull()
      .default("(direct)"),
    deviceType: varchar("device_type", { length: 16 })
      .$type<AnalyticsDeviceType>()
      .notNull()
      .default("desktop"),
  },
  (table) => [
    index("analytics_pageview_created_at_idx").on(table.createdAt),
    index("analytics_pageview_entity_idx").on(
      table.entityType,
      table.entityId,
      table.createdAt
    ),
    index("analytics_pageview_country_idx").on(table.countryCode, table.createdAt),
  ]
)
