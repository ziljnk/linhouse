"use server"

import { count, eq, inArray, max } from "drizzle-orm"
import { randomUUID } from "node:crypto"
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
import { adminProductKindLabel } from "@/lib/admin-storefront"
import { requireUsableAdminSession } from "@/lib/admin-session"
import { db } from "@/lib/db"
import {
  attributeGroup,
  catalogAttribute,
  product,
  productAttribute,
  productKind,
} from "@/lib/db/schema"
import {
  catalogPathForKind,
  catalogSlugForKind,
  isBuiltinProductKind,
} from "@/lib/product-kinds"

export type AttributeGroupInput = {
  slug: string
  labelVi: string
  labelEn?: string
  selection: "single" | "multiple"
  kind?: string
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

async function groupAuditChanges(
  before: {
    slug: string
    labelVi: string
    labelEn: string
    selection: "single" | "multiple"
    kind: string
    sortOrder: number
  } | null,
  after: {
    slug: string
    labelVi: string
    labelEn: string
    selection: "single" | "multiple"
    kind: string
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
      before: before ? await adminProductKindLabel(before.kind) : "",
      after: await adminProductKindLabel(after.kind),
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

async function requireAttributeKind(slug: string) {
  const [row] = await db
    .select({ slug: productKind.slug })
    .from(productKind)
    .where(eq(productKind.slug, slug))
    .limit(1)
  if (!row) return actionFail("Loại sản phẩm không tồn tại.")
  return null
}

export async function createAttributeGroupAction(
  input: AttributeGroupInput
): Promise<ActionResult> {
  const session = await requireUsableAdminSession()
  if (!input.labelVi.trim()) return actionFail("Vui lòng nhập tên nhóm.")
  const slugResult = requireSlug(input.slug, "Slug nhóm")
  if (!slugResult.ok) return slugResult
  const kind = input.kind ?? "gown"
  const kindError = await requireAttributeKind(kind)
  if (kindError) return kindError

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
    kind,
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
    changes: await groupAuditChanges(null, next),
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
  const kind = input.kind ?? "gown"
  const kindError = await requireAttributeKind(kind)
  if (kindError) return kindError

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
    kind,
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
      changes: await groupAuditChanges(
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

export type ProductKindInput = {
  labelVi: string
  labelEn?: string
  slug: string
}

function parseProductKindInput(input: ProductKindInput) {
  if (!input.labelVi.trim()) return actionFail("Vui lòng nhập tên loại sản phẩm.")
  const slugResult = requireSlug(input.slug, "Đường dẫn")
  if (!slugResult.ok) return slugResult
  if (slugResult.slug.length > 64) return actionFail("Đường dẫn quá dài.")
  const catalogSlug = catalogSlugForKind(slugResult.slug)
  if (
    (catalogSlug === "all-gowns" && slugResult.slug !== "gown") ||
    (catalogSlug === "all-ao-dai" && slugResult.slug !== "ao-dai")
  ) {
    return actionFail("Đường dẫn này trùng trang váy cưới hoặc áo dài.")
  }
  return actionOk({
    slug: slugResult.slug,
    label: toLocalized(input.labelVi, input.labelEn),
    catalogSlug,
  })
}

export async function createProductKindAction(
  input: ProductKindInput
): Promise<ActionResult<{ slug: string }>> {
  const session = await requireUsableAdminSession()
  const parsed = parseProductKindInput(input)
  if (!parsed.ok) return parsed

  const [existing] = await db
    .select({ id: productKind.id })
    .from(productKind)
    .where(eq(productKind.slug, parsed.data.slug))
    .limit(1)
  if (existing) return actionFail("Đường dẫn loại sản phẩm đã tồn tại.")
  if (await isCatalogSlugTaken(parsed.data.catalogSlug)) {
    return actionFail("Đường dẫn đã dùng cho bộ sưu tập hoặc danh mục khác.")
  }

  const [last] = await db
    .select({ value: max(productKind.sortOrder) })
    .from(productKind)
  const name = parsed.data.label.vi || parsed.data.label.en
  await db.insert(productKind).values({
    id: randomUUID(),
    slug: parsed.data.slug,
    label: parsed.data.label,
    sortOrder: (last?.value ?? 0) + 1,
  })
  await recordAudit(session, {
    action: "create",
    area: "catalog",
    entityLabel: name,
    summary: `Tạo loại sản phẩm ${name}`,
    changes: diffFields([
      ...localizedChanges("Tên loại", null, parsed.data.label),
      { label: "Đường dẫn", before: "", after: parsed.data.slug },
    ]),
  })
  await revalidateAdmin(["/", catalogPathForKind(parsed.data.slug)])
  return actionOk({ slug: parsed.data.slug })
}

export async function updateProductKindAction(
  id: string,
  input: ProductKindInput
): Promise<ActionResult<{ slug: string }>> {
  const session = await requireUsableAdminSession()
  const parsed = parseProductKindInput(input)
  if (!parsed.ok) return parsed

  const [current] = await db
    .select()
    .from(productKind)
    .where(eq(productKind.id, id))
    .limit(1)
  if (!current) return actionFail("Không tìm thấy loại sản phẩm.")

  const nextSlug = isBuiltinProductKind(current.slug)
    ? current.slug
    : parsed.data.slug
  const catalogSlug = catalogSlugForKind(nextSlug)
  if (
    (catalogSlug === "all-gowns" && nextSlug !== "gown") ||
    (catalogSlug === "all-ao-dai" && nextSlug !== "ao-dai")
  ) {
    return actionFail("Đường dẫn này trùng trang váy cưới hoặc áo dài.")
  }

  const [existing] = await db
    .select({ id: productKind.id })
    .from(productKind)
    .where(eq(productKind.slug, nextSlug))
    .limit(1)
  if (existing && existing.id !== id) {
    return actionFail("Đường dẫn loại sản phẩm đã tồn tại.")
  }
  if (nextSlug !== current.slug && (await isCatalogSlugTaken(catalogSlug))) {
    return actionFail("Đường dẫn đã dùng cho bộ sưu tập hoặc danh mục khác.")
  }

  const name = parsed.data.label.vi || parsed.data.label.en
  await db.transaction(async (tx) => {
    await tx
      .update(productKind)
      .set({ slug: nextSlug, label: parsed.data.label })
      .where(eq(productKind.id, id))
    if (nextSlug !== current.slug) {
      await tx
        .update(product)
        .set({ kind: nextSlug })
        .where(eq(product.kind, current.slug))
      await tx
        .update(attributeGroup)
        .set({ kind: nextSlug })
        .where(eq(attributeGroup.kind, current.slug))
    }
  })
  await recordAudit(session, {
    action: "update",
    area: "catalog",
    entityLabel: name,
    summary: `Cập nhật loại sản phẩm ${name}`,
    changes: diffFields([
      ...localizedChanges("Tên loại", current.label, parsed.data.label),
      { label: "Đường dẫn", before: current.slug, after: nextSlug },
    ]),
  })
  await revalidateAdmin([
    "/",
    catalogPathForKind(current.slug),
    catalogPathForKind(nextSlug),
  ])
  return actionOk({ slug: nextSlug })
}

export async function deleteProductKindAction(id: string): Promise<ActionResult> {
  const session = await requireUsableAdminSession()
  const [current] = await db
    .select()
    .from(productKind)
    .where(eq(productKind.id, id))
    .limit(1)
  if (!current) return actionFail("Không tìm thấy loại sản phẩm.")

  const [total] = await db.select({ value: count() }).from(productKind)
  if (Number(total?.value ?? 0) <= 1) {
    return actionFail("Cần giữ ít nhất một loại sản phẩm.")
  }

  const [productsUsing] = await db
    .select({ value: count() })
    .from(product)
    .where(eq(product.kind, current.slug))
  if (Number(productsUsing?.value ?? 0) > 0) {
    return actionFail("Không xóa được loại đang có sản phẩm.")
  }

  const [groupsUsing] = await db
    .select({ value: count() })
    .from(attributeGroup)
    .where(eq(attributeGroup.kind, current.slug))
  if (Number(groupsUsing?.value ?? 0) > 0) {
    return actionFail("Hãy xóa các nhóm danh mục của loại này trước.")
  }

  await db.delete(productKind).where(eq(productKind.id, id))
  const name = current.label.vi || current.label.en || current.slug
  await recordAudit(session, {
    action: "delete",
    area: "catalog",
    entityLabel: name,
    summary: `Xóa loại sản phẩm ${name}`,
    changes: deletedChange(name),
  })
  await revalidateAdmin(["/", catalogPathForKind(current.slug)])
  return actionOk()
}
