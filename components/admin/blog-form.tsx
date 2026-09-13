"use client"

import { useMemo, useRef, useState, type FormEvent } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { CalendarClock, ChevronDown, Send } from "lucide-react"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ImageUploader,
  createUploadedImageFromUrl,
  type UploadedImage,
} from "@/components/admin/image-uploader"
import {
  BLOG_CATEGORIES,
  formatScheduledAt,
  slugify,
  type BlogStatus,
} from "@/lib/admin-blog"
import { cn } from "@/lib/utils"

const SEO_TITLE_LIMIT = 60
const SEO_DESCRIPTION_LIMIT = 160
const CATEGORY_OPTIONS = BLOG_CATEGORIES.map((item) => ({
  value: item.value,
  label: item.label,
}))

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

function pad(value: number) {
  return String(value).padStart(2, "0")
}

function toDatetimeLocalValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function defaultScheduleValue() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  date.setHours(9, 0, 0, 0)
  return toDatetimeLocalValue(date)
}

function datetimeLocalToIso(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

type SaveResult = {
  status: BlogStatus
  scheduledAt: string | null
}

export type BlogFormValues = {
  title?: string
  slug?: string
  content?: string
  category?: string
  coverUrl?: string
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
}

export function BlogForm({
  defaultValues,
  cancelHref = "/admin/blog",
}: {
  defaultValues?: BlogFormValues
  cancelHref?: string
} = {}) {
  const router = useRouter()
  const [title, setTitle] = useState(defaultValues?.title ?? "")
  const [slug, setSlug] = useState(defaultValues?.slug ?? "")
  const [slugTouched, setSlugTouched] = useState(Boolean(defaultValues?.slug))
  const [content, setContent] = useState(defaultValues?.content ?? "")
  const [category, setCategory] = useState(defaultValues?.category ?? "")
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
  const [formError, setFormError] = useState<string | null>(null)
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [scheduleValue, setScheduleValue] = useState(defaultScheduleValue)
  const [scheduleError, setScheduleError] = useState<string | null>(null)

  const snapshot = useMemo(
    () =>
      JSON.stringify({
        title,
        slug,
        content,
        category,
        coverUrl: coverImages[0]?.url ?? "",
        seoTitle,
        seoDescription,
        seoKeywords,
      }),
    [
      title,
      slug,
      content,
      category,
      coverImages,
      seoTitle,
      seoDescription,
      seoKeywords,
    ]
  )
  const cleanSnapshotRef = useRef(snapshot)
  const isDirty = snapshot !== cleanSnapshotRef.current

  const publishError = () => {
    if (!title.trim()) return "Vui lòng nhập tiêu đề bài viết."
    if (isEmptyHtml(content)) return "Vui lòng nhập nội dung bài viết."
    if (!category) return "Vui lòng chọn danh mục."
    if (coverImages.length === 0) return "Vui lòng tải lên ảnh bìa."
    return null
  }

  const finishSave = (result: SaveResult) => {
    cleanSnapshotRef.current = snapshot
    setFormError(null)
    setSaveResult(result)
    setScheduleOpen(false)
    setScheduleError(null)
  }

  const saveDraft = () => {
    setSaveResult(null)
    if (!title.trim()) {
      setFormError("Nhập tiêu đề trước khi lưu nháp.")
      return
    }
    finishSave({ status: "draft", scheduledAt: null })
  }

  const publishNow = () => {
    setSaveResult(null)
    const error = publishError()
    if (error) {
      setFormError(error)
      return
    }
    finishSave({ status: "published", scheduledAt: null })
  }

  const openSchedule = () => {
    setSaveResult(null)
    const error = publishError()
    if (error) {
      setFormError(error)
      return
    }
    setFormError(null)
    setScheduleError(null)
    setScheduleValue(defaultScheduleValue())
    setScheduleOpen(true)
  }

  const confirmSchedule = () => {
    const iso = datetimeLocalToIso(scheduleValue)
    if (!iso) {
      setScheduleError("Vui lòng chọn ngày và giờ đăng.")
      return
    }
    if (new Date(iso).getTime() <= Date.now()) {
      setScheduleError("Thời gian hẹn lịch phải ở tương lai.")
      return
    }
    finishSave({ status: "scheduled", scheduledAt: iso })
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
          <div className="flex flex-col gap-2">
            <Label htmlFor="blog-title">Tiêu đề</Label>
            <Input
              id="blog-title"
              name="title"
              value={title}
              onChange={(event) => {
                const nextTitle = event.target.value
                setTitle(nextTitle)
                if (!slugTouched) setSlug(slugify(nextTitle))
              }}
              placeholder="Top 9 xu hướng váy cưới 2026"
            />
          </div>

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
        <BlogRichTextEditor
          initialContent={defaultValues?.content}
          onChange={setContent}
        />
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
              value={category || null}
              onValueChange={(value) => setCategory(value ?? "")}
              items={CATEGORY_OPTIONS}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} className="w-(--anchor-width)">
                {CATEGORY_OPTIONS.map((option) => (
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
              aspect="landscape"
            />
          </div>
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

      {formError ? (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      {saveResult ? (
        <p role="status" className="text-sm text-foreground">
          {saveResult.status === "draft"
            ? "Đã lưu nháp. Bài viết chưa hiện trên website."
            : saveResult.status === "published"
              ? "Đã đăng bài viết."
              : `Đã hẹn lịch đăng lúc ${formatScheduledAt(saveResult.scheduledAt ?? "")}.`}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={handleCancel}>
          Hủy
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" variant="outline">
            Lưu nháp
          </Button>
          <div className="flex">
            <Button type="button" className="rounded-r-none" onClick={publishNow}>
              Đăng bài
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Tùy chọn đăng bài"
                render={
                  <Button
                    type="button"
                    className="rounded-l-none border-l border-primary-foreground/25 px-2"
                  />
                }
              >
                <ChevronDown />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuItem onClick={publishNow}>
                  <Send />
                  Đăng ngay
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openSchedule}>
                  <CalendarClock />
                  Hẹn lịch đăng
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
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

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hẹn lịch đăng</DialogTitle>
            <DialogDescription>
              Bài viết sẽ chuyển sang trạng thái Đã lên lịch và chỉ hiện trên
              website khi tới giờ.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="blog-schedule-at">Thời điểm đăng</Label>
            <Input
              id="blog-schedule-at"
              type="datetime-local"
              value={scheduleValue}
              min={toDatetimeLocalValue(new Date())}
              onChange={(event) => setScheduleValue(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Giờ theo máy tính của bạn.
            </p>
            {scheduleError ? (
              <p role="alert" className="text-sm text-destructive">
                {scheduleError}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setScheduleOpen(false)}
            >
              Hủy
            </Button>
            <Button type="button" onClick={confirmSchedule}>
              Hẹn lịch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
