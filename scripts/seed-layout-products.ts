import { desc, like, not } from "drizzle-orm"
import { db, pool } from "../lib/db/index"
import {
  product,
  productAttribute,
  productCollection,
  productImage,
} from "../lib/db/schema"

const CLONE_COUNT = 40
const LAYOUT_SLUG = "-layout-"

async function seedLayoutProducts() {
  await db.delete(product).where(like(product.slug, `%${LAYOUT_SLUG}%`))

  const sources = await db
    .select()
    .from(product)
    .where(not(like(product.slug, `%${LAYOUT_SLUG}%`)))
    .orderBy(product.sortNumber)

  if (sources.length === 0) {
    throw new Error("No source products to clone")
  }

  const [images, attributes, collections] = await Promise.all([
    db.select().from(productImage),
    db.select().from(productAttribute),
    db.select().from(productCollection),
  ])

  const imagesByProduct = Map.groupBy(images, (row) => row.productId)
  const attributesByProduct = Map.groupBy(attributes, (row) => row.productId)
  const collectionsByProduct = Map.groupBy(collections, (row) => row.productId)

  const [maxSort] = await db
    .select({ sortNumber: product.sortNumber })
    .from(product)
    .orderBy(desc(product.sortNumber))
    .limit(1)

  let sortNumber = (maxSort?.sortNumber ?? 0) + 1

  for (let index = 0; index < CLONE_COUNT; index += 1) {
    const source = sources[index % sources.length]
    const copy = Math.floor(index / sources.length) + 1
    const slug = `${source.slug}${LAYOUT_SLUG}${copy}`

    const [row] = await db
      .insert(product)
      .values({
        slug,
        sortNumber,
        name: `${source.name} ${copy}`,
        code: source.code ? `${source.code}-L${copy}` : `LAYOUT-${copy}`,
        description: source.description,
        priceVnd: source.priceVnd,
        priceDisplay: source.priceDisplay,
        featured: false,
        status: "published",
        publishedAt: source.publishedAt ?? new Date(),
        sortOrder: sortNumber,
        tags: source.tags,
        seoTitle: source.seoTitle,
        seoDescription: source.seoDescription,
        seoKeywords: source.seoKeywords,
      })
      .$returningId()

    if (!row) {
      throw new Error(`Failed to insert layout product ${slug}`)
    }

    const sourceImages = imagesByProduct.get(source.id) ?? []
    if (sourceImages.length > 0) {
      await db.insert(productImage).values(
        sourceImages.map((image) => ({
          productId: row.id,
          url: image.url,
          sortOrder: image.sortOrder,
        }))
      )
    }

    const sourceAttributes = attributesByProduct.get(source.id) ?? []
    if (sourceAttributes.length > 0) {
      await db.insert(productAttribute).values(
        sourceAttributes.map((item) => ({
          productId: row.id,
          attributeId: item.attributeId,
        }))
      )
    }

    const sourceCollections = collectionsByProduct.get(source.id) ?? []
    if (sourceCollections.length > 0) {
      await db.insert(productCollection).values(
        sourceCollections.map((item) => ({
          productId: row.id,
          collectionId: item.collectionId,
        }))
      )
    }

    sortNumber += 1
  }

  console.log(`Inserted ${CLONE_COUNT} layout products cloned from ${sources.length} existing products`)
}

seedLayoutProducts()
  .then(async () => {
    await pool.end()
    process.exit(0)
  })
  .catch(async (error: unknown) => {
    console.error(
      error instanceof Error ? error.message : "Failed to seed layout products"
    )
    await pool.end().catch(() => undefined)
    process.exit(1)
  })
