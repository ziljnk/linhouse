"use client"

import { useId, useRef, useState, useTransition, type DragEvent, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Calendar as CalendarIcon, CircleAlert, ImagePlus, RefreshCcw, Trash2 } from "lucide-react"
import { savePromotionPopupAction } from "@/app/admin/(dashboard)/promotions/actions"
import { persistUploadedImages } from "@/lib/persist-admin-images"
import { compressAdminImage } from "@/lib/admin-image-compress"
import { reportAdminFailure } from "@/lib/admin-save-error"
import { cmsImageDisplaySrc } from "@/lib/cms-image"
import { toastError, toastSuccess } from "@/lib/admin-toast"
import { detectImageTypeFromBytes, readFileHeader } from "@/lib/image-file"
import {
  PROMOTION_IMAGE_TOO_LARGE_MESSAGE,
  PROMOTION_IMAGE_TYPE_MESSAGE,
  PROMOTION_IMAGE_TYPES,
  parsePromotionLink,
  promotionDateOrderError,
  promotionImageErrorMessage,
  promotionPopupStatus,
  validatePromotionImageFile,
  type PromotionPopupStatus,
} from "@/lib/promotion-popup"
import type { PromotionPopupRecord } from "@/lib/promotion-popup-store"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

type ImageDraft = {
  storageKey: string | null
  filename: string
  bytes: number | null
  previewUrl: string
  file: File | null
}

const STATUS_LABEL: Record<PromotionPopupStatus, string> = {
  live: "Đang hiển thị",
  scheduled: "Đã lên lịch",
  off: "Đã tắt",
}

const STATUS_CLASS: Record<PromotionPopupStatus, string> = {
  live: "border-transparent bg-primary text-primary-foreground",
  scheduled: "border-transparent bg-secondary text-foreground",
  off: "border-border bg-transparent text-foreground",
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  const megabytes = bytes / (1024 * 1024)
  return `${megabytes >= 10 ? Math.round(megabytes) : megabytes.toFixed(1)} MB`
}

function isoFromDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function dateFromIso(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return undefined
  return new Date(year, month - 1, day)
}

function imageFromRecord(record: PromotionPopupRecord): ImageDraft | null {
  if (!record.imageStorageKey) return null
  return {
    storageKey: record.imageStorageKey,
    filename: record.imageFilename || "Ảnh popup",
    bytes: record.imageBytes,
    previewUrl: cmsImageDisplaySrc(record.imageStorageKey),
    file: null,
  }
}

