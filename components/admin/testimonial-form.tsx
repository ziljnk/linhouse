"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Languages, Loader2 } from "lucide-react"
import { saveTestimonialAction } from "@/app/admin/(dashboard)/testimonials/actions"
import { translateViToEnAction } from "@/app/admin/(dashboard)/translate/actions"
import { persistUploadedImages } from "@/lib/persist-admin-images"
import { ADMIN_IMAGE_SIZE_HINTS } from "@/lib/admin-image-sizes"
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
  TESTIMONIAL_STATUS_LABELS,
  TESTIMONIAL_STATUSES,
  type TestimonialStatus,
} from "@/lib/admin-testimonials"

const STATUS_OPTIONS = TESTIMONIAL_STATUSES.map((status) => ({
  value: status,
  label: TESTIMONIAL_STATUS_LABELS[status],
}))

function defaultImageAlt(name: string, locale: "vi" | "en") {
  const trimmed = name.trim()
  if (!trimmed) return ""
  return locale === "vi"
    ? `${trimmed} trong váy cưới LINHouse`
    : `${trimmed} in her LINHouse wedding gown`
}

export type TestimonialFormValues = {
  id?: string
  name?: string
  slug?: string
  quoteVi?: string
  quoteEn?: string
  imageUrl?: string
  imageAltVi?: string
  imageAltEn?: string
  gown?: string
  year?: string
  status?: TestimonialStatus
}

