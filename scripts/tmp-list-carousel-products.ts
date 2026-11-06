import { asc, eq } from "drizzle-orm"
import { db, pool } from "../lib/db/index"
import { homeProductCarouselItem, product, productImage, siteCopy } from "../lib/db/schema"

const rows = await db
  .select({
    id: product.id,
    name: product.name,
    status: product.status,
    slug: product.slug,
  })
  .from(product)
  .where(eq(product.status, "published"))
  .orderBy(asc(product.slug))
  .limit(12)

const images = await db
  .select({ productId: productImage.productId, url: productImage.url })
  .from(productImage)
  .orderBy(asc(productImage.sortOrder))

const withImage = rows.filter((row) =>
  images.some((image) => image.productId === row.id && image.url.trim())
)

console.log(
  JSON.stringify(
    withImage.map((row) => ({ id: row.id, name: row.name, slug: row.slug })),
    null,
    2
  )
)

const existing = await db.select().from(homeProductCarouselItem)
console.log("existing", existing.length)
const copy = await db
  .select()
  .from(siteCopy)
  .where(eq(siteCopy.key, "home.productCarousel.1.title"))
console.log("title rows", copy.length)

await pool.end()
