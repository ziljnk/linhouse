import { eq } from "drizzle-orm"
import enDict from "../app/[locale]/dictionaries/en.json"
import viDict from "../app/[locale]/dictionaries/vi.json"
import siteSettingsJson from "../data/site-settings.json"
import { slugify } from "../lib/admin-testimonials"
import { db, pool } from "../lib/db/index"
import {
  attributeGroup,
  blogCategory,
  blogPost,
  catalogAttribute,
  collection,
  collectionImage,
  emptyLocalizedText,
  product,
  productAttribute,
  productCollection,
  productImage,
  siteCopy,
  siteSettings,
  testimonial,
} from "../lib/db/schema"
import { normalizeSiteSettings, type LocalizedText } from "../lib/site-settings"

type SlugTable =
  | typeof attributeGroup
  | typeof catalogAttribute
  | typeof collection
  | typeof product
  | typeof blogCategory

async function requireIdBySlug(table: SlugTable, slug: string) {
  const [row] = await db
    .select({ id: table.id })
    .from(table)
    .where(eq(table.slug, slug))
    .limit(1)

  if (!row) throw new Error(`Failed to upsert ${slug}`)
  return row
}

const VIRTUAL_ATTRIBUTE_SLUGS = new Set(["all-gowns", "all-ao-dai"])

const ATTRIBUTE_GROUP_DEFS = [
  { slug: "silhouette", sortOrder: 1, kind: "gown" as const, source: "bridal" as const, columnIndex: 0 },
  { slug: "neckline", sortOrder: 2, kind: "gown" as const, source: "bridal" as const, columnIndex: 1 },
  { slug: "fabric", sortOrder: 3, kind: "gown" as const, source: "bridal" as const, columnIndex: 2 },
  { slug: "ao-dai-color", sortOrder: 10, kind: "ao-dai" as const, source: "aodai" as const, columnIndex: 1 },
  { slug: "ao-dai-fabric", sortOrder: 11, kind: "ao-dai" as const, source: "aodai" as const, columnIndex: 2 },
  { slug: "ao-dai-style", sortOrder: 12, kind: "ao-dai" as const, source: "aodai" as const, columnIndex: 3 },
] as const

const BLOG_CATEGORIES = [
  { slug: "xu-huong", label: { vi: "Xu hướng", en: "Trends" } },
  { slug: "kinh-nghiem", label: { vi: "Kinh nghiệm", en: "Experience" } },
  { slug: "phu-kien", label: { vi: "Phụ kiện", en: "Accessories" } },
  {
    slug: "behind-the-scenes",
    label: { vi: "Behind the scenes", en: "Behind the scenes" },
  },
] as const

const BLOG_CATEGORY_BY_LABEL: Record<string, string> = {
  "Xu hướng": "xu-huong",
  "Kinh nghiệm": "kinh-nghiem",
  "Phụ kiện": "phu-kien",
  "Behind the scenes": "behind-the-scenes",
}

const LIVE_POST_CATEGORIES: Record<string, string> = {
  "short-midi-wedding-dresses-2026": "xu-huong",
  "wedding-dress-trends-2026": "xu-huong",
}

const EXTRA_POSTS = [
  {
    slug: "bridal-accessories-2026",
    categorySlug: "phu-kien",
    title: {
      vi: "Phụ kiện cô dâu 2026: Voan, trang sức và điểm nhấn cho ngày lễ",
      en: "",
    },
    coverUrl:
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
    status: "published" as const,
    publishedAt: new Date("2026-09-18T02:00:00.000Z"),
  },
  {
    slug: "fitting-day-checklist",
    categorySlug: "kinh-nghiem",
    title: {
      vi: "Checklist buổi fitting: Những điều cô dâu nên chuẩn bị",
      en: "",
    },
    coverUrl:
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    status: "draft" as const,
    publishedAt: null,
  },
  {
    slug: "behind-atelier-linhouse",
    categorySlug: "behind-the-scenes",
    title: {
      vi: "Behind the scenes: Một ngày tại atelier LINHouse",
      en: "",
    },
    coverUrl:
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80",
    status: "published" as const,
    publishedAt: new Date("2026-09-01T00:00:00+07:00"),
  },
  {
    slug: "garden-wedding-lookbook",
    categorySlug: "xu-huong",
    title: {
      vi: "Lookbook tiệc cưới sân vườn: Dáng váy và chất liệu nên chọn",
      en: "",
    },
    coverUrl:
      "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1200&q=80",
    status: "published" as const,
    publishedAt: new Date("2026-09-24T04:30:00.000Z"),
  },
  {
    slug: "ao-dai-cuoi-hien-dai",
    categorySlug: "kinh-nghiem",
    title: {
      vi: "Áo dài cưới hiện đại: Giữ nét truyền thống, mặc cho ngày mới",
      en: "",
    },
    coverUrl:
      "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1200&q=80",
    status: "draft" as const,
    publishedAt: null,
  },
]

