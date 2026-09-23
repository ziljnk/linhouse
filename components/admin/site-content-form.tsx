"use client"

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react"
import { Info } from "lucide-react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { saveSiteContentAction } from "@/app/admin/(dashboard)/content/actions"
import {
  ABOUT_FAQ_ANSWER_MAX,
  ABOUT_FAQ_QUESTION_MAX,
  ABOUT_MILESTONE_ALT_MAX,
  ABOUT_MILESTONE_BODY_MAX,
  ABOUT_MILESTONE_TITLE_MAX,
  ABOUT_MILESTONE_YEAR_MAX,
  DEFAULT_ABOUT_MILESTONE_IMAGE,
  MAX_ABOUT_FAQ_ITEMS,
  MAX_ABOUT_MILESTONES,
  aboutFaqItemKey,
  aboutFaqItemsFrom,
  aboutMilestoneKey,
  aboutMilestonesFrom,
  withAboutFaqItems,
  withAboutMilestones,
} from "@/lib/about-list-items"
import { ADMIN_IMAGE_SIZE_HINTS } from "@/lib/admin-image-sizes"
import { toastError, toastInfo, toastSuccess } from "@/lib/admin-toast"
import { cmsImageDisplaySrc, getImageUrl } from "@/lib/cms-image"
import type { ContentField, ContentPair, ContentSection } from "@/lib/site-content"
import {
  MAX_SHIPPING_SECTIONS,
  shippingSectionKey,
  shippingSectionsFrom,
  withShippingSections,
} from "@/lib/shipping-policy-sections"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  ImageUploader,
  createUploadedImageFromUrl,
  type UploadedImage,
} from "@/components/admin/image-uploader"
import { persistUploadedImages } from "@/lib/persist-admin-images"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const RichTextEditor = dynamic(
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

function cloneValues(values: Record<string, ContentPair>) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, { ...value }])
  )
}

