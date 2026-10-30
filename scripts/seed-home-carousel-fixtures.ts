import { eq } from "drizzle-orm"
import { encodeMysqlUrl } from "../lib/db/mysql-url.mjs"
import { db, pool } from "../lib/db/index"
import { collection, collectionImage, emptyLocalizedText } from "../lib/db/schema"

/**
 * Dev-only fixtures for the homepage carousel admin.
 * Refuses any DATABASE_URL that is not on localhost.
 * Does not turn collections on for the carousel (showOnHome stays untouched).
 */
const FIXTURES = [
  {
    slug: "qa-carousel-published",
    nameVi: "QA Đã đăng",
    nameEn: "QA Published",
    subtitleVi: "Bộ sưu tập đã đăng, có ảnh bìa.",
    status: "published" as const,
    publishedAt: new Date("2026-01-15T00:00:00+07:00"),
    coverUrl:
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "qa-carousel-published-alt",
    nameVi: "QA Đã đăng 2",
    nameEn: "QA Published 2",
    subtitleVi: "Bộ sưu tập đã đăng thứ hai, có ảnh bìa.",
    status: "published" as const,
    publishedAt: new Date("2026-03-01T00:00:00+07:00"),
    coverUrl:
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "qa-carousel-draft",
    nameVi: "QA Bản nháp",
    nameEn: "QA Draft",
    subtitleVi: "Bản nháp có ảnh bìa. Không hiện trên website.",
    status: "draft" as const,
    publishedAt: null,
    coverUrl:
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "qa-carousel-scheduled",
    nameVi: "QA Hẹn lịch",
    nameEn: "QA Scheduled",
    subtitleVi: "Đã hẹn giờ đăng, có ảnh bìa.",
    status: "published" as const,
    publishedAt: new Date("2027-06-01T02:00:00+07:00"),
    coverUrl:
      "https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "qa-carousel-no-cover",
    nameVi: "QA Thiếu ảnh bìa",
    nameEn: "QA Missing cover",
    subtitleVi: "Đã đăng nhưng không có ảnh bìa.",
    status: "published" as const,
    publishedAt: new Date("2026-02-01T00:00:00+07:00"),
    coverUrl: "",
  },
]

function assertLocalDatabase() {
  const raw = process.env.DATABASE_URL
  if (!raw) throw new Error("DATABASE_URL is missing")
  const hostname = new URL(encodeMysqlUrl(raw)).hostname.toLowerCase()
  if (hostname !== "localhost" && hostname !== "127.0.0.1" && hostname !== "::1") {
    throw new Error(
      "seed-home-carousel-fixtures only runs against a local MySQL host"
    )
  }
}

async function seedHomeCarouselFixtures() {
  assertLocalDatabase()
  const emptySeo = emptyLocalizedText()

  for (const [index, fixture] of FIXTURES.entries()) {
    const values = {
      slug: fixture.slug,
      year: 2026,
      name: { vi: fixture.nameVi, en: fixture.nameEn },
      subtitle: { vi: fixture.subtitleVi, en: fixture.subtitleVi },
      imageAlt: { vi: fixture.nameVi, en: fixture.nameEn },
      coverUrl: fixture.coverUrl,
      status: fixture.status,
      publishedAt: fixture.publishedAt,
      sortOrder: 200 + index,
      seoTitle: emptySeo,
      seoDescription: emptySeo,
      seoKeywords: emptySeo,
    }

    await db
      .insert(collection)
      .values(values)
      .onDuplicateKeyUpdate({
        set: {
          name: values.name,
          subtitle: values.subtitle,
          imageAlt: values.imageAlt,
          coverUrl: values.coverUrl,
          status: values.status,
          publishedAt: values.publishedAt,
          sortOrder: values.sortOrder,
        },
      })

    const [row] = await db
      .select({ id: collection.id })
      .from(collection)
      .where(eq(collection.slug, fixture.slug))
      .limit(1)
    if (!row) throw new Error(`Failed to upsert ${fixture.slug}`)

    await db
      .delete(collectionImage)
      .where(eq(collectionImage.collectionId, row.id))
    if (fixture.coverUrl) {
      await db.insert(collectionImage).values({
        collectionId: row.id,
        url: fixture.coverUrl,
        sortOrder: 0,
      })
    }
  }

  console.log(
    `Seeded ${FIXTURES.length} homepage carousel fixtures (showOnHome left unchanged)`
  )
}

seedHomeCarouselFixtures()
  .then(async () => {
    await pool.end()
    process.exit(0)
  })
  .catch(async (error: unknown) => {
    console.error(
      error instanceof Error ? error.message : "Failed to seed carousel fixtures"
    )
    await pool.end().catch(() => undefined)
    process.exit(1)
  })
