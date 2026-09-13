"use client"

import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  ImageUploader,
  createUploadedImageFromUrl,
  type UploadedImage,
} from "@/components/admin/image-uploader"
import { slugify } from "@/lib/admin-collections"
import { cn } from "@/lib/utils"

const SEO_TITLE_LIMIT = 60
const SEO_DESCRIPTION_LIMIT = 160

function CharacterCount({
  value,
  limit,
}: {
  value: string
  limit: number
}) {
  const length = value.length
  const over = length > limit

  return (
    <span className={cn("text-xs tabular-nums", over ? "text-destructive" : "text-muted-foreground")}>
      {length}/{limit}
    </span>
  )
}

export type CollectionFormValues = {
  name?: string
  subtitle?: string
  slug?: string
  coverUrl?: string
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
}

export function CollectionForm({
  defaultValues,
}: {
  defaultValues?: CollectionFormValues
} = {}) {
  const [name, setName] = useState(defaultValues?.name ?? "")
  const [subtitle, setSubtitle] = useState(defaultValues?.subtitle ?? "")
  const [coverImages, setCoverImages] = useState<UploadedImage[]>(
    defaultValues?.coverUrl
      ? [createUploadedImageFromUrl(defaultValues.coverUrl)]
      : []
  )
  const [galleryImages, setGalleryImages] = useState<UploadedImage[]>([])
  const [slug, setSlug] = useState(defaultValues?.slug ?? "")
  const [slugTouched, setSlugTouched] = useState(Boolean(defaultValues?.slug))
  const [seoTitle, setSeoTitle] = useState(defaultValues?.seoTitle ?? "")
  const [seoDescription, setSeoDescription] = useState(
    defaultValues?.seoDescription ?? ""
  )
  const [seoKeywords, setSeoKeywords] = useState(defaultValues?.seoKeywords ?? "")
  const [formError, setFormError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(false)

    if (!name.trim()) {
      setFormError("Vui lòng nhập tên bộ sưu tập.")
      return
    }

    if (coverImages.length === 0) {
      setFormError("Vui lòng tải lên ảnh bìa bộ sưu tập.")
      return
    }

    setFormError(null)
    setSubmitted(true)
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-8">
      <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
        <div className="mb-5">
          <h2 className="text-base font-semibold">Thông tin bộ sưu tập</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tên, mô tả và ảnh bìa hiển thị trên website.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="collection-name">Tên bộ sưu tập</Label>
            <Input
              id="collection-name"
              name="name"
              value={name}
              onChange={(event) => {
                const nextName = event.target.value
                setName(nextName)
                if (!slugTouched) setSlug(slugify(nextName))
              }}
              placeholder="Spring 2026"
              required
            />
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="collection-subtitle">Mô tả ngắn</Label>
            <Textarea
              id="collection-subtitle"
              name="subtitle"
              value={subtitle}
              onChange={(event) => setSubtitle(event.target.value)}
              placeholder="Bắt đầu từ ánh sáng và độ phồng. Dáng váy mới cho một mùa bridal mới."
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label>Ảnh bìa</Label>
            <ImageUploader
              images={coverImages}
              onChange={setCoverImages}
              maxFiles={1}
              aspect="portrait"
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
        <div className="mb-5">
          <h2 className="text-base font-semibold">Ảnh lookbook</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Những ảnh này sẽ hiện trên trang bộ sưu tập theo dạng masonry. Tải
            nhiều ảnh, rồi kéo thả để xếp thứ tự.
          </p>
        </div>
        <ImageUploader
          images={galleryImages}
          onChange={setGalleryImages}
          maxFiles={32}
          aspect="portrait"
          showCoverBadge={false}
          sortHint="Kéo thả để sắp xếp thứ tự ảnh trên masonry của storefront."
        />
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
        <div className="mb-5">
          <h2 className="text-base font-semibold">SEO</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tiêu đề, mô tả và đường dẫn dùng cho Google và khi chia sẻ liên kết.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="collection-slug">Đường dẫn</Label>
            <div className="flex h-9 items-center overflow-hidden rounded-md border border-input bg-transparent shadow-xs focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
              <span className="flex h-full shrink-0 items-center border-r border-input bg-muted/50 px-2.5 text-sm text-muted-foreground">
                /catalog/
              </span>
              <Input
                id="collection-slug"
                name="slug"
                value={slug}
                onChange={(event) => {
                  setSlugTouched(true)
                  setSlug(slugify(event.target.value))
                }}
                placeholder="spring-2026"
                className="h-full rounded-none border-0 shadow-none focus-visible:border-0 focus-visible:ring-0"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Tự tạo từ tên bộ sưu tập. Có thể sửa lại nếu cần.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="collection-seo-title">Tiêu đề SEO</Label>
              <CharacterCount value={seoTitle} limit={SEO_TITLE_LIMIT} />
            </div>
            <Input
              id="collection-seo-title"
              name="seoTitle"
              value={seoTitle}
              onChange={(event) => setSeoTitle(event.target.value)}
              placeholder="Spring 2026 | Bộ sưu tập váy cưới | LINHouse"
            />
            <p className="text-xs text-muted-foreground">
              Nên dài khoảng 50–60 ký tự. Nếu để trống sẽ dùng tên bộ sưu tập.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="collection-seo-description">Mô tả SEO</Label>
              <CharacterCount
                value={seoDescription}
                limit={SEO_DESCRIPTION_LIMIT}
              />
            </div>
            <Textarea
              id="collection-seo-description"
              name="seoDescription"
              value={seoDescription}
              onChange={(event) => setSeoDescription(event.target.value)}
              placeholder="Bộ sưu tập Spring 2026 tại atelier LINHouse. Dáng váy mới, ánh sáng và độ phồng cho mùa bridal."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Nên dài khoảng 150–160 ký tự. Hiển thị dưới tiêu đề trên Google.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="collection-seo-keywords">Từ khóa</Label>
            <Input
              id="collection-seo-keywords"
              name="seoKeywords"
              value={seoKeywords}
              onChange={(event) => setSeoKeywords(event.target.value)}
              placeholder="bộ sưu tập, váy cưới, spring 2026"
            />
            <p className="text-xs text-muted-foreground">
              Phân tách bằng dấu phẩy. Dùng cho tìm kiếm nội bộ và thẻ meta keywords.
            </p>
          </div>
        </div>
      </section>

      {formError ? (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      {submitted ? (
        <p role="status" className="text-sm text-foreground">
          Đã nhận {galleryImages.length} ảnh lookbook theo thứ tự đã sắp xếp.
          Lưu lên máy chủ sẽ được bổ sung sau.
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit">Lưu bộ sưu tập</Button>
        <p className="text-xs text-muted-foreground">
          {galleryImages.length} ảnh lookbook
        </p>
      </div>
    </form>
  )
}
