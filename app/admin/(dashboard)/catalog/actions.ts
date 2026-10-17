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
import { recordAudit } from "@/lib/admin-audit"
import {
  deletedChange,
  diffFields,
  localizedChanges,
} from "@/lib/admin-audit-shared"
import { PRODUCT_KIND_LABELS } from "@/lib/admin-products"
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

function catalogAttributeStorefrontPaths(slugs: Array<string | undefined>) {
  return [
    "/",
    ...slugs
      .filter((slug): slug is string => Boolean(slug))
      .map((slug) => `/catalog/${slug}`),
  ]
}

const SELECTION_LABELS = {
  single: "Chọn một",
  multiple: "Chọn nhiều",
} as const

function groupAuditChanges(
  before: {
    slug: string
    labelVi: string
    labelEn: string
    selection: "single" | "multiple"
    kind: "gown" | "ao-dai"
    sortOrder: number
  } | null,
  after: {
    slug: string
    labelVi: string
    labelEn: string
    selection: "single" | "multiple"
    kind: "gown" | "ao-dai"
    sortOrder: number
  }
) {
  return diffFields([
    { label: "Đường dẫn", before: before?.slug ?? "", after: after.slug },
    ...localizedChanges(
      "Tên nhóm",
      before ? { vi: before.labelVi, en: before.labelEn } : null,
      { vi: after.labelVi, en: after.labelEn }
    ),
    {
      label: "Cách chọn",
      before: before ? SELECTION_LABELS[before.selection] : "",
      after: SELECTION_LABELS[after.selection],
    },
    {
      label: "Loại",
      before: before ? PRODUCT_KIND_LABELS[before.kind] : "",
      after: PRODUCT_KIND_LABELS[after.kind],
    },
    { label: "Thứ tự", before: before?.sortOrder ?? "", after: after.sortOrder },
  ])
}

function attributeAuditChanges(
  before: {
    groupLabel: string
    slug: string
    labelVi: string
    labelEn: string
    sortOrder: number
  } | null,
  after: {
    groupLabel: string
    slug: string
    labelVi: string
    labelEn: string
    sortOrder: number
  }
) {
  return diffFields([
    { label: "Nhóm", before: before?.groupLabel ?? "", after: after.groupLabel },
    { label: "Đường dẫn", before: before?.slug ?? "", after: after.slug },
    ...localizedChanges(
      "Tên danh mục",
      before ? { vi: before.labelVi, en: before.labelEn } : null,
      { vi: after.labelVi, en: after.labelEn }
    ),
    { label: "Thứ tự", before: before?.sortOrder ?? "", after: after.sortOrder },
  ])
}

async function groupLabel(id: string) {
  const [row] = await db
    .select({ label: attributeGroup.label })
    .from(attributeGroup)
    .where(eq(attributeGroup.id, id))
    .limit(1)
  return row?.label.vi || row?.label.en || ""
}

export async function createAttributeGroupAction(
  input: AttributeGroupInput
): Promise<ActionResult> {
  const session = await requireUsableAdminSession()
  if (!input.labelVi.trim()) return actionFail("Vui lòng nhập tên nhóm.")
  const slugResult = requireSlug(input.slug, "Slug nhóm")
  if (!slugResult.ok) return slugResult

  const [existing] = await db
    .select({ id: attributeGroup.id })
    .from(attributeGroup)
    .where(eq(attributeGroup.slug, slugResult.slug))
    .limit(1)
  if (existing) return actionFail("Slug nhóm đã tồn tại.")

  const next = {
    slug: slugResult.slug,
    labelVi: input.labelVi.trim(),
    labelEn: input.labelEn?.trim() ?? "",
    selection: input.selection,
    kind: input.kind ?? "gown",
    sortOrder: input.sortOrder ?? DEFAULT_SORT_ORDER,
  }
  await db.insert(attributeGroup).values({
    slug: next.slug,
    label: toLocalized(next.labelVi, next.labelEn),
    selection: next.selection,
    kind: next.kind,
    sortOrder: next.sortOrder,
  })
  await recordAudit(session, {
    action: "create",
    area: "catalog",
    entityLabel: next.labelVi,
    summary: `Tạo nhóm danh mục ${next.labelVi}`,
    changes: groupAuditChanges(null, next),
  })
  await revalidateAdmin(["/"])
  return actionOk()
}