export function TestimonialForm({
  defaultValues,
}: {
  defaultValues?: TestimonialFormValues
} = {}) {
  const router = useRouter()
  const [name, setName] = useState(defaultValues?.name ?? "")
  const [quoteVi, setQuoteVi] = useState(defaultValues?.quoteVi ?? "")
  const [quoteEn, setQuoteEn] = useState(defaultValues?.quoteEn ?? "")
  const [images, setImages] = useState<UploadedImage[]>(
    defaultValues?.imageUrl
      ? [
          createUploadedImageFromUrl(
            defaultValues.imageUrl,
            defaultValues.name?.trim() || "cover"
          ),
        ]
      : []
  )
  const [imageAltVi, setImageAltVi] = useState(defaultValues?.imageAltVi ?? "")
  const [imageAltEn, setImageAltEn] = useState(defaultValues?.imageAltEn ?? "")
  const [imageAltTouched, setImageAltTouched] = useState(
    Boolean(defaultValues?.imageAltVi)
  )
  const [gown, setGown] = useState(defaultValues?.gown ?? "")
  const [year, setYear] = useState(defaultValues?.year ?? "")
  const [status, setStatus] = useState<TestimonialStatus>(
    defaultValues?.status ?? "published"
  )
  const [quoteTab, setQuoteTab] = useState<"vi" | "en">("vi")
  const [formError, setFormError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [pending, setPending] = useState(false)
  const [translating, setTranslating] = useState(false)

  const handleNameChange = (nextName: string) => {
    setName(nextName)
    if (!imageAltTouched) {
      setImageAltVi(defaultImageAlt(nextName, "vi"))
      setImageAltEn(defaultImageAlt(nextName, "en"))
    }
  }

  const handleTranslateToEnglish = async () => {
    if (!quoteVi.trim() || translating) return
    setFormError(null)
    setTranslating(true)
    try {
      const result = await translateViToEnAction(quoteVi)
      if (!result.ok) {
        setFormError(result.error)
        return
      }
      setQuoteEn(result.data.text)
      setQuoteTab("en")
    } catch {
      setFormError("Không dịch được. Vui lòng thử lại.")
    } finally {
      setTranslating(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(false)

    if (!name.trim()) {
      setFormError("Vui lòng nhập tên cô dâu.")
      return
    }

    if (!quoteVi.trim()) {
      setFormError("Vui lòng nhập lời nhắn tiếng Việt.")
      return
    }

    if (images.length === 0) {
      setFormError("Vui lòng tải lên ảnh cô dâu.")
      return
    }

    setFormError(null)
    setPending(true)
    try {
      const [imageUrl] = await persistUploadedImages(images)
      if (!imageUrl) {
        setFormError("Vui lòng tải lên ảnh cô dâu.")
        return
      }
      const result = await saveTestimonialAction({
        id: defaultValues?.id,
        name,
        quoteVi,
        quoteEn,
        imageUrl,
        imageAltVi,
        imageAltEn,
        gown,
        year,
        status,
      })
      if (!result.ok) {
        setFormError(result.error)
        return
      }
      setSubmitted(true)
      if (!defaultValues?.id) {
        router.push("/admin/testimonials")
      } else if (result.data.slug !== defaultValues.slug) {
        router.replace(`/admin/testimonials/${result.data.slug}/edit`)
      }
      router.refresh()
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Không lưu được câu chuyện."
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-8">
      <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
        <div className="mb-5">
          <h2 className="text-base font-semibold">Ảnh cô dâu</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ảnh dọc sẽ hiện trên slider trang chủ.
          </p>
        </div>
        <ImageUploader
          images={images}
          onChange={setImages}
          maxFiles={1}
          aspect="portrait"
          sizeHint={ADMIN_IMAGE_SIZE_HINTS.testimonial}
        />
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
        <div className="mb-5">
          <h2 className="text-base font-semibold">Nội dung câu chuyện</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tên, lời nhắn và thông tin váy hiển thị trên thẻ testimonial.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="testimonial-name">Tên cô dâu</Label>
            <Input
              id="testimonial-name"
              name="name"
              value={name}
              onChange={(event) => handleNameChange(event.target.value)}
              placeholder="Lan Anh"
              required
            />
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label>Lời nhắn</Label>
            <Tabs
              value={quoteTab}
              onValueChange={(value) => {
                if (value === "vi" || value === "en") setQuoteTab(value)
              }}
              className="gap-3"
            >
              <TabsList>
                <TabsTrigger value="vi">Tiếng Việt</TabsTrigger>
                <TabsTrigger value="en">Tiếng Anh</TabsTrigger>
              </TabsList>
              <TabsContent value="vi">
                <div className="relative">
                  <Textarea
                    id="testimonial-quote-vi"
                    name="quoteVi"
                    value={quoteVi}
                    onChange={(event) => setQuoteVi(event.target.value)}
                    placeholder="Lần đầu tôi cảm thấy mình là chính mình trong một chiếc váy được may cho dáng người của tôi..."
                    rows={5}
                    className="pr-10"
                    required
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
                          disabled={translating || !quoteVi.trim()}
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
              </TabsContent>
              <TabsContent value="en">
                <Textarea
                  id="testimonial-quote-en"
                  name="quoteEn"
                  value={quoteEn}
                  onChange={(event) => setQuoteEn(event.target.value)}
                  placeholder="I finally felt like myself in a gown made for my body, not a sample size."
                  rows={5}
                />
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="testimonial-gown">Váy</Label>
            <Input
              id="testimonial-gown"
              name="gown"
              value={gown}
              onChange={(event) => setGown(event.target.value)}
              placeholder="Camille"
            />
            <p className="text-xs text-muted-foreground">
              Tên váy cô dâu đã chọn, ví dụ Camille hoặc Luna Mini.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="testimonial-year">Năm cưới</Label>
            <Input
              id="testimonial-year"
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="testimonial-status">Trạng thái</Label>
            <Select
              id="testimonial-status"
              value={status}
              onValueChange={(value) => {
                if (value === "published" || value === "draft") setStatus(value)
              }}
              items={STATUS_OPTIONS}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                alignItemWithTrigger={false}
                className="w-(--anchor-width)"
              >
                {STATUS_OPTIONS.map((option) => (
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
            <p className="text-xs text-muted-foreground">
              Draft sẽ không hiện trên slider trang chủ.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
        <div className="mb-5">
          <h2 className="text-base font-semibold">Mô tả ảnh</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Dùng cho trình đọc màn hình. Tự điền từ tên cô dâu, có thể sửa lại.
          </p>
        </div>
        <Tabs defaultValue="vi" className="gap-3">
          <TabsList>
            <TabsTrigger value="vi">Tiếng Việt</TabsTrigger>
            <TabsTrigger value="en">Tiếng Anh</TabsTrigger>
          </TabsList>
          <TabsContent value="vi">
            <Input
              id="testimonial-alt-vi"
              name="imageAltVi"
              value={imageAltVi}
              onChange={(event) => {
                setImageAltTouched(true)
                setImageAltVi(event.target.value)
              }}
              placeholder="Lan Anh trong váy cưới LINHouse"
            />
          </TabsContent>
          <TabsContent value="en">
            <Input
              id="testimonial-alt-en"
              name="imageAltEn"
              value={imageAltEn}
              onChange={(event) => {
                setImageAltTouched(true)
                setImageAltEn(event.target.value)
              }}
              placeholder="Lan Anh in her LINHouse wedding gown"
            />
          </TabsContent>
        </Tabs>
      </section>

      {formError ? (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      {submitted ? (
        <p role="status" className="text-sm text-foreground">
          Đã lưu câu chuyện của {name.trim()}.
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Đang lưu..." : "Lưu câu chuyện"}
        </Button>
      </div>
    </form>
  )
}
