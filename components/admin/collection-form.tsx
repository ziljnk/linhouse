"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Languages, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  ImageUploader,
  createUploadedImageFromUrl,
  type UploadedImage,
} from "@/components/admin/image-uploader"
import {
  createCollectionAction,
  updateCollectionAction,
} from "@/app/admin/(dashboard)/collections/actions"
import { translateViToEnAction } from "@/app/admin/(dashboard)/translate/actions"
import { persistUploadedImages } from "@/lib/persist-admin-images"
import { ADMIN_IMAGE_SIZE_HINTS } from "@/lib/admin-image-sizes"
import { nextAutoSlug, slugify } from "@/lib/slug"
import { toastError, toastSuccess } from "@/lib/admin-toast"
import { isLivePublished, type PublishIntent } from "@/lib/content-status"
import { PublishIntentActions } from "@/components/admin/publish-intent-actions"
import {
  SchedulePublishDialog,
  datetimeLocalToIso,
  defaultScheduleValue,
  toDatetimeLocalValue,
} from "@/components/admin/schedule-publish-dialog"
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
  id?: string
  nameVi?: string
  nameEn?: string
  subtitleVi?: string
  subtitleEn?: string
  imageAltVi?: string
  imageAltEn?: string
  slug?: string
  year?: number | null
  status?: "draft" | "published"
  publishedAt?: string | null
  coverUrl?: string
  galleryUrls?: string[]
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
}

