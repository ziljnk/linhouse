/**
 * One-shot copy: Postgres → MySQL.
 * Requires a running Postgres (`POSTGRES_URL`) and migrated MySQL (`DATABASE_URL`).
 * Usage: bun run db:import-pg [--force]
 */
import { sql } from "drizzle-orm"
import { Client } from "pg"
import { db, pool } from "../lib/db/index"
import {
  account,
  analyticsPageview,
  appointment,
  attributeGroup,
  blogCategory,
  blogPost,
  catalogAttribute,
  collection,
  collectionImage,
  product,
  productAttribute,
  productCollection,
  productImage,
  rateLimit,
  session,
  siteCopy,
  siteSettings,
  testimonial,
  user,
  verification,
} from "../lib/db/schema"
import type { LocalizedText, SiteSettings } from "../lib/site-settings"

const force = process.argv.includes("--force")
const CHUNK = 200

const INSERT_ORDER = [
  "user",
  "account",
  "session",
  "verification",
  "rateLimit",
  "attribute_group",
  "catalog_attribute",
  "collection",
  "collection_image",
  "product",
  "product_image",
  "product_attribute",
  "product_collection",
  "blog_category",
  "blog_post",
  "testimonial",
  "appointment",
  "site_settings",
  "site_copy",
  "analytics_pageview",
] as const

function asString(value: unknown) {
  if (value == null) return null
  return String(value)
}

function asRequiredString(value: unknown) {
  const next = asString(value)
  if (next == null) throw new Error("Expected string")
  return next
}

function asDate(value: unknown) {
  if (value == null) return null
  return value instanceof Date ? value : new Date(String(value))
}

function asRequiredDate(value: unknown) {
  const next = asDate(value)
  if (!next || Number.isNaN(next.getTime())) throw new Error("Expected date")
  return next
}

function asInt(value: unknown) {
  if (value == null) return null
  const next = Number(value)
  return Number.isFinite(next) ? next : null
}

function asBool(value: unknown) {
  if (value == null) return null
  return Boolean(value)
}

function asJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback
  return value as T
}

function asDateOnly(value: unknown) {
  if (value == null) return null
  if (typeof value === "string") return value.slice(0, 10)
  if (value instanceof Date) {
    const year = value.getUTCFullYear()
    const month = String(value.getUTCMonth() + 1).padStart(2, "0")
    const day = String(value.getUTCDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }
  return String(value).slice(0, 10)
}

function quoteIdent(name: string) {
  return `"${name.replaceAll('"', '""')}"`
}

async function pgCount(pg: Client, table: string) {
  const result = await pg.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM ${quoteIdent(table)}`
  )
  return Number(result.rows[0]?.n ?? 0)
}

async function mysqlCount(table: string) {
  const quoted = table === "user" || table === "rateLimit" ? `\`${table}\`` : table
  const [rows] = await pool.query({ sql: `SELECT COUNT(*) AS n FROM ${quoted}` })
  const row = Array.isArray(rows) ? (rows[0] as { n: number | string }) : undefined
  return Number(row?.n ?? 0)
}

async function insertChunks<T extends Record<string, unknown>>(
  table: Parameters<typeof db.insert>[0],
  rows: T[]
) {
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK)
    if (chunk.length === 0) continue
    await db.insert(table).values(chunk as never)
  }
}

async function copyRows<T extends Record<string, unknown>>(
  pg: Client,
  table: string,
  drizzleTable: Parameters<typeof db.insert>[0],
  transform: (row: Record<string, unknown>) => T
) {
  const source = await pgCount(pg, table)
  const result = await pg.query(`SELECT * FROM ${quoteIdent(table)}`)
  const values = result.rows.map((row) => transform(row as Record<string, unknown>))
  await insertChunks(drizzleTable, values)
  const copied = await mysqlCount(table)
  console.log(`${table}: ${copied}/${source}`)
  if (copied !== source) {
    throw new Error(`${table} row count mismatch: mysql ${copied} vs postgres ${source}`)
  }
}

async function assertMysqlEmpty() {
  const users = await mysqlCount("user")
  const products = await mysqlCount("product")
  if (users > 0 || products > 0) {
    throw new Error(
      "MySQL already has rows. Re-run with --force to truncate, or use an empty database."
    )
  }
}

