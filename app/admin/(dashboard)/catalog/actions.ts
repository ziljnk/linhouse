"use server"

import { count, eq, inArray } from "drizzle-orm"
import {
  actionFail,
  actionOk,
  assertNotVirtualSlug,
  isCatalogSlugTaken,
  revalidateAdmin,
  requireSlug,
  toLocalized,
  type ActionResult,
} from "@/lib/admin-actions"
import { requireUsableAdminSession } from "@/lib/admin-session"
import { db } from "@/lib/db"
import {
  attributeGroup,
  catalogAttribute,
  productAttribute,
} from "@/lib/db/schema"

export type AttributeGroupInput = {
  slug: string
  labelVi: string
  labelEn?: string
  selection: "single" | "multiple"
  kind?: "gown" | "ao-dai"
  sortOrder?: number
}

export type CatalogAttributeInput = {
  groupId: string
  slug: string
  labelVi: string
  labelEn?: string
  sortOrder?: number
}

const DEFAULT_SORT_ORDER = 99

export async function createAttributeGroupAction(
  input: AttributeGroupInput
): Promise<ActionResult> {
  await requireUsableAdminSession()
  if (!input.labelVi.trim()) return actionFail("Vui lòng nhập tên nhóm.")
  const slugResult = requireSlug(input.slug, "Slug nhóm")
  if (!slugResult.ok) return slugResult

  const [existing] = await db
    .select({ id: attributeGroup.id })
    .from(attributeGroup)
    .where(eq(attributeGroup.slug, slugResult.slug))
    .limit(1)
  if (existing) return actionFail("Slug nhóm đã tồn tại.")

  await db.insert(attributeGroup).values({
    slug: slugResult.slug,
    label: toLocalized(input.labelVi, input.labelEn),
    selection: input.selection,
    kind: input.kind ?? "gown",
    sortOrder: input.sortOrder ?? DEFAULT_SORT_ORDER,
  })
  await revalidateAdmin()
  return actionOk()
}

export async function updateAttributeGroupAction(
  id: string,
  input: AttributeGroupInput
): Promise<ActionResult> {
  await requireUsableAdminSession()
  if (!input.labelVi.trim()) return actionFail("Vui lòng nhập tên nhóm.")
  const slugResult = requireSlug(input.slug, "Slug nhóm")
  if (!slugResult.ok) return slugResult

  const [existing] = await db
    .select({ id: attributeGroup.id })
    .from(attributeGroup)
    .where(eq(attributeGroup.slug, slugResult.slug))
    .limit(1)
  if (existing && existing.id !== id) return actionFail("Slug nhóm đã tồn tại.")

  await db
    .update(attributeGroup)
    .set({
      slug: slugResult.slug,
      label: toLocalized(input.labelVi, input.labelEn),
      selection: input.selection,
      kind: input.kind ?? "gown",
      sortOrder: input.sortOrder ?? DEFAULT_SORT_ORDER,
    })
    .where(eq(attributeGroup.id, id))
  await revalidateAdmin()
  return actionOk()
}

export async function deleteAttributeGroupAction(id: string): Promise<ActionResult> {
  await requireUsableAdminSession()
  const attributes = await db
    .select({ id: catalogAttribute.id })
    .from(catalogAttribute)
    .where(eq(catalogAttribute.groupId, id))

  if (attributes.length) {
    const [usage] = await db
      .select({ value: count() })
      .from(productAttribute)
      .where(
        inArray(
          productAttribute.attributeId,
          attributes.map((item) => item.id)
        )
      )
    if (Number(usage?.value ?? 0) > 0) {
      return actionFail("Không xóa được nhóm đang gắn sản phẩm.")
    }
  }

  await db.delete(attributeGroup).where(eq(attributeGroup.id, id))
  await revalidateAdmin()
  return actionOk()
}

export async function createCatalogAttributeAction(
  input: CatalogAttributeInput
): Promise<ActionResult> {
  await requireUsableAdminSession()
  if (!input.labelVi.trim()) return actionFail("Vui lòng nhập tên danh mục.")
  const slugResult = requireSlug(input.slug)
  if (!slugResult.ok) return slugResult
  const virtual = assertNotVirtualSlug(slugResult.slug)
  if (virtual) return virtual
  if (await isCatalogSlugTaken(slugResult.slug)) {
    return actionFail("Đường dẫn đã dùng cho bộ sưu tập hoặc danh mục khác.")
  }

  await db.insert(catalogAttribute).values({
    groupId: input.groupId,
    slug: slugResult.slug,
    label: toLocalized(input.labelVi, input.labelEn),
    sortOrder: input.sortOrder ?? DEFAULT_SORT_ORDER,
  })
  await revalidateAdmin()
  return actionOk()
}

export async function updateCatalogAttributeAction(
  id: string,
  input: CatalogAttributeInput
): Promise<ActionResult> {
  await requireUsableAdminSession()
  if (!input.labelVi.trim()) return actionFail("Vui lòng nhập tên danh mục.")
  const slugResult = requireSlug(input.slug)
  if (!slugResult.ok) return slugResult
  const virtual = assertNotVirtualSlug(slugResult.slug)
  if (virtual) return virtual
  if (await isCatalogSlugTaken(slugResult.slug, { attributeId: id })) {
    return actionFail("Đường dẫn đã dùng cho bộ sưu tập hoặc danh mục khác.")
  }

  await db
    .update(catalogAttribute)
    .set({
      groupId: input.groupId,
      slug: slugResult.slug,
      label: toLocalized(input.labelVi, input.labelEn),
      sortOrder: input.sortOrder ?? DEFAULT_SORT_ORDER,
    })
    .where(eq(catalogAttribute.id, id))
  await revalidateAdmin()
  return actionOk()
}

export async function deleteCatalogAttributeAction(
  id: string
): Promise<ActionResult> {
  await requireUsableAdminSession()
  const [usage] = await db
    .select({ value: count() })
    .from(productAttribute)
    .where(eq(productAttribute.attributeId, id))

  if (Number(usage?.value ?? 0) > 0) {
    return actionFail("Không xóa được danh mục đang gắn sản phẩm.")
  }

  await db.delete(catalogAttribute).where(eq(catalogAttribute.id, id))
  await revalidateAdmin()
  return actionOk()
}
