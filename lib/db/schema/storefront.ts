import { randomUUID } from "node:crypto"
import { relations } from "drizzle-orm"
import {
  boolean,
  char,
  date,
  foreignKey,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/mysql-core"
import type { LocalizedText, SiteSettings } from "@/lib/site-settings"

const timestamptz = (name: string) => timestamp(name, { mode: "date", fsp: 3 })

const uuidColumn = (name: string) => char(name, { length: 36 })

const uuidPk = (name = "id") =>
  uuidColumn(name).$defaultFn(() => randomUUID()).primaryKey()

const slug = (name = "slug") => varchar(name, { length: 255 })

export const emptyLocalizedText = (): LocalizedText => ({ vi: "", en: "" })

const contentStatusValues = ["draft", "scheduled", "published"] as const
const attributeSelectionValues = ["single", "multiple"] as const
const priceDisplayValues = ["amount", "contact"] as const
const productKindValues = ["gown", "ao-dai"] as const

export const attributeGroup = mysqlTable("attribute_group", {
  id: uuidPk(),
  slug: slug().notNull().unique("attribute_group_slug_key"),
  label: json("label").$type<LocalizedText>().notNull(),
  selection: mysqlEnum("selection", attributeSelectionValues)
    .notNull()
    .default("single"),
  kind: mysqlEnum("kind", productKindValues).notNull().default("gown"),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: timestamptz("created_at").defaultNow().notNull(),
  updatedAt: timestamptz("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const catalogAttribute = mysqlTable(
  "catalog_attribute",
  {
    id: uuidPk(),
    groupId: uuidColumn("group_id").notNull(),
    slug: slug().notNull().unique("catalog_attribute_slug_key"),
    label: json("label").$type<LocalizedText>().notNull(),
    sortOrder: int("sort_order").notNull().default(0),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
    updatedAt: timestamptz("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("catalog_attribute_group_id_idx").on(table.groupId),
    foreignKey({
      name: "catalog_attribute_group_id_fkey",
      columns: [table.groupId],
      foreignColumns: [attributeGroup.id],
    }).onDelete("cascade"),
  ]
)

export const collection = mysqlTable(
  "collection",
  {
    id: uuidPk(),
    slug: slug().notNull().unique("collection_slug_key"),
    year: int("year"),
    name: json("name").$type<LocalizedText>().notNull(),
    subtitle: json("subtitle").$type<LocalizedText>().notNull(),
    imageAlt: json("image_alt").$type<LocalizedText>().notNull(),
    coverUrl: text("cover_url").notNull(),
    status: mysqlEnum("status", contentStatusValues).notNull().default("draft"),
    publishedAt: timestamptz("published_at"),
    sortOrder: int("sort_order").notNull().default(0),
    seoTitle: json("seo_title").$type<LocalizedText>().notNull(),
    seoDescription: json("seo_description").$type<LocalizedText>().notNull(),
    seoKeywords: json("seo_keywords").$type<LocalizedText>().notNull(),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
    updatedAt: timestamptz("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("collection_status_published_at_idx").on(
      table.status,
      table.publishedAt
    ),
  ]
)

export const collectionImage = mysqlTable(
  "collection_image",
  {
    id: uuidPk(),
    collectionId: uuidColumn("collection_id").notNull(),
    url: text("url").notNull(),
    sortOrder: int("sort_order").notNull().default(0),
  },
  (table) => [
    index("collection_image_collection_id_idx").on(table.collectionId),
    unique("collection_image_collection_sort_key").on(
      table.collectionId,
      table.sortOrder
    ),
    foreignKey({
      name: "collection_image_collection_id_fkey",
      columns: [table.collectionId],
      foreignColumns: [collection.id],
    }).onDelete("cascade"),
  ]
)

export const product = mysqlTable(
  "product",
  {
    id: uuidPk(),
    slug: slug().notNull().unique("product_slug_key"),
    sortNumber: int("sort_number").notNull().default(0),
    name: text("name").notNull(),
    code: varchar("code", { length: 255 }).notNull().default(""),
    fullTitle: text("full_title").notNull().$defaultFn(() => ""),
    description: json("description").$type<LocalizedText>().notNull(),
    priceVnd: int("price_vnd"),
    priceDisplay: mysqlEnum("price_display", priceDisplayValues)
      .notNull()
      .default("contact"),
    kind: mysqlEnum("kind", productKindValues).notNull().default("gown"),
    featured: boolean("featured").notNull().default(true),
    status: mysqlEnum("status", contentStatusValues).notNull().default("draft"),
    publishedAt: timestamptz("published_at"),
    sortOrder: int("sort_order").notNull().default(0),
    tags: json("tags").$type<string[]>().notNull().$defaultFn(() => []),
    seoTitle: json("seo_title").$type<LocalizedText>().notNull(),
    seoDescription: json("seo_description").$type<LocalizedText>().notNull(),
    seoKeywords: json("seo_keywords").$type<LocalizedText>().notNull(),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
    updatedAt: timestamptz("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("product_status_published_at_idx").on(table.status, table.publishedAt),
  ]
)

export const productImage = mysqlTable(
  "product_image",
  {
    id: uuidPk(),
    productId: uuidColumn("product_id").notNull(),
    url: text("url").notNull(),
    sortOrder: int("sort_order").notNull().default(0),
  },
  (table) => [
    index("product_image_product_id_idx").on(table.productId),
    unique("product_image_product_sort_key").on(table.productId, table.sortOrder),
    foreignKey({
      name: "product_image_product_id_fkey",
      columns: [table.productId],
      foreignColumns: [product.id],
    }).onDelete("cascade"),
  ]
)

export const productAttribute = mysqlTable(
  "product_attribute",
  {
    productId: uuidColumn("product_id").notNull(),
    attributeId: uuidColumn("attribute_id").notNull(),
  },
  (table) => [
    primaryKey({
      name: "product_attribute_pkey",
      columns: [table.productId, table.attributeId],
    }),
    index("product_attribute_attribute_id_idx").on(table.attributeId),
    index("product_attribute_product_id_idx").on(table.productId),
    foreignKey({
      name: "product_attribute_product_id_fkey",
      columns: [table.productId],
      foreignColumns: [product.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "product_attribute_attribute_id_fkey",
      columns: [table.attributeId],
      foreignColumns: [catalogAttribute.id],
    }).onDelete("cascade"),
  ]
)

export const productCollection = mysqlTable(
  "product_collection",
  {
    productId: uuidColumn("product_id").notNull(),
    collectionId: uuidColumn("collection_id").notNull(),
  },
  (table) => [
    primaryKey({
      name: "product_collection_pkey",
      columns: [table.productId, table.collectionId],
    }),
    index("product_collection_collection_id_idx").on(table.collectionId),
    index("product_collection_product_id_idx").on(table.productId),
    foreignKey({
      name: "product_collection_product_id_fkey",
      columns: [table.productId],
      foreignColumns: [product.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "product_collection_collection_id_fkey",
      columns: [table.collectionId],
      foreignColumns: [collection.id],
    }).onDelete("cascade"),
  ]
)

export const blogCategory = mysqlTable("blog_category", {
  id: uuidPk(),
  slug: slug().notNull().unique("blog_category_slug_key"),
  label: json("label").$type<LocalizedText>().notNull(),
  createdAt: timestamptz("created_at").defaultNow().notNull(),
  updatedAt: timestamptz("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const blogPost = mysqlTable(
  "blog_post",
  {
    id: uuidPk(),
    slug: slug().notNull().unique("blog_post_slug_key"),
    categoryId: uuidColumn("category_id").notNull(),
    title: json("title").$type<LocalizedText>().notNull(),
    excerpt: json("excerpt").$type<LocalizedText>().notNull(),
    imageAlt: json("image_alt").$type<LocalizedText>().notNull(),
    content: json("content").$type<LocalizedText>().notNull(),
    coverUrl: text("cover_url").notNull(),
    status: mysqlEnum("status", contentStatusValues).notNull().default("draft"),
    publishedAt: timestamptz("published_at"),
    seoTitle: json("seo_title").$type<LocalizedText>().notNull(),
    seoDescription: json("seo_description").$type<LocalizedText>().notNull(),
    seoKeywords: json("seo_keywords").$type<LocalizedText>().notNull(),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
    updatedAt: timestamptz("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("blog_post_category_id_idx").on(table.categoryId),
    index("blog_post_status_published_at_idx").on(
      table.status,
      table.publishedAt
    ),
    foreignKey({
      name: "blog_post_category_id_fkey",
      columns: [table.categoryId],
      foreignColumns: [blogCategory.id],
    }).onDelete("restrict"),
  ]
)

export const testimonial = mysqlTable(
  "testimonial",
  {
    id: uuidPk(),
    slug: slug().notNull().unique("testimonial_slug_key"),
    name: varchar("name", { length: 255 }).notNull(),
    imageUrl: text("image_url").notNull(),
    quote: json("quote").$type<LocalizedText>().notNull(),
    imageAlt: json("image_alt").$type<LocalizedText>().notNull(),
    gown: varchar("gown", { length: 255 }).notNull().default(""),
    productId: uuidColumn("product_id"),
    year: int("year"),
    status: mysqlEnum("status", contentStatusValues).notNull().default("draft"),
    sortOrder: int("sort_order").notNull().default(0),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
    updatedAt: timestamptz("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("testimonial_product_id_idx").on(table.productId),
    foreignKey({
      name: "testimonial_product_id_fkey",
      columns: [table.productId],
      foreignColumns: [product.id],
    }).onDelete("set null"),
  ]
)

export const appointment = mysqlTable(
  "appointment",
  {
    id: uuidPk(),
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 64 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    store: varchar("store", { length: 255 }).notNull(),
    preferredDate: date("preferred_date", { mode: "string" }).notNull(),
    preferredTime: varchar("preferred_time", { length: 32 }).notNull().default(""),
    message: text("message").notNull().$defaultFn(() => ""),
    locale: varchar("locale", { length: 8 }).notNull().default("vi"),
    emailSentAt: timestamptz("email_sent_at"),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
  },
  (table) => [index("appointment_created_at_idx").on(table.createdAt)]
)

export const siteSettings = mysqlTable("site_settings", {
  id: varchar("id", { length: 32 }).primaryKey().default("default"),
  data: json("data").$type<SiteSettings>().notNull(),
  updatedAt: timestamptz("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const siteCopy = mysqlTable("site_copy", {
  key: varchar("key", { length: 255 }).primaryKey(),
  value: json("value").$type<unknown>().notNull(),
  updatedAt: timestamptz("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const attributeGroupRelations = relations(attributeGroup, ({ many }) => ({
  attributes: many(catalogAttribute),
}))

export const catalogAttributeRelations = relations(
  catalogAttribute,
  ({ one, many }) => ({
    group: one(attributeGroup, {
      fields: [catalogAttribute.groupId],
      references: [attributeGroup.id],
    }),
    products: many(productAttribute),
  })
)

export const collectionRelations = relations(collection, ({ many }) => ({
  images: many(collectionImage),
  products: many(productCollection),
}))

export const collectionImageRelations = relations(collectionImage, ({ one }) => ({
  collection: one(collection, {
    fields: [collectionImage.collectionId],
    references: [collection.id],
  }),
}))

export const productRelations = relations(product, ({ many }) => ({
  images: many(productImage),
  attributes: many(productAttribute),
  collections: many(productCollection),
  testimonials: many(testimonial),
}))

export const productImageRelations = relations(productImage, ({ one }) => ({
  product: one(product, {
    fields: [productImage.productId],
    references: [product.id],
  }),
}))

export const productAttributeRelations = relations(
  productAttribute,
  ({ one }) => ({
    product: one(product, {
      fields: [productAttribute.productId],
      references: [product.id],
    }),
    attribute: one(catalogAttribute, {
      fields: [productAttribute.attributeId],
      references: [catalogAttribute.id],
    }),
  })
)

export const productCollectionRelations = relations(
  productCollection,
  ({ one }) => ({
    product: one(product, {
      fields: [productCollection.productId],
      references: [product.id],
    }),
    collection: one(collection, {
      fields: [productCollection.collectionId],
      references: [collection.id],
    }),
  })
)

export const blogCategoryRelations = relations(blogCategory, ({ many }) => ({
  posts: many(blogPost),
}))

export const blogPostRelations = relations(blogPost, ({ one }) => ({
  category: one(blogCategory, {
    fields: [blogPost.categoryId],
    references: [blogCategory.id],
  }),
}))

export const testimonialRelations = relations(testimonial, ({ one }) => ({
  product: one(product, {
    fields: [testimonial.productId],
    references: [product.id],
  }),
}))
