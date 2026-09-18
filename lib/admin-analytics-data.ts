import "server-only"

import { connection } from "next/server"
import { and, count, desc, eq, gte } from "drizzle-orm"
import { countryLabelVi } from "@/lib/country-labels"
import { db } from "@/lib/db"
import { analyticsPageview, blogPost, product } from "@/lib/db/schema"
import type {
  AnalyticsOverview,
  AnalyticsRange,
  AnalyticsRankItem,
} from "@/lib/admin-analytics"

const TOP_LIMIT = 10

const DEVICE_LABELS: Record<string, string> = {
  mobile: "Điện thoại",
  desktop: "Máy tính",
  tablet: "Máy tính bảng",
}

function rangeStart(range: AnalyticsRange) {
  const now = new Date()
  if (range === "today") {
    return new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    )
  }
  const days = range === "7d" ? 7 : 30
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
}

function emptyOverview(range: AnalyticsRange): AnalyticsOverview {
  return {
    range,
    totalViews: 0,
    productViews: 0,
    postViews: 0,
    products: [],
    posts: [],
    countries: [],
    referrers: [],
    devices: [],
  }
}

export async function getAnalyticsOverview(
  range: AnalyticsRange
): Promise<AnalyticsOverview> {
  await connection()
  const start = rangeStart(range)
  const inRange = gte(analyticsPageview.createdAt, start)

  const [
    totalRow,
    productRow,
    postRow,
    productRanks,
    postRanks,
    countries,
    referrers,
    devices,
  ] = await Promise.all([
    db
      .select({ total: count() })
      .from(analyticsPageview)
      .where(inRange)
      .then((rows) => rows[0]),
    db
      .select({ total: count() })
      .from(analyticsPageview)
      .where(and(inRange, eq(analyticsPageview.entityType, "product")))
      .then((rows) => rows[0]),
    db
      .select({ total: count() })
      .from(analyticsPageview)
      .where(and(inRange, eq(analyticsPageview.entityType, "blog_post")))
      .then((rows) => rows[0]),
    db
      .select({
        entityId: analyticsPageview.entityId,
        views: count(),
        slug: product.slug,
        name: product.name,
      })
      .from(analyticsPageview)
      .leftJoin(product, eq(product.id, analyticsPageview.entityId))
      .where(and(inRange, eq(analyticsPageview.entityType, "product")))
      .groupBy(
        analyticsPageview.entityId,
        product.slug,
        product.name
      )
      .orderBy(desc(count()))
      .limit(TOP_LIMIT),
    db
      .select({
        entityId: analyticsPageview.entityId,
        views: count(),
        slug: blogPost.slug,
        title: blogPost.title,
      })
      .from(analyticsPageview)
      .leftJoin(blogPost, eq(blogPost.id, analyticsPageview.entityId))
      .where(and(inRange, eq(analyticsPageview.entityType, "blog_post")))
      .groupBy(analyticsPageview.entityId, blogPost.slug, blogPost.title)
      .orderBy(desc(count()))
      .limit(TOP_LIMIT),
    db
      .select({
        countryCode: analyticsPageview.countryCode,
        views: count(),
      })
      .from(analyticsPageview)
      .where(inRange)
      .groupBy(analyticsPageview.countryCode)
      .orderBy(desc(count()))
      .limit(TOP_LIMIT),
    db
      .select({
        referrerHost: analyticsPageview.referrerHost,
        views: count(),
      })
      .from(analyticsPageview)
      .where(inRange)
      .groupBy(analyticsPageview.referrerHost)
      .orderBy(desc(count()))
      .limit(TOP_LIMIT),
    db
      .select({
        deviceType: analyticsPageview.deviceType,
        views: count(),
      })
      .from(analyticsPageview)
      .where(inRange)
      .groupBy(analyticsPageview.deviceType)
      .orderBy(desc(count())),
  ])

  const totalViews = totalRow?.total ?? 0
  if (totalViews === 0) return emptyOverview(range)

  const products: AnalyticsRankItem[] = productRanks.map((row) => {
    const slug = row.slug
    return {
      key: row.entityId ?? slug ?? "deleted-product",
      label: row.name?.trim() || "Đã xóa",
      description: slug ?? "sản phẩm không còn trên site",
      href: slug ? `/admin/products/${slug}/edit` : undefined,
      views: row.views,
    }
  })

  const posts: AnalyticsRankItem[] = postRanks.map((row) => {
    const title =
      row.title && typeof row.title === "object" && "vi" in row.title
        ? String(row.title.vi || row.title.en || "").trim()
        : ""
    const slug = row.slug
    return {
      key: row.entityId ?? slug ?? "deleted-post",
      label: title || "Đã xóa",
      description: slug ?? "bài viết không còn trên site",
      href: slug ? `/admin/blog/${slug}/edit` : undefined,
      views: row.views,
    }
  })

  return {
    range,
    totalViews,
    productViews: productRow?.total ?? 0,
    postViews: postRow?.total ?? 0,
    products,
    posts,
    countries: countries.map((row) => ({
      key: row.countryCode,
      label: countryLabelVi(row.countryCode),
      description: row.countryCode,
      views: row.views,
    })),
    referrers: referrers.map((row) => ({
      key: row.referrerHost,
      label:
        row.referrerHost === "(direct)"
          ? "Truy cập trực tiếp"
          : row.referrerHost,
      views: row.views,
    })),
    devices: devices.map((row) => ({
      key: row.deviceType,
      label: DEVICE_LABELS[row.deviceType] ?? row.deviceType,
      views: row.views,
    })),
  }
}