export async function updateAttributeGroupAction(
  id: string,
  input: AttributeGroupInput
): Promise<ActionResult> {
  const session = await requireUsableAdminSession()
  if (!input.labelVi.trim()) return actionFail("Vui lòng nhập tên nhóm.")
  const slugResult = requireSlug(input.slug, "Slug nhóm")
  if (!slugResult.ok) return slugResult

  const [existing] = await db
    .select({ id: attributeGroup.id })
    .from(attributeGroup)
    .where(eq(attributeGroup.slug, slugResult.slug))
    .limit(1)
  if (existing && existing.id !== id) return actionFail("Slug nhóm đã tồn tại.")

  const [current] = await db
    .select()
    .from(attributeGroup)
    .where(eq(attributeGroup.id, id))
    .limit(1)

  const next = {
    slug: slugResult.slug,
    labelVi: input.labelVi.trim(),
    labelEn: input.labelEn?.trim() ?? "",
    selection: input.selection,
    kind: input.kind ?? "gown",
    sortOrder: input.sortOrder ?? DEFAULT_SORT_ORDER,
  }
  await db
    .update(attributeGroup)
    .set({
      slug: next.slug,
      label: toLocalized(next.labelVi, next.labelEn),
      selection: next.selection,
      kind: next.kind,
      sortOrder: next.sortOrder,
    })
    .where(eq(attributeGroup.id, id))
  if (current) {
    await recordAudit(session, {
      action: "update",
      area: "catalog",
      entityLabel: next.labelVi,
      summary: `Cập nhật nhóm danh mục ${next.labelVi}`,
      changes: groupAuditChanges(
        {
          slug: current.slug,
          labelVi: current.label.vi,
          labelEn: current.label.en,
          selection: current.selection,
          kind: current.kind,
          sortOrder: current.sortOrder,
        },
        next
      ),
    })
  }
  await revalidateAdmin(["/"])
  return actionOk()
}

export async function deleteAttributeGroupAction(id: string): Promise<ActionResult> {
  const session = await requireUsableAdminSession()
  const [group] = await db
    .select({ label: attributeGroup.label })
    .from(attributeGroup)
    .where(eq(attributeGroup.id, id))
    .limit(1)
  const attributes = await db
    .select({ id: catalogAttribute.id, slug: catalogAttribute.slug })
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
  const name = group?.label.vi || group?.label.en || ""
  await recordAudit(session, {
    action: "delete",
    area: "catalog",
    entityLabel: name,
    summary: `Xóa nhóm danh mục ${name}`,
    changes: deletedChange(name),
  })
  await revalidateAdmin(
    catalogAttributeStorefrontPaths(attributes.map((item) => item.slug))
  )
  return actionOk()
}

export async function createCatalogAttributeAction(
  input: CatalogAttributeInput
): Promise<ActionResult> {
  const session = await requireUsableAdminSession()
  if (!input.labelVi.trim()) return actionFail("Vui lòng nhập tên danh mục.")
  const slugResult = requireSlug(input.slug)
  if (!slugResult.ok) return slugResult
  const virtual = assertNotVirtualSlug(slugResult.slug)
  if (virtual) return virtual
  if (await isCatalogSlugTaken(slugResult.slug)) {
    return actionFail("Đường dẫn đã dùng cho bộ sưu tập hoặc danh mục khác.")
  }

  const next = {
    slug: slugResult.slug,
    labelVi: input.labelVi.trim(),
    labelEn: input.labelEn?.trim() ?? "",
    sortOrder: input.sortOrder ?? DEFAULT_SORT_ORDER,
  }
  await db.insert(catalogAttribute).values({
    groupId: input.groupId,
    slug: next.slug,
    label: toLocalized(next.labelVi, next.labelEn),
    sortOrder: next.sortOrder,
  })
  await recordAudit(session, async () => ({
    action: "create",
    area: "catalog",
    entityLabel: next.labelVi,
    summary: `Tạo danh mục ${next.labelVi}`,
    changes: attributeAuditChanges(null, {
      ...next,
      groupLabel: await groupLabel(input.groupId),
    }),
  }))
  await revalidateAdmin(catalogAttributeStorefrontPaths([slugResult.slug]))
  return actionOk()
}