export function CollectionForm({
  defaultValues,
}: {
  defaultValues?: CollectionFormValues
} = {}) {
  const router = useRouter()
  const [nameVi, setNameVi] = useState(defaultValues?.nameVi ?? "")
  const [nameEn, setNameEn] = useState(defaultValues?.nameEn ?? "")
  const [subtitleVi, setSubtitleVi] = useState(defaultValues?.subtitleVi ?? "")
  const [subtitleEn, setSubtitleEn] = useState(defaultValues?.subtitleEn ?? "")
  const [imageAltVi, setImageAltVi] = useState(defaultValues?.imageAltVi ?? "")
  const [imageAltEn, setImageAltEn] = useState(defaultValues?.imageAltEn ?? "")
  const [infoTab, setInfoTab] = useState<"vi" | "en">("vi")
  const [coverImages, setCoverImages] = useState<UploadedImage[]>(
    defaultValues?.coverUrl
      ? [createUploadedImageFromUrl(defaultValues.coverUrl)]
      : []
  )
  const [galleryImages, setGalleryImages] = useState<UploadedImage[]>(
    (defaultValues?.galleryUrls ?? []).map((url) => createUploadedImageFromUrl(url))
  )
  const [slug, setSlug] = useState(defaultValues?.slug ?? "")
  const [year, setYear] = useState(
    defaultValues?.year ? String(defaultValues.year) : ""
  )
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [scheduleValue, setScheduleValue] = useState(
    defaultValues?.publishedAt &&
      !isLivePublished(defaultValues.status, defaultValues.publishedAt)
      ? toDatetimeLocalValue(new Date(defaultValues.publishedAt))
      : defaultScheduleValue
  )
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [seoTitle, setSeoTitle] = useState(defaultValues?.seoTitle ?? "")
  const [seoDescription, setSeoDescription] = useState(
    defaultValues?.seoDescription ?? ""
  )
  const [seoKeywords, setSeoKeywords] = useState(defaultValues?.seoKeywords ?? "")
  const [pending, setPending] = useState(false)
  const [translating, setTranslating] = useState(false)

  const handleTranslateToEnglish = async () => {
    if (!subtitleVi.trim() || translating) return
    setTranslating(true)
    try {
      const result = await translateViToEnAction(subtitleVi)
      if (!result.ok) {
        toastError(result.error)
        return
      }
      setSubtitleEn(result.data.text)
      setInfoTab("en")
      toastSuccess("Đã dịch sang tiếng Anh.")
    } catch {
      toastError("Không dịch được. Vui lòng thử lại.")
    } finally {
      setTranslating(false)
    }
  }

  const persistAndSave = async (intent: PublishIntent, publishedAt?: string | null) => {
    if (!nameVi.trim()) {
      toastError("Vui lòng nhập tên bộ sưu tập.")
      return
    }

    if (coverImages.length === 0) {
      toastError("Vui lòng tải lên ảnh bìa bộ sưu tập.")
      return
    }

    setPending(true)
    try {
      const uploaded = await persistUploadedImages(
        [...coverImages, ...galleryImages],
        "collections"
      )
      const coverUrl = uploaded[0] ?? ""
      const galleryUrls = uploaded.slice(1)
      if (intent !== "draft" && !coverUrl) {
        toastError("Vui lòng tải lên ảnh bìa bộ sưu tập.")
        return
      }
      const payload = {
        nameVi,
        nameEn,
        subtitleVi,
        subtitleEn,
        imageAltVi,
        imageAltEn,
        slug,
        year: year.trim() ? Number(year) : null,
        intent,
        publishedAt,
        coverUrl,
        galleryUrls,
        seoTitle,
        seoDescription,
        seoKeywords,
      }
      const result = defaultValues?.id
        ? await updateCollectionAction(defaultValues.id, payload)
        : await createCollectionAction(payload)

      if (!result.ok) {
        toastError(result.error)
        return
      }

      setScheduleOpen(false)
      setScheduleError(null)
      if (intent === "publish") {
        toastSuccess("Đã đăng bộ sưu tập.")
      } else if (intent === "schedule") {
        toastSuccess("Đã hẹn lịch đăng bộ sưu tập.")
      } else {
        toastSuccess("Đã lưu nháp.", "Bộ sưu tập chưa hiện trên website.")
      }
      if (!defaultValues?.id) {
        router.push("/admin/collections")
      } else if (result.data.slug !== defaultValues.slug) {
        router.replace(`/admin/collections/${result.data.slug}/edit`)
      }
      router.refresh()
    } catch (error) {
      toastError(
        error instanceof Error ? error.message : "Không lưu được bộ sưu tập."
      )
    } finally {
      setPending(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void persistAndSave("draft")
  }

  const openSchedule = () => {
    if (!nameVi.trim()) {
      toastError("Vui lòng nhập tên bộ sưu tập.")
      return
    }
    if (coverImages.length === 0) {
      toastError("Vui lòng tải lên ảnh bìa bộ sưu tập.")
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
            <Tabs
              value={infoTab}
              onValueChange={(value) => {
                if (value === "vi" || value === "en") setInfoTab(value)
              }}
              className="gap-3"
            >
              <TabsList>
                <TabsTrigger value="vi">Tiếng Việt</TabsTrigger>
                <TabsTrigger value="en">Tiếng Anh</TabsTrigger>
              </TabsList>
              <TabsContent value="vi" className="grid gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="collection-name-vi">Tên bộ sưu tập</Label>
                  <Input
                    id="collection-name-vi"
                    name="nameVi"
                    value={nameVi}
                    onChange={(event) => {
                      const nextName = event.target.value
                      setSlug((current) => nextAutoSlug(nameVi, current, nextName))
                      setNameVi(nextName)
                    }}
                    placeholder="Spring 2026"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="collection-subtitle-vi">Mô tả ngắn</Label>
                  <div className="relative">
                    <Textarea
                      id="collection-subtitle-vi"
                      name="subtitleVi"
                      value={subtitleVi}
                      onChange={(event) => setSubtitleVi(event.target.value)}
                      placeholder="Bắt đầu từ ánh sáng và độ phồng. Dáng váy mới cho một mùa bridal mới."
                      rows={3}
                      className="pr-10"
                    />
                    <Tooltip>
                      <TooltipTrigger
                        delay={0}
                        closeDelay={0}
                        aria-label="Dịch sang tiếng Anh"
                        render={
                          <Button
                            type="button"
                            variant="default"
                            size="icon-xs"
                            disabled={translating || !subtitleVi.trim()}
                            className="absolute top-2 right-2 shadow-sm"
                          />
                        }
                        onClick={() => void handleTranslateToEnglish()}
                      >
                        {translating ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Languages />
                        )}
                      </TooltipTrigger>
                      <TooltipContent>Dịch sang tiếng Anh</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="collection-alt-vi">Mô tả ảnh bìa</Label>
                  <Input
                    id="collection-alt-vi"
                    name="imageAltVi"
                    value={imageAltVi}
                    onChange={(event) => setImageAltVi(event.target.value)}
                    placeholder="Bộ sưu tập Spring 2026"
                  />
                </div>
              </TabsContent>
              <TabsContent value="en" className="grid gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="collection-name-en">Collection name</Label>
                  <Input
                    id="collection-name-en"
                    name="nameEn"
                    value={nameEn}
                    onChange={(event) => setNameEn(event.target.value)}
                    placeholder="Spring 2026"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="collection-subtitle-en">Short description</Label>
                  <Textarea
                    id="collection-subtitle-en"
                    name="subtitleEn"
                    value={subtitleEn}
                    onChange={(event) => setSubtitleEn(event.target.value)}
                    placeholder="It begins with light and volume. New silhouettes for a new bridal season."
                    rows={3}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="collection-alt-en">Cover image alt</Label>
                  <Input
                    id="collection-alt-en"
                    name="imageAltEn"
                    value={imageAltEn}
                    onChange={(event) => setImageAltEn(event.target.value)}
                    placeholder="Spring 2026 collection"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="collection-year">Năm</Label>
            <Input
              id="collection-year"
              name="year"
              inputMode="numeric"
              maxLength={4}
              value={year}
              onChange={(event) =>
                setYear(event.target.value.replace(/[^\d]/g, "").slice(0, 4))
              }
              placeholder="2026"
            />
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label>Ảnh bìa</Label>
            <ImageUploader
              images={coverImages}
              onChange={setCoverImages}
              maxFiles={1}
              aspect="portrait"
              sizeHint={ADMIN_IMAGE_SIZE_HINTS.collectionCover}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
        <div className="mb-5">
          <h2 className="text-base font-semibold">Ảnh lookbook</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Những ảnh dọc này sẽ hiện trên trang bộ sưu tập theo dạng masonry.
            Tải nhiều ảnh, rồi kéo thả để xếp thứ tự.
          </p>
        </div>
        <ImageUploader
          images={galleryImages}
          onChange={setGalleryImages}
          maxFiles={32}
          aspect="portrait"
          showCoverBadge={false}
          sortHint="Kéo thả để sắp xếp thứ tự ảnh trên masonry của storefront."
          sizeHint={ADMIN_IMAGE_SIZE_HINTS.collectionGallery}
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
                onChange={(event) => setSlug(slugify(event.target.value))}
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {galleryImages.length} ảnh lookbook
        </p>
        <PublishIntentActions
          pending={pending}
          isLive={isLivePublished(defaultValues?.status, defaultValues?.publishedAt)}
          onPublish={() => void persistAndSave("publish")}
          onSchedule={openSchedule}
        />
      </div>
      <SchedulePublishDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        value={scheduleValue}
        onValueChange={setScheduleValue}
        error={scheduleError}
        pending={pending}
        onConfirm={confirmSchedule}
        description="Bộ sưu tập sẽ được đánh dấu đã đăng và chỉ hiện trên website khi tới giờ."
      />
    </form>
  )
}