export function SiteContentForm({
  sections,
  defaultValues,
  defaults,
}: {
  sections: ContentSection[]
  defaultValues: Record<string, ContentPair>
  defaults: Record<string, ContentPair>
}) {
  const router = useRouter()
  const [values, setValues] = useState(() => cloneValues(defaultValues))
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? "")
  const [locale, setLocale] = useState<"vi" | "en">("vi")
  const [pending, setPending] = useState(false)
  const [imageUploads, setImageUploads] = useState(0)
  const [editorEpoch, setEditorEpoch] = useState(0)
  const section = sections.find((item) => item.id === sectionId) ?? sections[0]
  const busy = pending || imageUploads > 0

  const updateField = (key: string, next: string) => {
    setValues((current) => ({
      ...current,
      [key]: {
        ...(current[key] ?? { vi: "", en: "" }),
        [locale]: next,
      },
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPending(true)
    try {
      const result = await saveSiteContentAction(values)
      if (!result.ok) {
        toastError(result.error)
        return
      }
      toastSuccess("Đã lưu nội dung.", "Chữ mới sẽ hiện trên website.")
      router.refresh()
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Không lưu được nội dung.")
    } finally {
      setPending(false)
    }
  }

  if (!section) return null

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <nav className="flex gap-2 overflow-x-auto md:sticky md:top-4 md:z-10 md:bg-background lg:max-h-[calc(100svh-2rem)] lg:w-52 lg:shrink-0 lg:flex-col lg:overflow-y-auto">
          {sections.map((item) => {
            const active = item.id === section.id
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSectionId(item.id)}
                className={cn(
                  "rounded-md px-3 py-2 text-left text-sm whitespace-nowrap lg:whitespace-normal",
                  active
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/60"
                )}
              >
                {item.title}
              </button>
            )
          })}
        </nav>

        <section className="min-w-0 flex-1 rounded-xl border border-border bg-card p-6 shadow-xs">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">{section.title}</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {section.description}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => {
                  setValues((current) => {
                    const next = { ...current }
                    for (const item of section.fields) {
                      next[item.key] = { ...defaults[item.key] }
                    }
                    if (section.id === "shipping") {
                      return withShippingSections(next, shippingSectionsFrom(defaults))
                    }
                    if (section.id === "about") {
                      return withAboutFaqItems(
                        withAboutMilestones(next, aboutMilestonesFrom(defaults)),
                        aboutFaqItemsFrom(defaults)
                      )
                    }
                    return next
                  })
                  setEditorEpoch((epoch) => epoch + 1)
                  toastInfo(
                    "Đã khôi phục mục này trong form.",
                    "Bấm Lưu để cập nhật website."
                  )
                }}
              >
                Khôi phục mặc định
              </Button>
              <Button type="submit" size="sm" disabled={busy}>
                {pending ? "Đang lưu..." : imageUploads > 0 ? "Đang tải ảnh..." : "Lưu"}
              </Button>
            </div>
          </div>

          <Tabs
            value={locale}
            onValueChange={(value) => {
              if (value === "vi" || value === "en") setLocale(value)
            }}
            className="gap-4"
          >
            <TabsList>
              <TabsTrigger value="vi" type="button">
                Tiếng Việt
              </TabsTrigger>
              <TabsTrigger value="en" type="button">
                Tiếng Anh
              </TabsTrigger>
            </TabsList>
            <TabsContent value={locale} className="flex flex-col gap-4">
              {fieldGroups(section.fields).map((group) => (
                <div key={group.title ?? "fields"} className="flex flex-col gap-4">
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    {group.title ? (
                      <h3 className="mb-4 text-sm font-medium">{group.title}</h3>
                    ) : null}
                    <div className="grid gap-4 sm:grid-cols-2">
                      {group.fields.map((item) => (
                        <ContentInput
                          key={`${item.key}-${locale}-${editorEpoch}`}
                          field={item}
                          value={values[item.key]?.[locale] ?? ""}
                          onChange={(next) => updateField(item.key, next)}
                        />
                      ))}
                    </div>
                  </div>
                  {section.id === "about" && group.title === "Hành trình" ? (
                    <AboutMilestonesEditor
                      locale={locale}
                      values={values}
                      pending={busy}
                      onChange={updateField}
                      onImageChange={(index, url) => {
                        setValues((current) => ({
                          ...current,
                          [aboutMilestoneKey(index, "image")]: { vi: url, en: url },
                        }))
                      }}
                      onUploadChange={(active) => {
                        setImageUploads((count) => count + (active ? 1 : -1))
                      }}
                      onAdd={() => {
                        setValues((current) => {
                          const milestones = aboutMilestonesFrom(current)
                          if (milestones.length >= MAX_ABOUT_MILESTONES) return current
                          return withAboutMilestones(current, [
                            ...milestones,
                            {
                              year: { vi: "", en: "" },
                              title: { vi: "", en: "" },
                              body: { vi: "", en: "" },
                              imageAlt: { vi: "", en: "" },
                              image: DEFAULT_ABOUT_MILESTONE_IMAGE,
                            },
                          ])
                        })
                      }}
                      onRemove={(index) => {
                        setValues((current) =>
                          withAboutMilestones(
                            current,
                            aboutMilestonesFrom(current).filter((_, itemIndex) => itemIndex !== index)
                          )
                        )
                      }}
                    />
                  ) : null}
                  {section.id === "about" && group.title === "Câu hỏi thường gặp" ? (
                    <AboutFaqItemsEditor
                      locale={locale}
                      values={values}
                      pending={pending}
                      onChange={updateField}
                      onAdd={() => {
                        setValues((current) => {
                          const items = aboutFaqItemsFrom(current)
                          if (items.length >= MAX_ABOUT_FAQ_ITEMS) return current
                          return withAboutFaqItems(current, [
                            ...items,
                            { question: { vi: "", en: "" }, answer: { vi: "", en: "" } },
                          ])
                        })
                      }}
                      onRemove={(index) => {
                        setValues((current) =>
                          withAboutFaqItems(
                            current,
                            aboutFaqItemsFrom(current).filter((_, itemIndex) => itemIndex !== index)
                          )
                        )
                      }}
                    />
                  ) : null}
                </div>
              ))}
              {section.id === "shipping" ? (
                <ShippingSectionsEditor
                  locale={locale}
                  values={values}
                  pending={pending}
                  onChange={updateField}
                  onAdd={() => {
                    setValues((current) => {
                      const sections = shippingSectionsFrom(current)
                      if (sections.length >= MAX_SHIPPING_SECTIONS) return current
                      return withShippingSections(current, [
                        ...sections,
                        { title: { vi: "", en: "" }, body: { vi: "", en: "" } },
                      ])
                    })
                  }}
                  onRemove={(index) => {
                    setValues((current) =>
                      withShippingSections(
                        current,
                        shippingSectionsFrom(current).filter((_, itemIndex) => itemIndex !== index)
                      )
                    )
                  }}
                />
              ) : null}
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </form>
  )
}

