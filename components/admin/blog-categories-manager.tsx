"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Plus, Trash2 } from "lucide-react"
import {
  createBlogCategoryAction,
  deleteBlogCategoryAction,
  updateBlogCategoryAction,
} from "@/app/admin/(dashboard)/blog/actions"
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
import type { AdminBlogCategoryOption } from "@/lib/admin-storefront"
import { toastError, toastSuccess } from "@/lib/admin-toast"
import { nextAutoSlug, slugify } from "@/lib/slug"

type CategoryDraft = {
  id?: string
  slug: string
  labelVi: string
  labelEn: string
}

const emptyDraft = (): CategoryDraft => ({
  slug: "",
  labelVi: "",
  labelEn: "",
})

export function BlogCategoriesManager({
  categories: initialCategories,
}: {
  categories: AdminBlogCategoryOption[]
}) {
  const router = useRouter()
  const [categories, setCategories] = useState(initialCategories)
  const [draft, setDraft] = useState<CategoryDraft | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    setCategories(initialCategories)
  }, [initialCategories])

  const closeDialogs = () => {
    setDraft(null)
    setDeleteId(null)
    setError(null)
  }

  const saveCategory = async () => {
    if (!draft) return
    setPending(true)
    setError(null)
    const payload = {
      slug: draft.slug,
      labelVi: draft.labelVi,
      labelEn: draft.labelEn,
    }
    const result = draft.id
      ? await updateBlogCategoryAction(draft.id, payload)
      : await createBlogCategoryAction(payload)
    setPending(false)
    if (!result.ok) {
      setError(result.error)
      toastError(result.error)
      return
    }
    toastSuccess(draft.id ? "Đã lưu danh mục." : "Đã thêm danh mục.")
    closeDialogs()
    router.refresh()
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    setPending(true)
    setError(null)
    const result = await deleteBlogCategoryAction(deleteId)
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

  const deleting = categories.find((item) => item.id === deleteId)

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Danh mục</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Mỗi bài viết phải thuộc một danh mục trước khi lưu.
          </p>
        </div>
        <Button type="button" onClick={() => setDraft(emptyDraft())}>
          <Plus />
          Thêm danh mục
        </Button>
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Chưa có danh mục blog. Thêm danh mục để tạo bài viết mới.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{category.label || category.slug}</p>
                <p className="text-xs text-muted-foreground">
                  {category.slug}
                  {category.labelEn ? ` · ${category.labelEn}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Sửa ${category.label || category.slug}`}
                  onClick={() =>
                    setDraft({
                      id: category.id,
                      slug: category.slug,
                      labelVi: category.labelVi,
                      labelEn: category.labelEn,
                    })
                  }
                >
                  <Pencil />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Xóa ${category.label || category.slug}`}
                  onClick={() => setDeleteId(category.id)}
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={draft !== null}
        onOpenChange={(open) => {
          if (!open) closeDialogs()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Sửa danh mục" : "Thêm danh mục"}</DialogTitle>
            <DialogDescription>
              Tên tiếng Việt hiện trên trang quản trị. Đường dẫn không được trùng
              danh mục khác.
            </DialogDescription>
          </DialogHeader>
          {draft ? (
            <div className="grid gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="blog-category-label-vi">Tên tiếng Việt</Label>
                <Input
                  id="blog-category-label-vi"
                  value={draft.labelVi}
                  onChange={(event) => {
                    const labelVi = event.target.value
                    setDraft({
                      ...draft,
                      labelVi,
                      slug: nextAutoSlug(draft.labelVi, draft.slug, labelVi),
                    })
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="blog-category-label-en">Tên tiếng Anh</Label>
                <Input
                  id="blog-category-label-en"
                  value={draft.labelEn}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      labelEn: event.target.value,
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="blog-category-slug">Đường dẫn</Label>
                <Input
                  id="blog-category-slug"
                  value={draft.slug}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      slug: slugify(event.target.value),
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
            <Button type="button" disabled={pending} onClick={() => void saveCategory()}>
              {pending ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) closeDialogs()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa danh mục?</DialogTitle>
            <DialogDescription>
              {deleting
                ? `Không xóa được danh mục “${deleting.label || deleting.slug}” khi còn bài viết.`
                : "Không xóa được danh mục đang có bài viết."}
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
              onClick={() => void confirmDelete()}
            >
              {pending ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