export async function updateCatalogAttributeAction(
  id: string,
  input: CatalogAttributeInput
): Promise<ActionResult> {
  const session = await requireUsableAdminSession()
  if (!input.labelVi.trim()) return actionFail("Vui lòng nhập tên danh mục.")
  const slugResult = requireSlug(input.slug)
  if (!slugResult.ok) return slugResult
  const virtual = assertNotVirtualSlug(slugResult.slug)
  if (virtual) return virtual
  if (await isCatalogSlugTaken(slugResult.slug, { attributeId: id })) {
    return actionFail("Đường dẫn đã dùng cho bộ sưu tập hoặc danh mục khác.")
  }

  const [current] = await db
    .select({
      slug: catalogAttribute.slug,
      label: catalogAttribute.label,
      groupId: catalogAttribute.groupId,
      sortOrder: catalogAttribute.sortOrder,
    })
    .from(catalogAttribute)
    .where(eq(catalogAttribute.id, id))
    .limit(1)

  const next = {
    slug: slugResult.slug,
    labelVi: input.labelVi.trim(),
    labelEn: input.labelEn?.trim() ?? "",
    sortOrder: input.sortOrder ?? DEFAULT_SORT_ORDER,
  }
  await db
    .update(catalogAttribute)
    .set({
      groupId: input.groupId,
      slug: next.slug,
      label: toLocalized(next.labelVi, next.labelEn),
      sortOrder: next.sortOrder,
    })
    .where(eq(catalogAttribute.id, id))
  if (current) {
    await recordAudit(session, async () => ({
      action: "update",
      area: "catalog",
      entityLabel: next.labelVi,
      summary: `Cập nhật danh mục ${next.labelVi}`,
      changes: attributeAuditChanges(
        {
          groupLabel: await groupLabel(current.groupId),
          slug: current.slug,
          labelVi: current.label.vi,
          labelEn: current.label.en,
          sortOrder: current.sortOrder,
        },
        {
          ...next,
          groupLabel: await groupLabel(input.groupId),
        }
      ),
    }))
  }
  await revalidateAdmin(
    catalogAttributeStorefrontPaths([current?.slug, slugResult.slug])
  )
  return actionOk()
}

export async function deleteCatalogAttributeAction(
  id: string
): Promise<ActionResult> {
  const session = await requireUsableAdminSession()
  const [usage] = await db
    .select({ value: count() })
    .from(productAttribute)
    .where(eq(productAttribute.attributeId, id))

  if (Number(usage?.value ?? 0) > 0) {
    return actionFail("Không xóa được danh mục đang gắn sản phẩm.")
  }

  const [row] = await db
    .select({ slug: catalogAttribute.slug, label: catalogAttribute.label })
    .from(catalogAttribute)
    .where(eq(catalogAttribute.id, id))
    .limit(1)

  await db.delete(catalogAttribute).where(eq(catalogAttribute.id, id))
  const name = row?.label.vi || row?.label.en || row?.slug || ""
  await recordAudit(session, {
    action: "delete",
    area: "catalog",
    entityLabel: name,
    summary: `Xóa danh mục ${name}`,
    changes: deletedChange(name),
  })
  await revalidateAdmin(catalogAttributeStorefrontPaths([row?.slug]))
  return actionOk()
}
