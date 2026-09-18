"use client"

import { useMemo, useRef, useState, type FormEvent } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { saveBlogPostAction, type BlogIntent } from "@/app/admin/(dashboard)/blog/actions"
import { persistUploadedImages } from "@/lib/persist-admin-images"
import { ADMIN_IMAGE_SIZE_HINTS } from "@/lib/admin-image-sizes"
import { toastError, toastSuccess } from "@/lib/admin-toast"
import { isLivePublished } from "@/lib/content-status"
import { PublishIntentActions } from "@/components/admin/publish-intent-actions"
import {
  SchedulePublishDialog,
  datetimeLocalToIso,
  defaultScheduleValue,
  toDatetimeLocalValue,
} from "@/components/admin/schedule-publish-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  ImageUploader,
  createUploadedImageFromUrl,
  type UploadedImage,
} from "@/components/admin/image-uploader"
import { slugify } from "@/lib/admin-blog"
import type { AdminBlogCategoryOption } from "@/lib/admin-storefront"
import { cn } from "@/lib/utils"

const SEO_TITLE_LIMIT = 60
const SEO_DESCRIPTION_LIMIT = 160

const BlogRichTextEditor = dynamic(
  () =>
    import("@/components/admin/blog-rich-text-editor").then(
      (mod) => mod.BlogRichTextEditor
    ),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-85 rounded-md border border-input bg-transparent shadow-xs" />
    ),
  }
)

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

function isEmptyHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim() === ""
}

export type BlogFormValues = {
  id?: string
  titleVi?: string
  titleEn?: string
  excerptVi?: string
  excerptEn?: string
  contentVi?: string
  contentEn?: string
  imageAltVi?: string
  imageAltEn?: string
  slug?: string
  categoryId?: string
  coverUrl?: string
  status?: "draft" | "published"
  publishedAt?: string | null
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
}

