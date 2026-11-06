import { asc } from "drizzle-orm"
import { contentAppearance } from "@/lib/content-status"
import { db } from "@/lib/db"
import { homeProductCarouselItem, product, productImage, siteCopy } from "@/lib/db/schema"
import { decodeStoredPlainText } from "@/lib/sanitize-content"
import {
  HOME_PRODUCT_CAROUSEL_SLOTS,
  homeProductCarouselTitleKey,
  homeProductCarouselVersion,
  readHomeProductCarouselTitle,
  type HomeProductCarouselEditor,
  type HomeProductCarouselEditorData,
  type HomeProductCarouselSlot,
} from "@/lib/home-product-carousels"

function productLabel(name: string, code: string) {
  const title = decodeStoredPlainText(name).trim()
  const sku = decodeStoredPlainText(code).trim()
  return title || sku
}

export async function getHomeProductCarouselEditor(): Promise<HomeProductCarouselEditorData> {
  const [products, images, items, copyRows] = await Promise.all([
    db
      .select({
        id: product.id,
        name: product.name,
        code: product.code,
        status: product.status,
        publishedAt: product.publishedAt,
        slug: product.slug,
      })
      .from(product)
      .orderBy(asc(product.slug)),
    db
      .select({
        productId: productImage.productId,
        url: productImage.url,
        sortOrder: productImage.sortOrder,
      })
      .from(productImage)
      .orderBy(asc(productImage.sortOrder), asc(productImage.id)),
    db
      .select({
        slot: homeProductCarouselItem.slot,
        productId: homeProductCarouselItem.productId,
        sortOrder: homeProductCarouselItem.sortOrder,
      })
      .from(homeProductCarouselItem)
      .orderBy(
        asc(homeProductCarouselItem.slot),
        asc(homeProductCarouselItem.sortOrder),
        asc(homeProductCarouselItem.productId)
      ),
    db
      .select({ key: siteCopy.key, value: siteCopy.value })
      .from(siteCopy),
  ])

  const imageByProduct = new Map<string, string>()
  for (const image of images) {
    if (!imageByProduct.has(image.productId) && image.url.trim()) {
      imageByProduct.set(image.productId, image.url)
    }
  }

  const catalog = products.map((row) => ({
    id: row.id,
    name: productLabel(row.name, row.code),
    code: decodeStoredPlainText(row.code).trim(),
    appearance: contentAppearance(row.status, row.publishedAt),
    publishedAt: row.publishedAt?.toISOString() ?? null,
    imageUrl: imageByProduct.get(row.id) ?? "",
  }))
  const known = new Set(catalog.map((item) => item.id))
  const copy = Object.fromEntries(copyRows.map((row) => [row.key, row.value]))

  const carousels: HomeProductCarouselEditor[] = HOME_PRODUCT_CAROUSEL_SLOTS.map(
    (slot) => {
      const storedTitle = readHomeProductCarouselTitle(
        copy[homeProductCarouselTitleKey(slot)]
      )
      const title = {
        vi: decodeStoredPlainText(storedTitle.vi),
        en: decodeStoredPlainText(storedTitle.en),
      }
      const productIds = items
        .filter((item) => Number(item.slot) === slot && known.has(item.productId))
        .map((item) => item.productId)
      return {
        slot,
        titleVi: title.vi,
        titleEn: title.en,
        productIds,
        version: homeProductCarouselVersion({
          titleVi: title.vi,
          titleEn: title.en,
          ids: productIds,
        }),
      }
    }
  )

  return { products: catalog, carousels }
}

export function carouselSlotLabel(slot: HomeProductCarouselSlot) {
  return slot === 1 ? "Carousel sản phẩm 1" : "Carousel sản phẩm 2"
}