export function PromotionPopupForm({ initial }: { initial: PromotionPopupRecord }) {
  const router = useRouter()
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const dragDepth = useRef(0)
  const [enabled, setEnabled] = useState(initial.enabled)
  const [alt, setAlt] = useState(initial.imageAlt)
  const [link, setLink] = useState(initial.linkUrl ?? "")
  const [startsOn, setStartsOn] = useState(initial.startsOn ?? "")
  const [endsOn, setEndsOn] = useState(initial.endsOn ?? "")
  const [image, setImage] = useState<ImageDraft | null>(() => imageFromRecord(initial))
  const [imageError, setImageError] = useState<"size" | "type" | null>(null)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [dateError, setDateError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [pending, startTransition] = useTransition()

  const status = promotionPopupStatus(
    {
      enabled,
      startsOn: startsOn || null,
      endsOn: endsOn || null,
    },
    new Date()
  )

  const replaceImage = async (file: File | undefined) => {
    if (!file) return
    const header = await readFileHeader(file)
    const detected = detectImageTypeFromBytes(header)
    const allowed = new Set<string>(PROMOTION_IMAGE_TYPES)
    if (!detected || !allowed.has(detected) || (file.type && file.type !== detected)) {
      setImageError("type")
      return
    }

    const prepared = await compressAdminImage(file)
    const validation = await validatePromotionImageFile(prepared)
    if (!validation.ok) {
      setImageError(validation.reason === "size" ? "size" : "type")
      return
    }

    setImage((current) => {
      if (current?.previewUrl.startsWith("blob:")) URL.revokeObjectURL(current.previewUrl)
      return {
        storageKey: null,
        filename: prepared.name,
        bytes: prepared.size,
        previewUrl: URL.createObjectURL(prepared),
        file: prepared,
      }
    })
    setImageError(null)
  }

  const onDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    dragDepth.current = 0
    setDragging(false)
    void replaceImage(event.dataTransfer.files?.[0])
  }

  const clearImage = () => {
    setImage((current) => {
      if (current?.previewUrl.startsWith("blob:")) URL.revokeObjectURL(current.previewUrl)
      return null
    })
    setImageError(null)
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsedLink = parsePromotionLink(link)
    const orderError = promotionDateOrderError(startsOn || null, endsOn || null)
    setLinkError(parsedLink.ok ? null : parsedLink.error)
    setDateError(orderError)
    if (!parsedLink.ok || orderError) return

    startTransition(async () => {
      try {
        let storageKey = image?.storageKey ?? null
        let filename = image?.filename ?? null
        let bytes = image?.bytes ?? null

        if (image?.file) {
          const [uploaded] = await persistUploadedImages(
            [
              {
                id: crypto.randomUUID(),
                url: image.previewUrl,
                file: image.file,
                name: image.file.name,
              },
            ],
            "promotions"
          )
          storageKey = uploaded
          filename = image.file.name
          bytes = image.file.size
        }

        const result = await savePromotionPopupAction({
          enabled,
          imageStorageKey: image ? storageKey : null,
          imageFilename: image ? filename : null,
          imageBytes: image ? bytes : null,
          imageAlt: alt,
          linkUrl: link,
          startsOn: startsOn || null,
          endsOn: endsOn || null,
        })

        if (!result.ok) {
          toastError(result.error)
          return
        }

        if (storageKey) {
          setImage((current) => {
            if (!current) return current
            if (current.previewUrl.startsWith("blob:")) {
              URL.revokeObjectURL(current.previewUrl)
            }
            return {
              storageKey,
              filename: current.file?.name || current.filename,
              bytes: current.file?.size ?? current.bytes,
              previewUrl: cmsImageDisplaySrc(storageKey),
              file: null,
            }
          })
        }

        toastSuccess("Đã lưu cài đặt.")
        router.refresh()
      } catch (error) {
        const outcome = reportAdminFailure(error, {
          fallback: "Không lưu được cài đặt.",
          onUnauthenticated: () => {
            toastError("Phiên đăng nhập đã hết hạn.")
            router.push("/admin/login")
          },
          onRetry: () => {
            onSubmit(event)
          },
        })
        if (outcome === "unauthenticated") return
        if (outcome === "busy") return
        const message = error instanceof Error ? error.message : "Không lưu được cài đặt."
        if (message === PROMOTION_IMAGE_TOO_LARGE_MESSAGE) setImageError("size")
        else if (message === PROMOTION_IMAGE_TYPE_MESSAGE) setImageError("type")
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 md:gap-6">
      <section className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_#0000000d] md:p-6">
        <div className="mb-3.5 flex items-start justify-between gap-4 md:mb-5">
          <div className="min-w-0">
            <h2 className="text-base font-semibold">Popup khuyến mãi</h2>
            <p className="mt-1 hidden text-sm leading-[1.45] text-muted-foreground md:block">
              Ảnh khuyến mãi hiện ở trang chủ mỗi lần khách mở trang. Khách đóng bằng nút ✕, phím Esc hoặc bấm ra ngoài.
            </p>
          </div>
          <span
            className={cn(
              "inline-flex h-5 shrink-0 items-center gap-1 rounded-full border px-2 text-xs font-medium whitespace-nowrap",
              STATUS_CLASS[status]
            )}
          >
            <i aria-hidden className="size-1.5 rounded-full bg-current opacity-80" />
            {STATUS_LABEL[status]}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-input bg-[#fdfaf6] px-3.5 py-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="promotion-enabled">Hiển thị popup</Label>
            <p
              id="promotion-enabled-hint"
              className="hidden text-xs leading-normal text-muted-foreground md:block"
            >
              Tắt để ẩn popup ngay, không cần xóa ảnh.
            </p>
          </div>
          <Switch
            id="promotion-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
            aria-describedby="promotion-enabled-hint"
            className="h-[18px]! w-8! border-0! shadow-none data-checked:bg-primary! data-unchecked:bg-[#d9c9c3]!"
            thumbClassName="absolute top-0.5 left-0.5 size-3.5! bg-ivory! data-checked:translate-x-3.5!"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:mt-5 md:grid-cols-[240px_1fr] md:gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor={inputId}>Ảnh popup</Label>
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                void replaceImage(event.target.files?.[0])
                event.target.value = ""
              }}
            />
            {image ? (
              <div className="flex items-end gap-3 md:block">
                <div className="relative aspect-[4/5] w-[150px] shrink-0 overflow-hidden rounded-xl border border-border bg-secondary md:w-full">
                  {/* Blob previews and upload variants are not passed through the image optimizer. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.previewUrl}
                    alt=""
                    className="absolute inset-0 size-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden items-end justify-between bg-gradient-to-t from-black/70 to-transparent px-3 pt-10 pb-2 text-xs text-white/90 md:flex">
                    <span className="truncate">{image.filename}</span>
                    {image.bytes != null ? (
                      <span className="shrink-0 pl-3 text-[10px] opacity-85">
                        {formatBytes(image.bytes)}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:mt-3 md:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-[104px] justify-center gap-1.5 rounded-lg border-border px-2.5 shadow-xs md:w-auto"
                    onClick={() => inputRef.current?.click()}
                  >
                    <RefreshCcw className="max-md:hidden" />
                    Thay ảnh
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-[104px] justify-center gap-1.5 rounded-lg border-transparent bg-[#d4183d1a] px-2.5 text-[#d4183d] shadow-none hover:bg-[#d4183d26] hover:text-[#d4183d] md:w-auto"
                    onClick={clearImage}
                  >
                    <Trash2 className="max-md:hidden" />
                    Xóa ảnh
                  </Button>
                </div>
              </div>
            ) : (
              <Dropzone
                inputId={inputId}
                error={imageError !== null}
                dragging={dragging}
                onDragEnter={(event) => {
                  event.preventDefault()
                  dragDepth.current += 1
                  setDragging(true)
                }}
                onDragOver={(event) => {
                  event.preventDefault()
                  event.dataTransfer.dropEffect = "copy"
                }}
                onDragLeave={(event) => {
                  event.preventDefault()
                  dragDepth.current -= 1
                  if (dragDepth.current <= 0) {
                    dragDepth.current = 0
                    setDragging(false)
                  }
                }}
                onDrop={onDrop}
              />
            )}
            <p className="hidden text-xs leading-normal text-muted-foreground md:block">
              JPG, PNG, WebP — tối đa 5MB. Nên dùng ảnh dọc 4:5, ví dụ 1080 × 1350px.
            </p>
            {imageError ? (
              <p role="alert" className="flex items-center gap-1.5 text-sm text-[#d4183d]">
                <CircleAlert className="size-4 shrink-0" />
                {promotionImageErrorMessage(imageError)}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-4 md:gap-[18px]">
            <div className="flex flex-col gap-2">
              <Label htmlFor="promotion-alt">Mô tả ảnh</Label>
              <Input
                id="promotion-alt"
                value={alt}
                maxLength={500}
                onChange={(event) => setAlt(event.target.value)}
              />
              <p className="hidden text-xs leading-normal text-muted-foreground md:block">
                Không bắt buộc. Dùng cho trình đọc màn hình, nên ghi lại nội dung chữ trên ảnh.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="promotion-link">Liên kết khi bấm vào ảnh (không bắt buộc)</Label>
              <Input
                id="promotion-link"
                value={link}
                inputMode="url"
                placeholder="https://linhouse.com.vn/..."
                aria-invalid={linkError ? true : undefined}
                maxLength={2048}
                onChange={(event) => {
                  setLink(event.target.value)
                  setLinkError(null)
                }}
              />
              <p className="hidden text-xs leading-normal text-muted-foreground md:block">
                Để trống thì ảnh không bấm được.
              </p>
              {linkError ? (
                <p role="alert" className="flex items-center gap-1.5 text-sm text-[#d4183d]">
                  <CircleAlert className="size-4 shrink-0" />
                  {linkError}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-3">
                <DateField
                  id="promotion-start"
                  label="Ngày bắt đầu"
                  value={startsOn}
                  onChange={(value) => {
                    setStartsOn(value)
                    setDateError(null)
                  }}
                />
                <DateField
                  id="promotion-end"
                  label="Ngày kết thúc"
                  value={endsOn}
                  onChange={(value) => {
                    setEndsOn(value)
                    setDateError(null)
                  }}
                />
              </div>
              <p className="text-xs leading-normal text-muted-foreground">
                Để trống để hiển thị không giới hạn.
              </p>
              {dateError ? (
                <p role="alert" className="flex items-center gap-1.5 text-sm text-[#d4183d]">
                  <CircleAlert className="size-4 shrink-0" />
                  {dateError}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div>
        <Button type="submit" disabled={pending} className="h-9 rounded-lg px-2.5">
          Lưu cài đặt
        </Button>
      </div>
    </form>
  )
}

function Dropzone({
  inputId,
  error,
  dragging,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  inputId: string
  error: boolean
  dragging: boolean
  onDragEnter: (event: DragEvent<HTMLLabelElement>) => void
  onDragOver: (event: DragEvent<HTMLLabelElement>) => void
  onDragLeave: (event: DragEvent<HTMLLabelElement>) => void
  onDrop: (event: DragEvent<HTMLLabelElement>) => void
}) {
  return (
    <label
      htmlFor={inputId}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-2.5 rounded-xl border-2 border-dashed px-[18px] py-7 text-center",
        error
          ? "border-[#d4183d] bg-[#d4183d0d]"
          : "border-border bg-[#e9d9d34d]",
        dragging && !error && "border-primary"
      )}
    >
      <span
        className={cn(
          "grid size-11 place-items-center rounded-full bg-ivory text-primary shadow-[0_0_0_1px_var(--border)]",
          error && "text-[#d4183d] shadow-[0_0_0_1px_#d4183d66]"
        )}
      >
        <ImagePlus className="size-5" />
      </span>
      <span className="text-sm font-medium">
        Kéo thả ảnh popup vào đây, hoặc <span className="text-primary">chọn tệp</span>
      </span>
      <span className="text-xs text-muted-foreground">JPG, PNG, WebP — tối đa 5MB.</span>
    </label>
  )
}

function DateField({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = value ? dateFromIso(value) : undefined

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              className={cn(
                "h-9 w-full justify-start gap-2 rounded-md border-input bg-transparent px-2.5 text-sm font-normal shadow-xs hover:bg-transparent",
                !selected && "text-muted-foreground"
              )}
            />
          }
        >
          <CalendarIcon className="size-4 text-muted-foreground" />
          {selected ? format(selected, "dd/MM/yyyy") : "Chọn ngày"}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(next) => {
              if (!next) return
              onChange(isoFromDate(next))
              setOpen(false)
            }}
          />
          {value ? (
            <div className="border-t border-border p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  onChange("")
                  setOpen(false)
                }}
              >
                Xóa ngày
              </Button>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  )
}