type NavLink = { label: string; href: string }
type NavColumn = { title: string; links: NavLink[] }
type CatalogItem = {
  name: string
  image: string
  collections: string[]
  silhouette: string
  neckline: string
  fabric: string
}
type BlogItem = {
  slug: string
  title: string
  date: string
  image: string
  imageAlt: string
  excerpt: string
}
type TestimonialItem = {
  name: string
  quote: string
  image: string
  imageAlt: string
  meta: { label: string; value: string }[]
}
type AboutCopy = {
  label: string
  headline: string
  body: string
  steps: { number: string; title: string; body: string }[]
}

function localized(vi: string, en: string): LocalizedText {
  return { vi, en }
}

function catalogSlug(href: string) {
  return href.replace("/catalog/", "")
}

function parseCatalogName(name: string) {
  const parts = name.split(" — ")
  const numberMatch = parts[0]?.match(/^No\.(\d+)$/)
  const sortNumber = numberMatch ? Number(numberMatch[1]) : 0
  const shortName = parts[1] ?? parts[0] ?? name
  const rest = parts.slice(2).join(" — ")
  const skuMatch = rest.match(/^([A-Z0-9]+-\d+)\s+(.+)$/)

  if (skuMatch) {
    return {
      sortNumber,
      name: shortName,
      code: skuMatch[1],
      fullTitle: skuMatch[2],
    }
  }

  return {
    sortNumber,
    name: shortName,
    code: "",
    fullTitle: rest,
  }
}