export function BlogForm({
  categories,
  defaultValues,
  cancelHref = "/admin/blog",
}: {
  categories: AdminBlogCategoryOption[]
  defaultValues?: BlogFormValues
  cancelHref?: string
}) {
  const router = useRouter()
  const categoryOptions = categories.map((item) => ({
    value: item.id,
    label: item.label,
  }))
  const [titleVi, setTitleVi] = useState(defaultValues?.titleVi ?? "")
  const [titleEn, setTitleEn] = useState(defaultValues?.titleEn ?? "")
  const [excerptVi, setExcerptVi] = useState(defaultValues?.excerptVi ?? "")
  const [excerptEn, setExcerptEn] = useState(defaultValues?.excerptEn ?? "")
  const [contentVi, setContentVi] = useState(defaultValues?.contentVi ?? "")
  const [contentEn, setContentEn] = useState(defaultValues?.contentEn ?? "")
  const [imageAltVi, setImageAltVi] = useState(defaultValues?.imageAltVi ?? "")
  const [imageAltEn, setImageAltEn] = useState(defaultValues?.imageAltEn ?? "")
  const [localeTab, setLocaleTab] = useState<"vi" | "en">("vi")
  const [slug, setSlug] = useState(defaultValues?.slug ?? "")
  const [slugTouched, setSlugTouched] = useState(Boolean(defaultValues?.slug))
  const [categoryId, setCategoryId] = useState(defaultValues?.categoryId ?? "")
  const [coverImages, setCoverImages] = useState<UploadedImage[]>(
    defaultValues?.coverUrl
      ? [createUploadedImageFromUrl(defaultValues.coverUrl)]
      : []
  )
  const [seoTitle, setSeoTitle] = useState(defaultValues?.seoTitle ?? "")
  const [seoDescription, setSeoDescription] = useState(
    defaultValues?.seoDescription ?? ""
  )
  const [seoKeywords, setSeoKeywords] = useState(defaultValues?.seoKeywords ?? "")
  const [cancelOpen, setCancelOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [scheduleValue, setScheduleValue] = useState(
    defaultValues?.publishedAt && isLivePublished(defaultValues.status, defaultValues.publishedAt) === false
      ? toDatetimeLocalValue(new Date(defaultValues.publishedAt))
      : defaultScheduleValue
  )
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const snapshot = useMemo(
    () =>
      JSON.stringify({
        titleVi,
        titleEn,
        excerptVi,
        excerptEn,
        contentVi,
        contentEn,
        imageAltVi,
        imageAltEn,
        slug,
        categoryId,
        coverUrl: coverImages[0]?.url ?? "",
        seoTitle,
        seoDescription,
        seoKeywords,
      }),
    [
      titleVi,
      titleEn,
      excerptVi,
      excerptEn,
      contentVi,
      contentEn,
      imageAltVi,
      imageAltEn,
      slug,
      categoryId,
      coverImages,
      seoTitle,
      seoDescription,
      seoKeywords,
    ]
  )
  const cleanSnapshotRef = useRef(snapshot)
  const isDirty = snapshot !== cleanSnapshotRef.current

  const publishError = () => {
    if (!titleVi.trim()) return "Vui lòng nhập tiêu đề bài viết."
    if (isEmptyHtml(contentVi)) return "Vui lòng nhập nội dung bài viết."
    if (!categoryId) return "Vui lòng chọn danh mục."
    if (coverImages.length === 0) return "Vui lòng tải lên ảnh bìa."
    return null
  }

  const persistAndSave = async (intent: BlogIntent, publishedAt?: string | null) => {
    setPending(true)
    try {
      const uploaded = coverImages.length
        ? await persistUploadedImages(coverImages)
        : [""]
      const coverUrl = uploaded[0] ?? ""
      const result = await saveBlogPostAction({
        id: defaultValues?.id,
        titleVi,
        titleEn,
        excerptVi,
        excerptEn,
        contentVi,
        contentEn,
        imageAltVi,
        imageAltEn,
        slug,
        categoryId,
        coverUrl,
        intent,
        publishedAt,
        seoTitle,
        seoDescription,
        seoKeywords,
      })
      if (!result.ok) {
        toastError(result.error)
        return
      }

      cleanSnapshotRef.current = snapshot
      setScheduleOpen(false)
      setScheduleError(null)

      if (intent === "publish") {
        toastSuccess("Đã đăng bài viết.")
      } else if (intent === "schedule") {
        toastSuccess("Đã hẹn lịch đăng bài viết.")
      } else {
        toastSuccess("Đã lưu nháp.", "Bài viết chưa hiện trên website.")
      }

      if (!defaultValues?.id) {
        router.push("/admin/blog")
      } else if (result.data.slug !== defaultValues.slug) {
        router.replace(`/admin/blog/${result.data.slug}/edit`)
      }
      router.refresh()
    } catch (error) {
      toastError(
        error instanceof Error ? error.message : "Không lưu được bài viết."
      )
    } finally {
      setPending(false)
    }
  }

  const saveDraft = () => {
    if (!titleVi.trim()) {
      toastError("Nhập tiêu đề trước khi lưu nháp.")
      return
    }
    if (!categoryId) {
      toastError("Vui lòng chọn danh mục trước khi lưu nháp.")
      return
    }
    void persistAndSave("draft")
  }

  const publishNow = () => {
    const error = publishError()
    if (error) {
      toastError(error)
      return
    }
    void persistAndSave("publish")
  }

  const openSchedule = () => {
    const error = publishError()
    if (error) {
      toastError(error)
      return
    }
    setScheduleError(null)
    if (!scheduleValue) setScheduleValue(defaultScheduleValue())
    setScheduleOpen(true)
  }

  const confirmSchedule = () => {
    const iso = datetimeLocalToIso(scheduleValue)
    if (!iso) {
      const message = "Vui lòng chọn ngày và giờ đăng."
      setScheduleError(message)
      toastError(message)
      return
    }
    if (new Date(iso).getTime() <= Date.now()) {
      const message = "Thời gian hẹn lịch phải ở tương lai."
      setScheduleError(message)
      toastError(message)
      return
    }
    void persistAndSave("schedule", iso)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    saveDraft()
  }

  const handleCancel = () => {
    if (isDirty) {
      setCancelOpen(true)
      return
    }
    router.push(cancelHref)
  }

  const leavePage = () => {
    setCancelOpen(false)
    router.push(cancelHref)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-8">
      <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
        <div className="mb-5">
          <h2 className="text-base font-semibold">Tiêu đề</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tiêu đề bài viết và đường dẫn được tạo tự động.
          </p>
        </div>

        <div className="grid gap-4">
          <Tabs
            value={localeTab}
            onValueChange={(value) => {
              if (value === "vi" || value === "en") setLocaleTab(value)
            }}
            className="gap-3"
          >
            <TabsList>
              <TabsTrigger value="vi">Tiếng Việt</TabsTrigger>
              <TabsTrigger value="en">Tiếng Anh</TabsTrigger>
            </TabsList>
            <TabsContent value="vi" className="grid gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="blog-title-vi">Tiêu đề</Label>
                <Input
                  id="blog-title-vi"
                  name="titleVi"
                  value={titleVi}
                  onChange={(event) => {
                    const nextTitle = event.target.value
                    setTitleVi(nextTitle)
                    if (!slugTouched) setSlug(slugify(nextTitle))
                  }}
                  placeholder="Top 9 xu hướng váy cưới 2026"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="blog-excerpt-vi">Tóm tắt</Label>
                <Textarea
                  id="blog-excerpt-vi"
                  value={excerptVi}
                  onChange={(event) => setExcerptVi(event.target.value)}
                  placeholder="Đoạn mô tả ngắn hiện trên danh sách blog."
                  rows={3}
                />
              </div>
            </TabsContent>
            <TabsContent value="en" className="grid gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="blog-title-en">Title</Label>
                <Input
                  id="blog-title-en"
                  name="titleEn"
                  value={titleEn}
                  onChange={(event) => setTitleEn(event.target.value)}
                  placeholder="Top 9 wedding dress trends 2026"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="blog-excerpt-en">Excerpt</Label>
                <Textarea
                  id="blog-excerpt-en"
                  value={excerptEn}
                  onChange={(event) => setExcerptEn(event.target.value)}
                  placeholder="Short summary shown on the blog list."
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex flex-col gap-2">
            <Label htmlFor="blog-slug">Đường dẫn</Label>
            <div className="flex h-9 items-center overflow-hidden rounded-md border border-input bg-transparent shadow-xs focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
              <span className="flex h-full shrink-0 items-center border-r border-input bg-muted/50 px-2.5 text-sm text-muted-foreground">
                /blog/
              </span>
              <Input
                id="blog-slug"
                name="slug"
                value={slug}
                onChange={(event) => {
                  setSlugTouched(true)
                  setSlug(slugify(event.target.value))
                }}
                placeholder="xu-huong-vay-cuoi-2026"
                className="h-full rounded-none border-0 shadow-none focus-visible:border-0 focus-visible:ring-0"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Tự tạo từ tiêu đề. Có thể sửa lại nếu cần.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
        <div className="mb-5">
          <h2 className="text-base font-semibold">Nội dung</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Soạn thảo bài viết với định dạng chữ, tiêu đề, danh sách và liên kết.
          </p>
        </div>
        <Tabs defaultValue="vi" className="gap-3">
          <TabsList>
            <TabsTrigger value="vi">Tiếng Việt</TabsTrigger>
            <TabsTrigger value="en">Tiếng Anh</TabsTrigger>
          </TabsList>
          <TabsContent value="vi">
            <BlogRichTextEditor
              initialContent={defaultValues?.contentVi}
              onChange={setContentVi}
            />
          </TabsContent>
          <TabsContent value="en">
            <BlogRichTextEditor
              initialContent={defaultValues?.contentEn}
              onChange={setContentEn}
            />
          </TabsContent>
        </Tabs>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
        <div className="mb-5">
          <h2 className="text-base font-semibold">Thông tin bài viết</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Danh mục hiển thị trên website và ảnh bìa của bài viết.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="flex max-w-md flex-col gap-2">
            <Label htmlFor="blog-category">Danh mục</Label>
            <Select
              id="blog-category"
              value={categoryId || null}
              onValueChange={(value) => setCategoryId(value ?? "")}
              items={categoryOptions}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} className="w-(--anchor-width)">
                {categoryOptions.map((option) => (
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
            <Label>Ảnh bìa</Label>
            <ImageUploader
              images={coverImages}
              onChange={setCoverImages}
              maxFiles={1}
              aspect="portrait"
              sizeHint={ADMIN_IMAGE_SIZE_HINTS.blogCover}
            />
          </div>

          <Tabs defaultValue="vi" className="gap-3">
            <TabsList>
              <TabsTrigger value="vi">Mô tả ảnh VI</TabsTrigger>
              <TabsTrigger value="en">Image alt EN</TabsTrigger>
            </TabsList>
            <TabsContent value="vi">
              <Input
                value={imageAltVi}
                onChange={(event) => setImageAltVi(event.target.value)}
                placeholder="Cô dâu trong váy cưới LINHouse"
              />
            </TabsContent>
            <TabsContent value="en">
              <Input
                value={imageAltEn}
                onChange={(event) => setImageAltEn(event.target.value)}
                placeholder="Bride in a LINHouse wedding gown"
              />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Accordion defaultValue={[]} className="rounded-xl border border-border bg-card px-6 shadow-xs">
        <AccordionItem value="seo" className="border-b-0">
          <AccordionTrigger className="items-center py-5 hover:no-underline">
            <span className="flex flex-col items-start gap-1 pr-4 text-left">
              <span className="text-base font-semibold">SEO</span>
              <span className="text-sm font-normal text-muted-foreground">
                Tiêu đề, mô tả và từ khóa dùng cho Google. Có thể bỏ qua nếu chưa cần.
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-6">
            <div className="grid gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="blog-seo-title">Tiêu đề SEO</Label>
                  <CharacterCount value={seoTitle} limit={SEO_TITLE_LIMIT} />
                </div>
                <Input
                  id="blog-seo-title"
                  name="seoTitle"
                  value={seoTitle}
                  onChange={(event) => setSeoTitle(event.target.value)}
                  placeholder="Top 9 xu hướng váy cưới 2026 | LINHouse"
                />
                <p className="text-xs text-muted-foreground">
                  Nên dài khoảng 50–60 ký tự. Nếu để trống sẽ dùng tiêu đề bài viết.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="blog-seo-description">Mô tả SEO</Label>
                  <CharacterCount value={seoDescription} limit={SEO_DESCRIPTION_LIMIT} />
                </div>
                <Textarea
                  id="blog-seo-description"
                  name="seoDescription"
                  value={seoDescription}
                  onChange={(event) => setSeoDescription(event.target.value)}
                  placeholder="Khám phá những xu hướng váy cưới 2026 được lựa chọn tại atelier LINHouse."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Nên dài khoảng 150–160 ký tự. Hiển thị dưới tiêu đề trên Google.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="blog-seo-keywords">Từ khóa</Label>
                <Input
                  id="blog-seo-keywords"
                  name="seoKeywords"
                  value={seoKeywords}
                  onChange={(event) => setSeoKeywords(event.target.value)}
                  placeholder="váy cưới, xu hướng 2026, cô dâu"
                />
                <p className="text-xs text-muted-foreground">
                  Phân tách bằng dấu phẩy. Dùng cho tìm kiếm nội bộ và thẻ meta keywords.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={handleCancel}>
          Hủy
        </Button>
        <PublishIntentActions
          pending={pending}
          isLive={isLivePublished(defaultValues?.status, defaultValues?.publishedAt)}
          onPublish={publishNow}
          onSchedule={openSchedule}
        />
      </div>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bỏ bài viết này?</AlertDialogTitle>
            <AlertDialogDescription>
              Thay đổi chưa lưu sẽ bị mất. Bài đã lưu trước đó không bị xóa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Tiếp tục sửa</AlertDialogCancel>
            <AlertDialogAction onClick={leavePage}>Bỏ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SchedulePublishDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        value={scheduleValue}
        onValueChange={setScheduleValue}
        error={scheduleError}
        pending={pending}
        onConfirm={confirmSchedule}
        description="Bài viết sẽ được đánh dấu đã đăng và chỉ hiện trên website khi tới giờ."
      />
    </form>
  )
}

