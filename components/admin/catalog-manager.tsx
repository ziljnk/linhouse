"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Plus, Trash2 } from "lucide-react"
import {
  createAttributeGroupAction,
  createCatalogAttributeAction,
  deleteAttributeGroupAction,
  deleteCatalogAttributeAction,
  updateAttributeGroupAction,
  updateCatalogAttributeAction,
} from "@/app/admin/(dashboard)/catalog/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AdminAttributeGroupOption } from "@/lib/admin-storefront"
import {
  PRODUCT_KIND_LABELS,
  PRODUCT_KINDS,
  type ProductKind,
} from "@/lib/admin-products"
import { toastError, toastSuccess } from "@/lib/admin-toast"

const SELECTION_OPTIONS = [
  { value: "single", label: "Chọn một" },
  { value: "multiple", label: "Chọn nhiều" },
]

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("đ", "d")
    .replaceAll("Đ", "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

type GroupDraft = {
  id?: string
  slug: string
  labelVi: string
  labelEn: string
  selection: "single" | "multiple"
  kind: ProductKind
  sortOrder: string
}

type AttributeDraft = {
  id?: string
  groupId: string
  slug: string
  labelVi: string
  labelEn: string
  sortOrder: string
}

const EMPTY_COPY: Record<ProductKind, string> = {
  gown: "Chưa có nhóm danh mục váy cưới. Thêm nhóm như Dáng váy, Kiểu cổ, Chất liệu.",
  "ao-dai":
    "Chưa có nhóm danh mục áo dài. Thêm nhóm như Màu sắc, Chất liệu, Kiểu dáng.",
}

const emptyGroup = (kind: ProductKind): GroupDraft => ({
  slug: "",
  labelVi: "",
  labelEn: "",
  selection: "single",
  kind,
  sortOrder: "99",
})

function CatalogGroupCard({
  group,
  onAddAttribute,
  onEditGroup,
  onDeleteGroup,
  onEditAttribute,
  onDeleteAttribute,
}: {
  group: AdminAttributeGroupOption
  onAddAttribute: () => void
  onEditGroup: () => void
  onDeleteGroup: () => void
  onEditAttribute: (attribute: AdminAttributeGroupOption["attributes"][number]) => void
  onDeleteAttribute: (id: string) => void
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{group.label}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {group.slug} · {group.selection === "single" ? "Chọn một" : "Chọn nhiều"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onAddAttribute}>
            <Plus />
            Thêm danh mục
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={`Sửa ${group.label}`}
            onClick={onEditGroup}
          >
            <Pencil />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={`Xóa ${group.label}`}
            onClick={onDeleteGroup}
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      {group.attributes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có danh mục trong nhóm này.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {group.attributes.map((attribute) => (
            <li
              key={attribute.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{attribute.label}</p>
                <p className="text-xs text-muted-foreground">{attribute.slug}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Sửa ${attribute.label}`}
                  onClick={() => onEditAttribute(attribute)}
                >
                  <Pencil />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Xóa ${attribute.label}`}
                  onClick={() => onDeleteAttribute(attribute.id)}
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function emptyAttribute(groupId: string): AttributeDraft {
  return {
    groupId,
    slug: "",
    labelVi: "",
    labelEn: "",
    sortOrder: "99",
  }
}

export function CatalogManager({
  groups: initialGroups,
}: {
  groups: AdminAttributeGroupOption[]
}) {
  const router = useRouter()
  const [groups, setGroups] = useState(initialGroups)
  const [groupDraft, setGroupDraft] = useState<GroupDraft | null>(null)
  const [attributeDraft, setAttributeDraft] = useState<AttributeDraft | null>(null)
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null)
  const [deleteAttributeId, setDeleteAttributeId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [slugTouched, setSlugTouched] = useState(false)
  const [kindTab, setKindTab] = useState<ProductKind>("gown")

  useEffect(() => {
    setGroups(initialGroups)
  }, [initialGroups])

  const closeDialogs = () => {
    setGroupDraft(null)
    setAttributeDraft(null)
    setDeleteGroupId(null)
    setDeleteAttributeId(null)
    setError(null)
    setSlugTouched(false)
  }

  const saveGroup = async () => {
    if (!groupDraft) return
    setPending(true)
    setError(null)
    const payload = {
      slug: groupDraft.slug,
      labelVi: groupDraft.labelVi,
      labelEn: groupDraft.labelEn,
      selection: groupDraft.selection,
      kind: groupDraft.kind,
      sortOrder: Number(groupDraft.sortOrder) || 0,
    }
    const result = groupDraft.id
      ? await updateAttributeGroupAction(groupDraft.id, payload)
      : await createAttributeGroupAction(payload)
    setPending(false)
    if (!result.ok) {
      setError(result.error)
      toastError(result.error)
      return
    }
    toastSuccess(groupDraft.id ? "Đã lưu nhóm danh mục." : "Đã thêm nhóm danh mục.")
    closeDialogs()
    router.refresh()
  }

  const saveAttribute = async () => {
    if (!attributeDraft) return
    setPending(true)
    setError(null)
    const payload = {
      groupId: attributeDraft.groupId,
      slug: attributeDraft.slug,
      labelVi: attributeDraft.labelVi,
      labelEn: attributeDraft.labelEn,
      sortOrder: Number(attributeDraft.sortOrder) || 0,
    }
    const result = attributeDraft.id
      ? await updateCatalogAttributeAction(attributeDraft.id, payload)
      : await createCatalogAttributeAction(payload)
    setPending(false)
    if (!result.ok) {
      setError(result.error)
      toastError(result.error)
      return
    }
    toastSuccess(attributeDraft.id ? "Đã lưu danh mục." : "Đã thêm danh mục.")
    closeDialogs()
    router.refresh()
  }

  const confirmDeleteGroup = async () => {
    if (!deleteGroupId) return
    setPending(true)
    setError(null)
    const result = await deleteAttributeGroupAction(deleteGroupId)
    setPending(false)
    if (!result.ok) {
      setError(result.error)
      toastError(result.error)
      return
    }
    toastSuccess("Đã xóa nhóm danh mục.")
    closeDialogs()
    router.refresh()
  }

  const confirmDeleteAttribute = async () => {
    if (!deleteAttributeId) return
    setPending(true)
    setError(null)
    const result = await deleteCatalogAttributeAction(deleteAttributeId)
    setPending(false)
    if (!result.ok) {
      setError(result.error)
      toastError(result.error)
      return
    }
    toastSuccess("Đã xóa danh mục.")
    closeDialogs()
    router.refresh()
  }

  const groupsForKind = (kind: ProductKind) =>
    groups.filter((group) => group.kind === kind)

  const openNewGroup = (kind: ProductKind) => {
    setSlugTouched(false)
    setGroupDraft(emptyGroup(kind))
  }

  return (
    <div className="flex flex-col gap-6">
      <Tabs
        value={kindTab}
        onValueChange={(value) => {
          if (value === "gown" || value === "ao-dai") setKindTab(value)
        }}
        className="gap-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="grid w-full grid-cols-2 sm:w-auto">
            {PRODUCT_KINDS.map((kind) => (
              <TabsTrigger key={kind} value={kind} className="px-4">
                {PRODUCT_KIND_LABELS[kind]}
                <span className="text-muted-foreground">
                  ({groupsForKind(kind).length})
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          <Button type="button" onClick={() => openNewGroup(kindTab)}>
            <Plus />
            Thêm nhóm
          </Button>
        </div>

        {PRODUCT_KINDS.map((kind) => {
          const kindGroups = groupsForKind(kind)

          return (
            <TabsContent key={kind} value={kind} className="flex flex-col gap-6">
              {kindGroups.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                  {EMPTY_COPY[kind]}
                </div>
              ) : (
                kindGroups.map((group) => (
                  <CatalogGroupCard
                    key={group.id}
                    group={group}
                    onAddAttribute={() => {
                      setSlugTouched(true)
                      setAttributeDraft(emptyAttribute(group.id))
                    }}
                    onEditGroup={() => {
                      setSlugTouched(true)
                      setGroupDraft({
                        id: group.id,
                        slug: group.slug,
                        labelVi: group.labelVi,
                        labelEn: group.labelEn,
                        selection: group.selection,
                        kind: group.kind,
                        sortOrder: String(group.sortOrder),
                      })
                    }}
                    onDeleteGroup={() => setDeleteGroupId(group.id)}
                    onEditAttribute={(attribute) => {
                      setSlugTouched(true)
                      setAttributeDraft({
                        id: attribute.id,
                        groupId: group.id,
                        slug: attribute.slug,
                        labelVi: attribute.labelVi,
                        labelEn: attribute.labelEn,
                        sortOrder: String(attribute.sortOrder),
                      })
                    }}
                    onDeleteAttribute={setDeleteAttributeId}
                  />
                ))
              )}
            </TabsContent>
          )
        })}
      </Tabs>

      <Dialog
        open={groupDraft !== null}
        onOpenChange={(open) => {
          if (!open) closeDialogs()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {groupDraft?.id ? "Sửa nhóm danh mục" : "Thêm nhóm danh mục"}
            </DialogTitle>
            <DialogDescription>
              Nhóm bộ lọc cho{" "}
              {groupDraft
                ? PRODUCT_KIND_LABELS[groupDraft.kind].toLowerCase()
                : "sản phẩm"}
              .
            </DialogDescription>
          </DialogHeader>
          {groupDraft ? (
            <div className="grid gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="group-label-vi">Tên tiếng Việt</Label>
                <Input
                  id="group-label-vi"
                  value={groupDraft.labelVi}
                  onChange={(event) => {
                    const labelVi = event.target.value
                    setGroupDraft({
                      ...groupDraft,
                      labelVi,
                      slug: slugTouched ? groupDraft.slug : slugify(labelVi),
                    })
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="group-label-en">Tên tiếng Anh</Label>
                <Input
                  id="group-label-en"
                  value={groupDraft.labelEn}
                  onChange={(event) =>
                    setGroupDraft({ ...groupDraft, labelEn: event.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="group-slug">Slug</Label>
                <Input
                  id="group-slug"
                  value={groupDraft.slug}
                  onChange={(event) => {
                    setSlugTouched(true)
                    setGroupDraft({ ...groupDraft, slug: slugify(event.target.value) })
                  }}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="group-selection">Cách chọn</Label>
                  <Select
                    id="group-selection"
                    value={groupDraft.selection}
                    onValueChange={(value) => {
                      if (value === "single" || value === "multiple") {
                        setGroupDraft({ ...groupDraft, selection: value })
                      }
                    }}
                    items={SELECTION_OPTIONS}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SELECTION_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          label={option.label}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="group-sort">Thứ tự</Label>
                  <Input
                    id="group-sort"
                    inputMode="numeric"
                    value={groupDraft.sortOrder}
                    onChange={(event) =>
                      setGroupDraft({
                        ...groupDraft,
                        sortOrder: event.target.value.replace(/[^\d]/g, ""),
                      })
                    }
                  />
                </div>
              </div>
            </div>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialogs}>
              Hủy
            </Button>
            <Button type="button" disabled={pending} onClick={() => void saveGroup()}>
              {pending ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={attributeDraft !== null}
        onOpenChange={(open) => {
          if (!open) closeDialogs()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {attributeDraft?.id ? "Sửa danh mục" : "Thêm danh mục"}
            </DialogTitle>
            <DialogDescription>
              Slug không được trùng bộ sưu tập hoặc danh mục khác, và không dùng
              all-gowns / all-ao-dai.
            </DialogDescription>
          </DialogHeader>
          {attributeDraft ? (
            <div className="grid gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="attr-label-vi">Tên tiếng Việt</Label>
                <Input
                  id="attr-label-vi"
                  value={attributeDraft.labelVi}
                  onChange={(event) => {
                    const labelVi = event.target.value
                    setAttributeDraft({
                      ...attributeDraft,
                      labelVi,
                      slug: slugTouched ? attributeDraft.slug : slugify(labelVi),
                    })
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="attr-label-en">Tên tiếng Anh</Label>
                <Input
                  id="attr-label-en"
                  value={attributeDraft.labelEn}
                  onChange={(event) =>
                    setAttributeDraft({
                      ...attributeDraft,
                      labelEn: event.target.value,
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="attr-slug">Slug</Label>
                <Input
                  id="attr-slug"
                  value={attributeDraft.slug}
                  onChange={(event) => {
                    setSlugTouched(true)
                    setAttributeDraft({
                      ...attributeDraft,
                      slug: slugify(event.target.value),
                    })
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="attr-sort">Thứ tự</Label>
                <Input
                  id="attr-sort"
                  inputMode="numeric"
                  value={attributeDraft.sortOrder}
                  onChange={(event) =>
                    setAttributeDraft({
                      ...attributeDraft,
                      sortOrder: event.target.value.replace(/[^\d]/g, ""),
                    })
                  }
                />
              </div>
            </div>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialogs}>
              Hủy
            </Button>
            <Button type="button" disabled={pending} onClick={() => void saveAttribute()}>
              {pending ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteGroupId !== null}
        onOpenChange={(open) => {
          if (!open) closeDialogs()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa nhóm danh mục?</DialogTitle>
            <DialogDescription>
              Không xóa được nhóm đang gắn sản phẩm. Các danh mục trống trong nhóm
              cũng sẽ bị xóa.
            </DialogDescription>
          </DialogHeader>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialogs}>
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => void confirmDeleteGroup()}
            >
              {pending ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteAttributeId !== null}
        onOpenChange={(open) => {
          if (!open) closeDialogs()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa danh mục?</DialogTitle>
            <DialogDescription>
              Không xóa được danh mục đang gắn sản phẩm.
            </DialogDescription>
          </DialogHeader>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialogs}>
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => void confirmDeleteAttribute()}
            >
              {pending ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