function productSlugFromName(name: string) {
  return parseCatalogName(name)
    .name.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const AO_DAI_COLORS = [
  "ao-dai-white",
  "ao-dai-red",
  "ao-dai-yellow",
  "ao-dai-pink",
  "ao-dai-ivory",
  "ao-dai-blue",
  "ao-dai-gold",
  "ao-dai-black",
] as const

const AO_DAI_FABRICS = [
  "ao-dai-silk",
  "ao-dai-lace",
  "ao-dai-mesh",
  "ao-dai-brocade",
  "ao-dai-velvet",
  "ao-dai-organza",
] as const

const AO_DAI_STYLES = [
  "ao-dai-traditional",
  "ao-dai-modern",
  "ao-dai-wedding",
  "ao-dai-column",
] as const

const AO_DAI_NAMES = [
  "An", "Bich", "Cam", "Chau", "Dao", "Diep", "Duyen", "Giang", "Ha", "Hanh",
  "Hong", "Hue", "Khanh", "Kieu", "Kim", "Lam", "Lan", "Lieu", "Linh", "Mai",
  "Minh", "My", "Ngan", "Ngoc", "Nhu", "Nguyet", "Oanh", "Phuong", "Quynh", "Sen",
  "Thanh", "Thao", "Thu", "Trang", "Tra", "Trinh", "Truc", "Uyen", "Van", "Vy",
  "Xuan", "Yen", "Anh", "Chi", "Hien", "Hoa", "Le", "Nhi", "Phuc", "Tam",
] as const

const AO_DAI_TITLES = [
  "Silk Traditional Ao Dai",
  "Lace Modern Ao Dai",
  "Wedding Brocade Ao Dai",
  "Column Organza Ao Dai",
  "Velvet Evening Ao Dai",
  "Mesh Reception Ao Dai",
] as const

const AO_DAI_IMAGES = [
  "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1519223484940-8ea749b2e8eb?auto=format&fit=crop&w=800&q=80",
] as const

function parseViDate(value: string) {
  const match = value.match(/^(\d{1,2})\s+Thg\s+(\d{1,2}),\s+(\d{4})$/)
  if (!match) return null

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  return new Date(Date.UTC(year, month - 1, day, 17, 0, 0))
}

function metaValue(item: TestimonialItem, labels: string[]) {
  return item.meta.find((row) => labels.includes(row.label))?.value ?? ""
}

function collectionYearsFromNav(columns: NavColumn[]) {
  const years = new Map<string, number>()

  for (const column of columns) {
    const year = Number(column.title)
    if (!Number.isFinite(year)) continue

    for (const link of column.links) {
      years.set(catalogSlug(link.href), year)
    }
  }

  return years
}

function findProductId(
  gown: string,
  products: Array<{ id: string; name: string; slug: string }>
) {
  const exact = products.find(
    (item) => item.name.toLowerCase() === gown.toLowerCase()
  )
  if (exact) return exact.id

  const slug = slugify(gown)
  const bySlug = products.find((item) => item.slug === slug)
  if (bySlug) return bySlug.id

  const firstWord = gown.split(/\s+/)[0] ?? ""
  return (
    products.find((item) => item.name.toLowerCase() === firstWord.toLowerCase())
      ?.id ?? null
  )
}

async function upsertAttributeGroups() {
  const ids = new Map<string, string>()

  for (const def of ATTRIBUTE_GROUP_DEFS) {
    const columns =
      def.source === "bridal" ? viDict.nav.bridalColumns : viDict.nav.aodaiColumns
    const enColumns =
      def.source === "bridal" ? enDict.nav.bridalColumns : enDict.nav.aodaiColumns
    const viColumn = columns[def.columnIndex]
    const enColumn = enColumns[def.columnIndex]

    await db
      .insert(attributeGroup)
      .values({
        slug: def.slug,
        label: localized(viColumn.title, enColumn.title),
        selection: "single",
        kind: def.kind,
        sortOrder: def.sortOrder,
      })
      .onDuplicateKeyUpdate({
        set: {
          label: localized(viColumn.title, enColumn.title),
          selection: "single",
          kind: def.kind,
          sortOrder: def.sortOrder,
        },
      })

    const row = await requireIdBySlug(attributeGroup, def.slug)
    ids.set(def.slug, row.id)
  }

  return ids
}

async function upsertCatalogAttributes(groupIds: Map<string, string>) {
  const ids = new Map<string, string>()

  for (const def of ATTRIBUTE_GROUP_DEFS) {
    const groupId = groupIds.get(def.slug)
    if (!groupId) throw new Error(`Missing group ${def.slug}`)

    const columns =
      def.source === "bridal" ? viDict.nav.bridalColumns : viDict.nav.aodaiColumns
    const enColumns =
      def.source === "bridal" ? enDict.nav.bridalColumns : enDict.nav.aodaiColumns
    const viLinks = columns[def.columnIndex].links
    const enLinks = enColumns[def.columnIndex].links
    let sortOrder = 0

    for (const viLink of viLinks) {
      const slug = catalogSlug(viLink.href)
      if (VIRTUAL_ATTRIBUTE_SLUGS.has(slug)) continue

      sortOrder += 1
      const enLink = enLinks.find((link) => catalogSlug(link.href) === slug)
      const label = localized(viLink.label, enLink?.label ?? viLink.label)

      await db
        .insert(catalogAttribute)
        .values({
          groupId,
          slug,
          label,
          sortOrder,
        })
        .onDuplicateKeyUpdate({
          set: { groupId, label, sortOrder },
        })

      const row = await requireIdBySlug(catalogAttribute, slug)

      ids.set(slug, row.id)
    }
  }

  return ids
}

async function upsertCollections() {
  const years = collectionYearsFromNav(viDict.nav.collectionColumns)
  const ids = new Map<string, string>()
  const emptySeo = emptyLocalizedText()

  for (const [index, viItem] of viDict.home.collection.items.entries()) {
    const slug = catalogSlug(viItem.href)
    const enItem =
      enDict.home.collection.items.find((item) => item.href === viItem.href) ??
      viItem

    const values = {
      slug,
      year: years.get(slug) ?? 2026,
      name: localized(viItem.name, enItem.name),
      subtitle: localized(viItem.subtitle, enItem.subtitle),
      imageAlt: localized(viItem.imageAlt, enItem.imageAlt),
      coverUrl: viItem.image,
      status: "published" as const,
      publishedAt: new Date("2026-01-01T00:00:00+07:00"),
      sortOrder: index + 1,
      seoTitle: emptySeo,
      seoDescription: emptySeo,
      seoKeywords: emptySeo,
    }

    await db
      .insert(collection)
      .values(values)
      .onDuplicateKeyUpdate({
        set: {
          year: values.year,
          name: values.name,
          subtitle: values.subtitle,
          imageAlt: values.imageAlt,
          coverUrl: values.coverUrl,
          status: values.status,
          publishedAt: values.publishedAt,
          sortOrder: values.sortOrder,
        },
      })

    const row = await requireIdBySlug(collection, slug)
    ids.set(slug, row.id)

    await db
      .delete(collectionImage)
      .where(eq(collectionImage.collectionId, row.id))
    await db.insert(collectionImage).values({
      collectionId: row.id,
      url: viItem.image,
      sortOrder: 0,
    })
  }

  return ids
}

async function upsertProducts(
  collectionIds: Map<string, string>,
  attributeIds: Map<string, string>
) {
  const ids = new Map<string, string>()
  const emptySeo = emptyLocalizedText()
  const catalog = viDict.catalog as CatalogItem[]

  for (const item of catalog) {
    const parsed = parseCatalogName(item.name)
    const slug = productSlugFromName(item.name)
    const values = {
      slug,
      sortNumber: parsed.sortNumber,
      name: parsed.name,
      code: parsed.code,
      fullTitle: parsed.fullTitle,
      description: emptyLocalizedText(),
      priceVnd: null,
      priceDisplay: "contact" as const,
      kind: "gown" as const,
      featured: true,
      status: "published" as const,
      publishedAt: new Date("2026-01-01T00:00:00+07:00"),
      sortOrder: parsed.sortNumber,
      tags: [] as string[],
      seoTitle: emptySeo,
      seoDescription: emptySeo,
      seoKeywords: emptySeo,
    }

    await db
      .insert(product)
      .values(values)
      .onDuplicateKeyUpdate({
        set: {
          sortNumber: values.sortNumber,
          name: values.name,
          code: values.code,
          fullTitle: values.fullTitle,
          featured: values.featured,
          status: values.status,
          publishedAt: values.publishedAt,
          sortOrder: values.sortOrder,
          kind: values.kind,
        },
      })

    const row = await requireIdBySlug(product, slug)
    ids.set(slug, row.id)

    await db.delete(productImage).where(eq(productImage.productId, row.id))
    await db.insert(productImage).values({
      productId: row.id,
      url: item.image,
      sortOrder: 0,
    })

    await db
      .delete(productAttribute)
      .where(eq(productAttribute.productId, row.id))
    const attributeSlugs = [item.silhouette, item.neckline, item.fabric]
    const attributeRows = attributeSlugs.map((attributeSlug) => {
      const attributeId = attributeIds.get(attributeSlug)
      if (!attributeId) {
        throw new Error(`Unknown catalog attribute ${attributeSlug}`)
      }
      return { productId: row.id, attributeId }
    })
    await db.insert(productAttribute).values(attributeRows)

    await db
      .delete(productCollection)
      .where(eq(productCollection.productId, row.id))
    const collectionRows = item.collections.map((collectionSlug) => {
      const collectionId = collectionIds.get(collectionSlug)
      if (!collectionId) {
        throw new Error(`Unknown collection ${collectionSlug}`)
      }
      return { productId: row.id, collectionId }
    })
    await db.insert(productCollection).values(collectionRows)
  }

  return ids
}

async function upsertAoDaiProducts(
  collectionIds: Map<string, string>,
  attributeIds: Map<string, string>
) {
  const ids = new Map<string, string>()
  const emptySeo = emptyLocalizedText()
  const collectionSlugs = [...collectionIds.keys()]
  if (collectionSlugs.length === 0) {
    throw new Error("No collections available for ao dai seed")
  }

  for (const [index, name] of AO_DAI_NAMES.entries()) {
    const sortNumber = 200 + index
    const slug = `ao-dai-${name.toLowerCase()}`
    const code = `AD-${String(index + 1).padStart(3, "0")}`
    const fullTitle = AO_DAI_TITLES[index % AO_DAI_TITLES.length]
    const showPrice = index % 4 === 0
    const values = {
      slug,
      sortNumber,
      name,
      code,
      fullTitle,
      description: emptyLocalizedText(),
      priceVnd: showPrice ? (18 + (index % 12) * 2) * 1_000_000 : null,
      priceDisplay: showPrice ? ("amount" as const) : ("contact" as const),
      kind: "ao-dai" as const,
      featured: index < 4,
      status: "published" as const,
      publishedAt: new Date("2026-01-01T00:00:00+07:00"),
      sortOrder: sortNumber,
      tags: [] as string[],
      seoTitle: emptySeo,
      seoDescription: emptySeo,
      seoKeywords: emptySeo,
    }

    await db
      .insert(product)
      .values(values)
      .onDuplicateKeyUpdate({
        set: {
          sortNumber: values.sortNumber,
          name: values.name,
          code: values.code,
          fullTitle: values.fullTitle,
          priceVnd: values.priceVnd,
          priceDisplay: values.priceDisplay,
          featured: values.featured,
          status: values.status,
          publishedAt: values.publishedAt,
          sortOrder: values.sortOrder,
          kind: values.kind,
        },
      })

    const row = await requireIdBySlug(product, slug)
    ids.set(slug, row.id)

    const imageCount = 1 + (index % 3)
    const images = Array.from({ length: imageCount }, (_, imageIndex) => ({
      productId: row.id,
      url: AO_DAI_IMAGES[(index + imageIndex) % AO_DAI_IMAGES.length],
      sortOrder: imageIndex,
    }))

    await db.delete(productImage).where(eq(productImage.productId, row.id))
    await db.insert(productImage).values(images)

    const attributeSlugs = [
      AO_DAI_COLORS[index % AO_DAI_COLORS.length],
      AO_DAI_FABRICS[index % AO_DAI_FABRICS.length],
      AO_DAI_STYLES[index % AO_DAI_STYLES.length],
    ]
    const attributeRows = attributeSlugs.map((attributeSlug) => {
      const attributeId = attributeIds.get(attributeSlug)
      if (!attributeId) {
        throw new Error(`Unknown catalog attribute ${attributeSlug}`)
      }
      return { productId: row.id, attributeId }
    })

    await db
      .delete(productAttribute)
      .where(eq(productAttribute.productId, row.id))
    await db.insert(productAttribute).values(attributeRows)

    const collectionSlug = collectionSlugs[index % collectionSlugs.length]
    const collectionId = collectionIds.get(collectionSlug)
    if (!collectionId) {
      throw new Error(`Unknown collection ${collectionSlug}`)
    }

    await db
      .delete(productCollection)
      .where(eq(productCollection.productId, row.id))
    await db.insert(productCollection).values({
      productId: row.id,
      collectionId,
    })
  }

  return ids
}

async function upsertBlog() {
  const categoryIds = new Map<string, string>()

  for (const item of BLOG_CATEGORIES) {
    await db
      .insert(blogCategory)
      .values({
        slug: item.slug,
        label: item.label,
      })
      .onDuplicateKeyUpdate({
        set: { label: item.label },
      })

    const row = await requireIdBySlug(blogCategory, item.slug)
    categoryIds.set(item.slug, row.id)
  }

  const emptySeo = emptyLocalizedText()
  const viPosts = viDict.home.blog.posts as BlogItem[]
  const enPosts = enDict.home.blog.posts as BlogItem[]

  for (const viPost of viPosts) {
    const enPost = enPosts.find((post) => post.slug === viPost.slug)
    const categorySlug =
      LIVE_POST_CATEGORIES[viPost.slug] ?? BLOG_CATEGORY_BY_LABEL["Xu hướng"]
    const categoryId = categoryIds.get(categorySlug)
    if (!categoryId) throw new Error(`Missing blog category ${categorySlug}`)

    const values = {
      slug: viPost.slug,
      categoryId,
      title: localized(viPost.title, enPost?.title ?? ""),
      excerpt: localized(viPost.excerpt, enPost?.excerpt ?? ""),
      imageAlt: localized(viPost.imageAlt, enPost?.imageAlt ?? ""),
      content: emptyLocalizedText(),
      coverUrl: viPost.image,
      status: "published" as const,
      publishedAt: parseViDate(viPost.date),
      seoTitle: emptySeo,
      seoDescription: emptySeo,
      seoKeywords: emptySeo,
    }

    await db
      .insert(blogPost)
      .values(values)
      .onDuplicateKeyUpdate({
        set: {
          categoryId: values.categoryId,
          title: values.title,
          excerpt: values.excerpt,
          imageAlt: values.imageAlt,
          coverUrl: values.coverUrl,
          status: values.status,
          publishedAt: values.publishedAt,
        },
      })
  }

  for (const extra of EXTRA_POSTS) {
    const categoryId = categoryIds.get(extra.categorySlug)
    if (!categoryId) {
      throw new Error(`Missing blog category ${extra.categorySlug}`)
    }

    await db
      .insert(blogPost)
      .values({
        slug: extra.slug,
        categoryId,
        title: extra.title,
        excerpt: emptyLocalizedText(),
        imageAlt: emptyLocalizedText(),
        content: emptyLocalizedText(),
        coverUrl: extra.coverUrl,
        status: extra.status,
        publishedAt: extra.publishedAt,
        seoTitle: emptySeo,
        seoDescription: emptySeo,
        seoKeywords: emptySeo,
      })
      .onDuplicateKeyUpdate({
        set: {
          categoryId,
          title: extra.title,
          coverUrl: extra.coverUrl,
          status: extra.status,
          publishedAt: extra.publishedAt,
        },
      })
  }
}

async function upsertTestimonials(
  products: Array<{ id: string; name: string; slug: string }>
) {
  const viItems = viDict.home.testimonials.items as TestimonialItem[]
  const enItems = enDict.home.testimonials.items as TestimonialItem[]

  for (const [index, viItem] of viItems.entries()) {
    const enItem =
      enItems.find((item) => item.name === viItem.name) ?? enItems[index]
    const gown = metaValue(viItem, ["Váy", "Gown"])
    const yearValue = metaValue(viItem, ["Năm", "Year"])
    const year = yearValue ? Number(yearValue) : null

    await db
      .insert(testimonial)
      .values({
        slug: slugify(viItem.name),
        name: viItem.name,
        imageUrl: viItem.image,
        quote: localized(viItem.quote, enItem?.quote ?? ""),
        imageAlt: localized(viItem.imageAlt, enItem?.imageAlt ?? ""),
        gown,
        productId: findProductId(gown, products),
        year: Number.isFinite(year) ? year : null,
        status: "published",
        sortOrder: index + 1,
      })
      .onDuplicateKeyUpdate({
        set: {
          name: viItem.name,
          imageUrl: viItem.image,
          quote: localized(viItem.quote, enItem?.quote ?? ""),
          imageAlt: localized(viItem.imageAlt, enItem?.imageAlt ?? ""),
          gown,
          productId: findProductId(gown, products),
          year: Number.isFinite(year) ? year : null,
          status: "published",
          sortOrder: index + 1,
        },
      })
  }
}

async function upsertSettingsAndCopy() {
  await db
    .insert(siteSettings)
    .values({
      id: "default",
      data: normalizeSiteSettings(siteSettingsJson),
    })
    .onDuplicateKeyUpdate({
      set: { data: normalizeSiteSettings(siteSettingsJson) },
    })

  const viAbout = viDict.home.about as AboutCopy
  const enAbout = enDict.home.about as AboutCopy
  const viProduct = viDict.productPage
  const enProduct = enDict.productPage

  const copies: Array<{ key: string; value: unknown }> = [
    {
      key: "home.hero",
      value: {
        headline: localized(viDict.home.headline, enDict.home.headline),
        subhead: localized(viDict.home.subhead, enDict.home.subhead),
        description: localized(viDict.home.description, enDict.home.description),
        cta: localized(viDict.home.cta, enDict.home.cta),
        image_url: "/hero/bridal.webp",
        image_alt: localized(viDict.home.imageAlt, enDict.home.imageAlt),
      },
    },
    {
      key: "home.about",
      value: {
        label: localized(viAbout.label, enAbout.label),
        headline: localized(viAbout.headline, enAbout.headline),
        body: localized(viAbout.body, enAbout.body),
        steps: viAbout.steps.map((step, index) => ({
          number: step.number,
          title: localized(step.title, enAbout.steps[index]?.title ?? ""),
          body: localized(step.body, enAbout.steps[index]?.body ?? ""),
        })),
      },
    },
    {
      key: "home.collectionTitle",
      value: localized(viDict.home.collection.title, enDict.home.collection.title),
    },
    {
      key: "home.featuredTitle",
      value: localized(viDict.home.featured.title, enDict.home.featured.title),
    },
    {
      key: "home.testimonials",
      value: {
        label: localized(
          viDict.home.testimonials.label,
          enDict.home.testimonials.label
        ),
        title: localized(
          viDict.home.testimonials.title,
          enDict.home.testimonials.title
        ),
      },
    },
    {
      key: "home.blogTitle",
      value: localized(viDict.home.blog.title, enDict.home.blog.title),
    },
    {
      key: "product.care",
      value: {
        title: localized(viProduct.careTitle, enProduct.careTitle),
        body: localized(viProduct.care, enProduct.care),
      },
    },
    {
      key: "product.shipping",
      value: {
        title: localized(viProduct.shippingTitle, enProduct.shippingTitle),
        body: localized(viProduct.shipping, enProduct.shipping),
      },
    },
    {
      key: "product.madeToMeasure",
      value: {
        title: localized(
          viProduct.madeToMeasureTitle,
          enProduct.madeToMeasureTitle
        ),
        body: localized(viProduct.madeToMeasure, enProduct.madeToMeasure),
      },
    },
    {
      key: "product.lead",
      value: localized(viProduct.lead, enProduct.lead),
    },
    {
      key: "product.body",
      value: localized(viProduct.body, enProduct.body),
    },
  ]

  for (const item of copies) {
    await db
      .insert(siteCopy)
      .values(item)
      .onDuplicateKeyUpdate({
        set: { value: item.value },
      })
  }
}

async function seedStorefront() {
  const groupIds = await upsertAttributeGroups()
  const attributeIds = await upsertCatalogAttributes(groupIds)
  const collectionIds = await upsertCollections()
  const gownIds = await upsertProducts(collectionIds, attributeIds)
  const aoDaiIds = await upsertAoDaiProducts(collectionIds, attributeIds)
  const productIds = new Map([...gownIds, ...aoDaiIds])

  const products = [...productIds.entries()].map(([slug, id]) => {
    const item = (viDict.catalog as CatalogItem[]).find(
      (entry) => productSlugFromName(entry.name) === slug
    )
    return {
      id,
      slug,
      name: item ? parseCatalogName(item.name).name : slug,
    }
  })

  await upsertBlog()
  await upsertTestimonials(products)
  await upsertSettingsAndCopy()

  console.log(
    `Seeded storefront: ${attributeIds.size} attributes, ${collectionIds.size} collections, ${productIds.size} products (${aoDaiIds.size} ao dai)`
  )
}

seedStorefront()
  .then(async () => {
    await pool.end()
    process.exit(0)
  })
  .catch(async (error: unknown) => {
    console.error(
      error instanceof Error ? error.message : "Failed to seed storefront"
    )
    await pool.end().catch(() => undefined)
    process.exit(1)
  })