function AboutMilestonesEditor({
  locale,
  values,
  pending,
  onChange,
  onImageChange,
  onUploadChange,
  onAdd,
  onRemove,
}: {
  locale: "vi" | "en"
  values: Record<string, ContentPair>
  pending: boolean
  onChange: (key: string, value: string) => void
  onImageChange: (index: number, url: string) => void
  onUploadChange: (active: boolean) => void
  onAdd: () => void
  onRemove: (index: number) => void
}) {
  const milestones = aboutMilestonesFrom(values)
  const atLimit = milestones.length >= MAX_ABOUT_MILESTONES

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">Các mốc năm</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Thêm hoặc xóa mốc, rồi tải ảnh cho từng năm. Tối đa {MAX_ABOUT_MILESTONES} mốc.
            Bấm Lưu để cập nhật website.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" disabled={pending || atLimit} onClick={onAdd}>
          Thêm mốc
        </Button>
      </div>
      {milestones.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có mốc. Bấm Thêm mốc để tạo.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {milestones.map((item, index) => (
            <div key={aboutMilestoneKey(index, "year")} className="rounded-md border border-border bg-background p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Mốc {index + 1}</p>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={pending}
                  onClick={() => onRemove(index)}
                >
                  Xóa mốc
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <ContentInput
                  field={{
                    key: aboutMilestoneKey(index, "year"),
                    label: "Năm",
                    maxLength: ABOUT_MILESTONE_YEAR_MAX,
                  }}
                  value={item.year[locale] ?? ""}
                  onChange={(next) => onChange(aboutMilestoneKey(index, "year"), next)}
                />
                <ContentInput
                  field={{
                    key: aboutMilestoneKey(index, "title"),
                    label: "Tiêu đề",
                    maxLength: ABOUT_MILESTONE_TITLE_MAX,
                  }}
                  value={item.title[locale] ?? ""}
                  onChange={(next) => onChange(aboutMilestoneKey(index, "title"), next)}
                />
                <ContentInput
                  field={{
                    key: aboutMilestoneKey(index, "body"),
                    label: "Nội dung",
                    multiline: true,
                    maxLength: ABOUT_MILESTONE_BODY_MAX,
                  }}
                  value={item.body[locale] ?? ""}
                  onChange={(next) => onChange(aboutMilestoneKey(index, "body"), next)}
                />
                <ContentInput
                  field={{
                    key: aboutMilestoneKey(index, "imageAlt"),
                    label: "Mô tả ảnh",
                    maxLength: ABOUT_MILESTONE_ALT_MAX,
                  }}
                  value={item.imageAlt[locale] ?? ""}
                  onChange={(next) => onChange(aboutMilestoneKey(index, "imageAlt"), next)}
                />
                <MilestoneImageField
                  image={item.image}
                  pending={pending}
                  onUploadChange={onUploadChange}
                  onChange={(url) => onImageChange(index, url)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MilestoneImageField({
  image,
  pending,
  onChange,
  onUploadChange,
}: {
  image: string
  pending: boolean
  onChange: (url: string) => void
  onUploadChange: (active: boolean) => void
}) {
  const [images, setImages] = useState<UploadedImage[]>(() => milestonePreview(image))
  const [uploading, setUploading] = useState(false)
  const pendingUrl = useRef<string | null>(null)

  useEffect(() => {
    if (uploading) return
    if (pendingUrl.current && image !== pendingUrl.current) return
    pendingUrl.current = null
    setImages((current) => {
      const shown = current[0]?.url ?? ""
      if (shown === image || shown === cmsImageDisplaySrc(image)) return current
      return milestonePreview(image)
    })
  }, [image, uploading])

  return (
    <div className={cn("flex flex-col gap-2 sm:col-span-2", (pending || uploading) && "pointer-events-none opacity-70")}>
      <Label>Ảnh</Label>
      <ImageUploader
        images={images}
        maxFiles={1}
        aspect="wide"
        showCoverBadge={false}
        dropLabel="Kéo thả ảnh của mốc vào đây, hoặc "
        sizeHint={ADMIN_IMAGE_SIZE_HINTS.aboutMilestone}
        onChange={(next) => {
          void replaceMilestoneImage(next, image, {
            setImages,
            setUploading,
            onChange,
            onUploadChange,
            rememberUrl: (url) => {
              pendingUrl.current = url
            },
          })
        }}
      />
    </div>
  )
}

function milestonePreview(image: string) {
  const url = image.trim()
  if (!url) return []
  return [createUploadedImageFromUrl(cmsImageDisplaySrc(url), "milestone")]
}

async function replaceMilestoneImage(
  next: UploadedImage[],
  current: string,
  handlers: {
    setImages: (images: UploadedImage[]) => void
    setUploading: (uploading: boolean) => void
    onChange: (url: string) => void
    onUploadChange: (active: boolean) => void
    rememberUrl: (url: string) => void
  }
) {
  const picked = next[0]
  if (!picked) {
    handlers.rememberUrl(DEFAULT_ABOUT_MILESTONE_IMAGE)
    handlers.setImages(milestonePreview(DEFAULT_ABOUT_MILESTONE_IMAGE))
    handlers.onChange(DEFAULT_ABOUT_MILESTONE_IMAGE)
    return
  }
  if (!picked.file) {
    handlers.setImages(next)
    return
  }

  handlers.setImages(next)
  handlers.setUploading(true)
  handlers.onUploadChange(true)
  try {
    const [storageKey] = await persistUploadedImages([picked], "about")
    const url = getImageUrl(storageKey)
    handlers.rememberUrl(url)
    handlers.setImages([createUploadedImageFromUrl(url, picked.name)])
    handlers.onChange(url)
  } catch (error) {
    handlers.setImages(milestonePreview(current))
    toastError(error instanceof Error ? error.message : "Không tải được ảnh lên.")
  } finally {
    handlers.setUploading(false)
    handlers.onUploadChange(false)
  }
}

function AboutFaqItemsEditor({
  locale,
  values,
  pending,
  onChange,
  onAdd,
  onRemove,
}: {
  locale: "vi" | "en"
  values: Record<string, ContentPair>
  pending: boolean
  onChange: (key: string, value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
}) {
  const items = aboutFaqItemsFrom(values)
  const atLimit = items.length >= MAX_ABOUT_FAQ_ITEMS

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">Danh sách câu hỏi</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Thêm hoặc xóa câu hỏi. Tối đa {MAX_ABOUT_FAQ_ITEMS} câu.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" disabled={pending || atLimit} onClick={onAdd}>
          Thêm câu hỏi
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có câu hỏi. Bấm Thêm câu hỏi để tạo.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item, index) => (
            <div key={aboutFaqItemKey(index, "question")} className="rounded-md border border-border bg-background p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Câu hỏi {index + 1}</p>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={pending}
                  onClick={() => onRemove(index)}
                >
                  Xóa câu hỏi
                </Button>
              </div>
              <div className="grid gap-4">
                <ContentInput
                  field={{
                    key: aboutFaqItemKey(index, "question"),
                    label: "Câu hỏi",
                    multiline: true,
                    maxLength: ABOUT_FAQ_QUESTION_MAX,
                  }}
                  value={item.question[locale] ?? ""}
                  onChange={(next) => onChange(aboutFaqItemKey(index, "question"), next)}
                />
                <ContentInput
                  field={{
                    key: aboutFaqItemKey(index, "answer"),
                    label: "Câu trả lời",
                    multiline: true,
                    maxLength: ABOUT_FAQ_ANSWER_MAX,
                  }}
                  value={item.answer[locale] ?? ""}
                  onChange={(next) => onChange(aboutFaqItemKey(index, "answer"), next)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ShippingSectionsEditor({
  locale,
  values,
  pending,
  onChange,
  onAdd,
  onRemove,
}: {
  locale: "vi" | "en"
  values: Record<string, ContentPair>
  pending: boolean
  onChange: (key: string, value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
}) {
  const sections = shippingSectionsFrom(values)
  const atLimit = sections.length >= MAX_SHIPPING_SECTIONS

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">Các mục</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Mỗi mục có tiêu đề và nội dung. Tối đa {MAX_SHIPPING_SECTIONS} mục.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" disabled={pending || atLimit} onClick={onAdd}>
          Thêm mục
        </Button>
      </div>
      {sections.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có mục. Bấm Thêm mục để tạo.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {sections.map((item, index) => (
            <div key={shippingSectionKey(index, "title")} className="rounded-md border border-border bg-background p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Mục {index + 1}</p>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={pending}
                  onClick={() => onRemove(index)}
                >
                  Xóa mục
                </Button>
              </div>
              <div className="grid gap-4">
                <ContentInput
                  field={{
                    key: shippingSectionKey(index, "title"),
                    label: "Tiêu đề",
                    maxLength: 180,
                  }}
                  value={item.title[locale] ?? ""}
                  onChange={(next) => onChange(shippingSectionKey(index, "title"), next)}
                />
                <ContentInput
                  field={{
                    key: shippingSectionKey(index, "body"),
                    label: "Nội dung",
                    multiline: true,
                    maxLength: 2000,
                  }}
                  value={item.body[locale] ?? ""}
                  onChange={(next) => onChange(shippingSectionKey(index, "body"), next)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function fieldGroups(fields: ContentField[]) {
  const groups: { title?: string; fields: ContentField[] }[] = []

  for (const item of fields) {
    const current = groups[groups.length - 1]
    if (current && current.title === item.group) {
      current.fields.push(item)
      continue
    }
    groups.push({ title: item.group, fields: [item] })
  }

  return groups
}

function ContentInput({
  field,
  value,
  onChange,
}: {
  field: ContentField
  value: string
  onChange: (value: string) => void
}) {
  const id = `content-${field.key.replaceAll(".", "-")}`
  if (field.rich) {
    return (
      <Field id={id} label={field.label} hint={field.hint} tooltip={field.tooltip} wide>
        <RichTextEditor
          id={id}
          label={field.label}
          placeholder="Viết nội dung trang..."
          initialContent={value}
          onChange={onChange}
        />
      </Field>
    )
  }
  const control = field.multiline ? (
    <Textarea
      id={id}
      name={id}
      value={value}
      rows={field.lines ? 6 : 4}
      onChange={(event) => onChange(event.target.value)}
    />
  ) : (
    <Input
      id={id}
      name={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  )

  return (
    <Field
      id={id}
      label={field.label}
      hint={field.hint}
      tooltip={field.tooltip}
      wide={field.multiline}
    >
      {control}
    </Field>
  )
}

function Field({
  id,
  label,
  hint,
  tooltip,
  wide,
  children,
}: {
  id: string
  label: string
  hint?: string
  tooltip?: string
  wide?: boolean
  children: ReactNode
}) {
  return (
    <div className={cn("flex flex-col gap-2", wide && "sm:col-span-2")}>
      <div className="flex items-center gap-1.5">
        <Label htmlFor={id}>{label}</Label>
        {tooltip ? <FieldInfoHint text={tooltip} label={label} /> : null}
      </div>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function FieldInfoHint({ text, label }: { text: string; label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        aria-label={`Thông tin về ${label}`}
        className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
      >
        <Info className="size-3.5" aria-hidden />
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="start"
        className="block max-w-xs text-left leading-relaxed whitespace-normal"
      >
        {text}
      </TooltipContent>
    </Tooltip>
  )
}
