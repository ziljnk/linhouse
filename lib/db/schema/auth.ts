import { relations } from "drizzle-orm"
import {
  bigint,
  boolean,
  foreignKey,
  index,
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core"

const timestamptz = (name: string) => timestamp(name, { mode: "date", fsp: 3 })

const authId = (name: string) => varchar(name, { length: 255 })

export const user = mysqlTable("user", {
  id: authId("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique("user_email_key"),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamptz("createdAt").defaultNow().notNull(),
  updatedAt: timestamptz("updatedAt")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  mustChangePassword: boolean("mustChangePassword").default(true),
})

export const session = mysqlTable(
  "session",
  {
    id: authId("id").primaryKey(),
    expiresAt: timestamptz("expiresAt").notNull(),
    token: varchar("token", { length: 255 }).notNull().unique("session_token_key"),
    createdAt: timestamptz("createdAt").defaultNow().notNull(),
    updatedAt: timestamptz("updatedAt")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: authId("userId").notNull(),
  },
  (table) => [
    index("session_userId_idx").on(table.userId),
    foreignKey({
      name: "session_userId_fkey",
      columns: [table.userId],
      foreignColumns: [user.id],
    }).onDelete("cascade"),
  ]
)

export const account = mysqlTable(
  "account",
  {
    id: authId("id").primaryKey(),
    accountId: varchar("accountId", { length: 255 }).notNull(),
    providerId: varchar("providerId", { length: 255 }).notNull(),
    userId: authId("userId").notNull(),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamptz("accessTokenExpiresAt"),
    refreshTokenExpiresAt: timestamptz("refreshTokenExpiresAt"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamptz("createdAt").defaultNow().notNull(),
    updatedAt: timestamptz("updatedAt")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("account_userId_idx").on(table.userId),
    foreignKey({
      name: "account_userId_fkey",
      columns: [table.userId],
      foreignColumns: [user.id],
    }).onDelete("cascade"),
  ]
)

export const verification = mysqlTable(
  "verification",
  {
    id: authId("id").primaryKey(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    value: text("value").notNull(),
    expiresAt: timestamptz("expiresAt").notNull(),
    createdAt: timestamptz("createdAt").defaultNow().notNull(),
    updatedAt: timestamptz("updatedAt")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
)

export const rateLimit = mysqlTable("rateLimit", {
  id: authId("id").primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique("rateLimit_key_key"),
  count: int("count").notNull(),
  lastRequest: bigint("lastRequest", { mode: "number" }).notNull(),
})

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))
