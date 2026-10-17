import { randomUUID } from "node:crypto"
import { sql } from "drizzle-orm"
import { char, index, json, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core"
import type { AuditAction, AuditArea, AuditChange } from "@/lib/admin-audit-shared"

export const adminAuditLog = mysqlTable(
  "admin_audit_log",
  {
    id: char("id", { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
    actorUserId: varchar("actor_user_id", { length: 255 }).notNull(),
    actorName: varchar("actor_name", { length: 255 }).notNull(),
    actorEmail: varchar("actor_email", { length: 255 }).notNull(),
    action: varchar("action", { length: 16 }).$type<AuditAction>().notNull(),
    area: varchar("area", { length: 32 }).$type<AuditArea>().notNull(),
    entityLabel: varchar("entity_label", { length: 500 }).notNull(),
    summary: varchar("summary", { length: 500 }).notNull(),
    changes: json("changes").$type<AuditChange[]>().notNull(),
    createdAt: timestamp("created_at", { mode: "date", fsp: 3 })
      .default(sql`(now(3))`)
      .notNull(),
  },
  (table) => [
    index("admin_audit_log_created_at_idx").on(table.createdAt),
    index("admin_audit_log_area_created_at_idx").on(table.area, table.createdAt),
  ]
)