async function truncateMysql() {
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`)
  for (const table of [...INSERT_ORDER].reverse()) {
    const quoted = table === "user" || table === "rateLimit" ? `\`${table}\`` : table
    await pool.query(`TRUNCATE TABLE ${quoted}`)
  }
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`)
  console.log("Truncated MySQL tables")
}

async function run() {
  const postgresUrl = process.env.POSTGRES_URL
  if (!postgresUrl) {
    throw new Error("POSTGRES_URL is missing")
  }

  const pg = new Client({ connectionString: postgresUrl })
  await pg.connect()

  try {
    if (force) {
      await truncateMysql()
    } else {
      await assertMysqlEmpty()
    }

    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`)

    await copyRows(pg, "user", user, (row) => ({
      id: asRequiredString(row.id),
      name: asRequiredString(row.name),
      email: asRequiredString(row.email),
      emailVerified: Boolean(row.emailVerified),
      image: asString(row.image),
      createdAt: asRequiredDate(row.createdAt),
      updatedAt: asRequiredDate(row.updatedAt),
      mustChangePassword: asBool(row.mustChangePassword),
    }))

    await copyRows(pg, "account", account, (row) => ({
      id: asRequiredString(row.id),
      accountId: asRequiredString(row.accountId),
      providerId: asRequiredString(row.providerId),
      userId: asRequiredString(row.userId),
      accessToken: asString(row.accessToken),
      refreshToken: asString(row.refreshToken),
      idToken: asString(row.idToken),
      accessTokenExpiresAt: asDate(row.accessTokenExpiresAt),
      refreshTokenExpiresAt: asDate(row.refreshTokenExpiresAt),
      scope: asString(row.scope),
      password: asString(row.password),
      createdAt: asRequiredDate(row.createdAt),
      updatedAt: asRequiredDate(row.updatedAt),
    }))

    await copyRows(pg, "session", session, (row) => ({
      id: asRequiredString(row.id),
      expiresAt: asRequiredDate(row.expiresAt),
      token: asRequiredString(row.token),
      createdAt: asRequiredDate(row.createdAt),
      updatedAt: asRequiredDate(row.updatedAt),
      ipAddress: asString(row.ipAddress),
      userAgent: asString(row.userAgent),
      userId: asRequiredString(row.userId),
    }))

    await copyRows(pg, "verification", verification, (row) => ({
      id: asRequiredString(row.id),
      identifier: asRequiredString(row.identifier),
      value: asRequiredString(row.value),
      expiresAt: asRequiredDate(row.expiresAt),
      createdAt: asRequiredDate(row.createdAt),
      updatedAt: asRequiredDate(row.updatedAt),
    }))

    await copyRows(pg, "rateLimit", rateLimit, (row) => ({
      id: asRequiredString(row.id),
      key: asRequiredString(row.key),
      count: asInt(row.count) ?? 0,
      lastRequest: asInt(row.lastRequest) ?? 0,
    }))

    await copyRows(pg, "attribute_group", attributeGroup, (row) => ({
      id: asRequiredString(row.id),
      slug: asRequiredString(row.slug),
      label: asJson<LocalizedText>(row.label, { vi: "", en: "" }),
      selection: row.selection === "multiple" ? "multiple" : "single",
      kind: row.kind === "ao-dai" ? "ao-dai" : "gown",
      sortOrder: asInt(row.sort_order) ?? 0,
      createdAt: asRequiredDate(row.created_at),
      updatedAt: asRequiredDate(row.updated_at),
    }))

    await copyRows(pg, "catalog_attribute", catalogAttribute, (row) => ({
      id: asRequiredString(row.id),
      groupId: asRequiredString(row.group_id),
      slug: asRequiredString(row.slug),
      label: asJson<LocalizedText>(row.label, { vi: "", en: "" }),
      sortOrder: asInt(row.sort_order) ?? 0,
      createdAt: asRequiredDate(row.created_at),
      updatedAt: asRequiredDate(row.updated_at),
    }))

    await copyRows(pg, "collection", collection, (row) => ({
      id: asRequiredString(row.id),
      slug: asRequiredString(row.slug),
      year: asInt(row.year),
      name: asJson<LocalizedText>(row.name, { vi: "", en: "" }),
      subtitle: asJson<LocalizedText>(row.subtitle, { vi: "", en: "" }),
      imageAlt: asJson<LocalizedText>(row.image_alt, { vi: "", en: "" }),
      coverUrl: asRequiredString(row.cover_url),
      status:
        row.status === "published" || row.status === "scheduled"
          ? row.status
          : "draft",
      publishedAt: asDate(row.published_at),
      sortOrder: asInt(row.sort_order) ?? 0,
      seoTitle: asJson<LocalizedText>(row.seo_title, { vi: "", en: "" }),
      seoDescription: asJson<LocalizedText>(row.seo_description, { vi: "", en: "" }),
      seoKeywords: asJson<LocalizedText>(row.seo_keywords, { vi: "", en: "" }),
      createdAt: asRequiredDate(row.created_at),
      updatedAt: asRequiredDate(row.updated_at),
    }))

    await copyRows(pg, "collection_image", collectionImage, (row) => ({
      id: asRequiredString(row.id),
      collectionId: asRequiredString(row.collection_id),
      url: asRequiredString(row.url),
      sortOrder: asInt(row.sort_order) ?? 0,
    }))

    await copyRows(pg, "product", product, (row) => ({
      id: asRequiredString(row.id),
      slug: asRequiredString(row.slug),
      sortNumber: asInt(row.sort_number) ?? 0,
      name: asRequiredString(row.name),
      code: asString(row.code) ?? "",
      fullTitle: asString(row.full_title) ?? "",
      description: asJson<LocalizedText>(row.description, { vi: "", en: "" }),
      priceVnd: asInt(row.price_vnd),
      priceDisplay: row.price_display === "amount" ? "amount" : "contact",
      kind: row.kind === "ao-dai" ? "ao-dai" : "gown",
      featured: Boolean(row.featured),
      status:
        row.status === "published" || row.status === "scheduled"
          ? row.status
          : "draft",
      publishedAt: asDate(row.published_at),
      sortOrder: asInt(row.sort_order) ?? 0,
      tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
      seoTitle: asJson<LocalizedText>(row.seo_title, { vi: "", en: "" }),
      seoDescription: asJson<LocalizedText>(row.seo_description, { vi: "", en: "" }),
      seoKeywords: asJson<LocalizedText>(row.seo_keywords, { vi: "", en: "" }),
      createdAt: asRequiredDate(row.created_at),
      updatedAt: asRequiredDate(row.updated_at),
    }))

    await copyRows(pg, "product_image", productImage, (row) => ({
      id: asRequiredString(row.id),
      productId: asRequiredString(row.product_id),
      url: asRequiredString(row.url),
      sortOrder: asInt(row.sort_order) ?? 0,
    }))

    await copyRows(pg, "product_attribute", productAttribute, (row) => ({
      productId: asRequiredString(row.product_id),
      attributeId: asRequiredString(row.attribute_id),
    }))

    await copyRows(pg, "product_collection", productCollection, (row) => ({
      productId: asRequiredString(row.product_id),
      collectionId: asRequiredString(row.collection_id),
    }))

    await copyRows(pg, "blog_category", blogCategory, (row) => ({
      id: asRequiredString(row.id),
      slug: asRequiredString(row.slug),
      label: asJson<LocalizedText>(row.label, { vi: "", en: "" }),
      createdAt: asRequiredDate(row.created_at),
      updatedAt: asRequiredDate(row.updated_at),
    }))

    await copyRows(pg, "blog_post", blogPost, (row) => ({
      id: asRequiredString(row.id),
      slug: asRequiredString(row.slug),
      categoryId: asRequiredString(row.category_id),
      title: asJson<LocalizedText>(row.title, { vi: "", en: "" }),
      excerpt: asJson<LocalizedText>(row.excerpt, { vi: "", en: "" }),
      imageAlt: asJson<LocalizedText>(row.image_alt, { vi: "", en: "" }),
      content: asJson<LocalizedText>(row.content, { vi: "", en: "" }),
      coverUrl: asRequiredString(row.cover_url),
      status:
        row.status === "published" || row.status === "scheduled"
          ? row.status
          : "draft",
      publishedAt: asDate(row.published_at),
      seoTitle: asJson<LocalizedText>(row.seo_title, { vi: "", en: "" }),
      seoDescription: asJson<LocalizedText>(row.seo_description, { vi: "", en: "" }),
      seoKeywords: asJson<LocalizedText>(row.seo_keywords, { vi: "", en: "" }),
      createdAt: asRequiredDate(row.created_at),
      updatedAt: asRequiredDate(row.updated_at),
    }))

    await copyRows(pg, "testimonial", testimonial, (row) => ({
      id: asRequiredString(row.id),
      slug: asRequiredString(row.slug),
      name: asRequiredString(row.name),
      imageUrl: asRequiredString(row.image_url),
      quote: asJson<LocalizedText>(row.quote, { vi: "", en: "" }),
      imageAlt: asJson<LocalizedText>(row.image_alt, { vi: "", en: "" }),
      gown: asString(row.gown) ?? "",
      productId: asString(row.product_id),
      year: asInt(row.year),
      status:
        row.status === "published" || row.status === "scheduled"
          ? row.status
          : "draft",
      sortOrder: asInt(row.sort_order) ?? 0,
      createdAt: asRequiredDate(row.created_at),
      updatedAt: asRequiredDate(row.updated_at),
    }))

    const appointmentSource = await pgCount(pg, "appointment")
    const appointmentResult = await pg.query(
      `SELECT id, name, phone, email, store, preferred_date::text AS preferred_date,
              preferred_time, message, locale, email_sent_at, created_at
       FROM ${quoteIdent("appointment")}`
    )
    await insertChunks(
      appointment,
      appointmentResult.rows.map((row) => ({
        id: asRequiredString(row.id),
        name: asRequiredString(row.name),
        phone: asRequiredString(row.phone),
        email: asRequiredString(row.email),
        store: asRequiredString(row.store),
        preferredDate: asDateOnly(row.preferred_date) ?? "1970-01-01",
        preferredTime: asString(row.preferred_time) ?? "",
        message: asString(row.message) ?? "",
        locale: asString(row.locale) ?? "vi",
        emailSentAt: asDate(row.email_sent_at),
        createdAt: asRequiredDate(row.created_at),
      }))
    )
    const appointmentCopied = await mysqlCount("appointment")
    console.log(`appointment: ${appointmentCopied}/${appointmentSource}`)
    if (appointmentCopied !== appointmentSource) {
      throw new Error(
        `appointment row count mismatch: mysql ${appointmentCopied} vs postgres ${appointmentSource}`
      )
    }

    await copyRows(pg, "site_settings", siteSettings, (row) => ({
      id: asRequiredString(row.id),
      data: asJson<SiteSettings>(row.data, {} as SiteSettings),
      updatedAt: asRequiredDate(row.updated_at),
    }))

    await copyRows(pg, "site_copy", siteCopy, (row) => ({
      key: asRequiredString(row.key),
      value: row.value,
      updatedAt: asRequiredDate(row.updated_at),
    }))

    await copyRows(pg, "analytics_pageview", analyticsPageview, (row) => ({
      id: asRequiredString(row.id),
      createdAt: asRequiredDate(row.created_at),
      path: asRequiredString(row.path),
      locale: asString(row.locale),
      entityType:
        row.entity_type === "product" || row.entity_type === "blog_post"
          ? row.entity_type
          : null,
      entityId: asString(row.entity_id),
      countryCode: asString(row.country_code) ?? "XX",
      referrerHost: asString(row.referrer_host) ?? "(direct)",
      deviceType:
        row.device_type === "mobile" || row.device_type === "tablet"
          ? row.device_type
          : "desktop",
    }))

    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`)
    console.log("Copied Postgres data into MySQL")
  } finally {
    await pg.end()
  }
}

run()
  .then(async () => {
    await pool.end()
    process.exit(0)
  })
  .catch(async (error: unknown) => {
    console.error(
      error instanceof Error ? error.message : "Failed to copy Postgres data"
    )
    await pool.end().catch(() => undefined)
    process.exit(1)
  })
