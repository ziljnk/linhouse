"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Languages, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@/components/ui/combobox"
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
  createProductAction,
  updateProductAction,
} from "@/app/admin/(dashboard)/products/actions"
import { translateViToEnAction } from "@/app/admin/(dashboard)/translate/actions"
import { persistUploadedImages } from "@/lib/persist-admin-images"
import { ADMIN_IMAGE_SIZE_HINTS } from "@/lib/admin-image-sizes"
import {
  formatPriceInput,
  parsePriceVnd,
  PRICE_DISPLAY_LABELS,
  PRICE_DISPLAYS,
  PRODUCT_KIND_LABELS,
  PRODUCT_KINDS,
  PRODUCT_PURCHASE_OPTION_LABELS,
  PRODUCT_PURCHASE_OPTIONS,
  type PriceDisplay,
  type ProductKind,
  type ProductPurchaseOption,
} from "@/lib/admin-products"
import { toastError, toastSuccess } from "@/lib/admin-toast"
import { isLivePublished, type PublishIntent } from "@/lib/content-status"
import { PublishIntentActions } from "@/components/admin/publish-intent-actions"
import {
  SchedulePublishDialog,
  datetimeLocalToIso,
  defaultScheduleValue,
  toDatetimeLocalValue,
} from "@/components/admin/schedule-publish-dialog"
import type {
  AdminAttributeGroupOption,
  AdminCollectionOption,
} from "@/lib/admin-storefront"
import { nextAutoSlug, slugify } from "@/lib/slug"
import { cn } from "@/lib/utils"

const PRODUCT_TAGS = [
  "New In",
  "Bán chạy",
  "Limited",
  "May đo",
  "Có sẵn",
  "Bridal",
  "Áo dài",
  "After Party",
  "Couture",
  "Minimal",
  "Lãng mạn",
  "Cổ điển",
  "Lễ đường",
  "Ngoài trời",
  "Beach wedding",
]

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

type ComboboxOption = {
  value: string
  label: string
}

function MultiSelectCombobox({
  id,
  items,
  value,
  onValueChange,
  placeholder,
  emptyText,
}: {
  id: string
  items: ComboboxOption[]
  value: string[]
  onValueChange: (value: string[]) => void
  placeholder: string
  emptyText: string
}) {
  const selected = value
    .map((id) => items.find((item) => item.value === id))
    .filter((item): item is ComboboxOption => item != null)

  return (
    <Combobox
      items={items}
      multiple
      autoHighlight
      value={selected}
      onValueChange={(next) =>
        onValueChange((next ?? []).map((item) => item.value))
      }
      isItemEqualToValue={(a, b) => a.value === b.value}
    >
      <ComboboxChips className="w-full">
        <ComboboxValue>
          {(selectedValue: ComboboxOption[]) =>
            selectedValue.map((item) => (
              <ComboboxChip key={item.value}>{item.label}</ComboboxChip>
            ))
          }
        </ComboboxValue>
        <ComboboxChipsInput id={id} placeholder={placeholder} />
      </ComboboxChips>
      <ComboboxContent>
        <ComboboxEmpty>{emptyText}</ComboboxEmpty>
        <ComboboxList>
          {(item: ComboboxOption) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

export type ProductFormValues = {
  id?: string
  name?: string
  code?: string
  descriptionVi?: string
  descriptionEn?: string
  attributeIds?: string[]
  collectionIds?: string[]
  tags?: string[]
  purchaseOptions?: ProductPurchaseOption[]
  imageUrls?: string[]
  priceVnd?: number | null
  priceDisplay?: PriceDisplay
  kind?: ProductKind
  slug?: string
  status?: "draft" | "published"
  publishedAt?: string | null
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
}

export function ProductForm({
  groups,
  collections: collectionOptions,
  defaultValues,
}: {
  groups: AdminAttributeGroupOption[]
  collections: AdminCollectionOption[]
  defaultValues?: ProductFormValues
}) {
  const router = useRouter()
  const [name, setName] = useState(defaultValues?.name ?? "")
  const [code, setCode] = useState(defaultValues?.code ?? "")
  const [descriptionVi, setDescriptionVi] = useState(
    defaultValues?.descriptionVi ?? ""
  )
  const [descriptionEn, setDescriptionEn] = useState(
    defaultValues?.descriptionEn ?? ""
  )
  const [attributeIds, setAttributeIds] = useState<string[]>(
    defaultValues?.attributeIds ?? []
  )
  const [collectionIds, setCollectionIds] = useState<string[]>(
    defaultValues?.collectionIds ?? []
  )
  const [tags, setTags] = useState<string[]>(defaultValues?.tags ?? [])
  const [purchaseOptions, setPurchaseOptions] = useState<ProductPurchaseOption[]>(
    defaultValues?.purchaseOptions ?? []
  )
  const [images, setImages] = useState<UploadedImage[]>(
    (defaultValues?.imageUrls ?? []).map((url) => createUploadedImageFromUrl(url))
  )
  const [slug, setSlug] = useState(defaultValues?.slug ?? "")
  const [priceDisplay, setPriceDisplay] = useState<PriceDisplay>(
    defaultValues?.priceDisplay ?? "contact"
  )
  const [priceInput, setPriceInput] = useState(
    defaultValues?.priceVnd ? formatPriceInput(String(defaultValues.priceVnd)) : ""
  )
  const [kind, setKind] = useState<ProductKind>(defaultValues?.kind ?? "gown")
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
  const [descriptionTab, setDescriptionTab] = useState<"vi" | "en">("vi")

  const handleTranslateToEnglish = async () => {
    if (!descriptionVi.trim() || translating) return
    setTranslating(true)
    try {
      const result = await translateViToEnAction(descriptionVi)
      if (!result.ok) {
        toastError(result.error)
        return
      }
      setDescriptionEn(result.data.text)
      setDescriptionTab("en")
      toastSuccess("Đã dịch sang tiếng Anh.")
    } catch {
      toastError("Không dịch được. Vui lòng thử lại.")
    } finally {
      setTranslating(false)
    }
  }

  const setGroupAttribute = (
    group: AdminAttributeGroupOption,
    value: string | string[] | null
  ) => {
    const groupAttrIds = new Set(group.attributes.map((item) => item.id))
    const nextValues = Array.isArray(value) ? value : value ? [value] : []
    setAttributeIds((current) => [
      ...current.filter((id) => !groupAttrIds.has(id)),
      ...nextValues,
    ])
  }

  const selectedIdsForGroup = (group: AdminAttributeGroupOption) =>
    attributeIds.filter((id) => group.attributes.some((item) => item.id === id))

  const selectedForGroup = (group: AdminAttributeGroupOption) =>
    selectedIdsForGroup(group)[0] ?? ""

  const visibleGroups = groups.filter((group) => group.kind === kind)

  const handleKindChange = (value: ProductKind) => {
    setKind(value)
    const allowed = new Set(
      groups
        .filter((group) => group.kind === value)
        .flatMap((group) => group.attributes.map((item) => item.id))
    )
    setAttributeIds((current) => current.filter((id) => allowed.has(id)))
  }

  const persistAndSave = async (intent: PublishIntent, publishedAt?: string | null) => {
    if (!name.trim()) {
      toastError("Vui lòng nhập tên sản phẩm.")
      return
    }

    if (intent !== "draft" && images.length === 0) {
      toastError("Vui lòng tải lên ít nhất một ảnh sản phẩm.")
      return
    }

    if (priceDisplay === "amount" && parsePriceVnd(priceInput) == null) {
      toastError("Vui lòng nhập giá sản phẩm.")
      return
    }

    setPending(true)
    try {
      const imageUrls = images.length
        ? await persistUploadedImages(images, "products")
        : []
      const payload = {
        name,
        code,
        slug,
        descriptionVi,
        descriptionEn,
        attributeIds,
        collectionIds,
        tags,
        purchaseOptions,
        imageUrls,
        priceVnd: parsePriceVnd(priceInput),
        priceDisplay,
        kind,
        intent,
        publishedAt,
        seoTitle,
        seoDescription,
        seoKeywords,
      }
      const result = defaultValues?.id
        ? await updateProductAction(defaultValues.id, payload)
        : await createProductAction(payload)

      if (!result.ok) {
        toastError(result.error)
        return
      }

      setScheduleOpen(false)
      setScheduleError(null)
      if (intent === "publish") {
        toastSuccess("Đã đăng sản phẩm.")
      } else if (intent === "schedule") {
        toastSuccess("Đã hẹn lịch đăng sản phẩm.")
      } else {
        toastSuccess("Đã lưu nháp.", "Sản phẩm chưa hiện trên website.")
      }
      if (!defaultValues?.id) {
        router.push("/admin/products")
      } else if (result.data.slug !== defaultValues.slug) {
        router.replace(`/admin/products/${result.data.slug}/edit`)
      }
      router.refresh()
    } catch (error) {
      toastError(
        error instanceof Error ? error.message : "Không lưu được sản phẩm."
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
    if (!name.trim()) {
      toastError("Vui lòng nhập tên sản phẩm.")
      return
    }
    if (images.length === 0) {
      toastError("Vui lòng tải lên ít nhất một ảnh sản phẩm.")
      return
    }
    if (priceDisplay === "amount" && parsePriceVnd(priceInput) == null) {
      toastError("Vui lòng nhập giá sản phẩm.")
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
          <h2 className="text-base font-semibold">Thông tin sản phẩm</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tên, phân loại và bộ sưu tập hiển thị trên website.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="product-name">Tên sản phẩm</Label>
            <Input
              id="product-name"
              name="name"
              value={name}
              onChange={(event) => {
                const nextName = event.target.value
                setSlug((current) => nextAutoSlug(name, current, nextName))
                setName(nextName)
              }}
              placeholder="Fern — Luxury Ivory Ballgown Dress"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="product-code">Mã sản phẩm</Label>
            <Input
              id="product-code"
              name="code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="VLTX-811"
            />
          </div>

          <fieldset className="flex flex-col gap-3 sm:col-span-2">
            <legend className="text-sm font-medium">Loại sản phẩm</legend>
            <RadioGroup
              value={kind}
              onValueChange={(value) => {
                if (value === "gown" || value === "ao-dai") {
                  handleKindChange(value)
                }
              }}
              className="grid gap-2 sm:grid-cols-2"
            >
              {PRODUCT_KINDS.map((option) => (
                <Label
                  key={option}
                  htmlFor={`product-kind-${option}`}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 font-normal"
                >
                  <RadioGroupItem id={`product-kind-${option}`} value={option} />
                  <span>{PRODUCT_KIND_LABELS[option]}</span>
                </Label>
              ))}
            </RadioGroup>
          </fieldset>

          <fieldset className="flex flex-col gap-3 sm:col-span-2">
            <legend className="text-sm font-medium">Giá</legend>
            <RadioGroup
              value={priceDisplay}
              onValueChange={(value) => {
                if (value === "contact" || value === "amount") {
                  setPriceDisplay(value)
                }
              }}
              className="grid gap-2 sm:grid-cols-2"
            >
              {PRICE_DISPLAYS.map((option) => (
                <Label
                  key={option}
                  htmlFor={`product-price-${option}`}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 font-normal"
                >
                  <RadioGroupItem id={`product-price-${option}`} value={option} />
                  <span>{PRICE_DISPLAY_LABELS[option]}</span>
                </Label>
              ))}
            </RadioGroup>
            {priceDisplay === "amount" ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="product-price">Giá (VND)</Label>
                <Input
                  id="product-price"
                  name="priceVnd"
                  inputMode="numeric"
                  value={priceInput}
                  onChange={(event) =>
                    setPriceInput(formatPriceInput(event.target.value))
                  }
                  placeholder="18.000.000"
                />
                <p className="text-xs text-muted-foreground">
                  Giá khách thấy trên website, ví dụ 18.000.000.
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Khách sẽ thấy chữ “Liên hệ” thay cho số tiền.
              </p>
            )}
          </fieldset>

          <fieldset className="flex flex-col gap-3 sm:col-span-2">
            <legend className="text-sm font-medium">Hình thức</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {PRODUCT_PURCHASE_OPTIONS.map((option) => {
                const checked = purchaseOptions.includes(option)
                return (
                  <Label
                    key={option}
                    htmlFor={`product-purchase-${option}`}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 font-normal"
                  >
                    <Checkbox
                      id={`product-purchase-${option}`}
                      checked={checked}
                      onCheckedChange={(value) => {
                        setPurchaseOptions((current) => {
                          const next = new Set(current)
                          if (value === true) next.add(option)
                          else next.delete(option)
                          return PRODUCT_PURCHASE_OPTIONS.filter((item) =>
                            next.has(item)
                          )
                        })
                      }}
                    />
                    <span>{PRODUCT_PURCHASE_OPTION_LABELS[option]}</span>
                  </Label>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Chọn một hoặc nhiều hình thức. Các mục đã chọn sẽ hiện trên trang sản phẩm.
            </p>
          </fieldset>

          {visibleGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground sm:col-span-2">
              Chưa có nhóm thuộc tính cho loại sản phẩm này. Thêm nhóm trong
              mục Danh mục.
            </p>
          ) : null}

          {visibleGroups.map((group) => {
            const options = group.attributes.map((item) => ({
              value: item.id,
              label: item.label,
            }))

            if (group.selection === "multiple") {
              const selectedIds = selectedIdsForGroup(group)
              return (
                <div key={group.id} className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor={`product-attr-${group.slug}`}>{group.label}</Label>
                  <MultiSelectCombobox
                    id={`product-attr-${group.slug}`}
                    items={options}
                    value={selectedIds}
                    onValueChange={(ids) => setGroupAttribute(group, ids)}
                    placeholder={
                      selectedIds.length
                        ? `Thêm ${group.label.toLowerCase()}`
                        : `Chọn hoặc tìm ${group.label.toLowerCase()}`
                    }
                    emptyText="Không tìm thấy mục phù hợp."
                  />
                </div>
              )
            }

            return (
              <div key={group.id} className="flex flex-col gap-2">
                <Label htmlFor={`product-attr-${group.slug}`}>{group.label}</Label>
                <Select
                  id={`product-attr-${group.slug}`}
                  value={selectedForGroup(group) || null}
                  onValueChange={(value) => setGroupAttribute(group, value)}
                  items={options}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={`Chọn ${group.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false} className="w-(--anchor-width)">
                    {options.map((option) => (
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
            )
          })}

          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label>Mô tả</Label>
            <Tabs
              value={descriptionTab}
              onValueChange={(value) => {
                if (value === "vi" || value === "en") {
                  setDescriptionTab(value)
                }
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
                    id="product-description-vi"
                    name="descriptionVi"
                    value={descriptionVi}
                    onChange={(event) => setDescriptionVi(event.target.value)}
                    placeholder="Mô tả ngắn về chất liệu, dáng váy và chi tiết thiết kế."
                    rows={5}
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
                          disabled={translating || !descriptionVi.trim()}
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
                  id="product-description-en"
                  name="descriptionEn"
                  value={descriptionEn}
                  onChange={(event) => setDescriptionEn(event.target.value)}
                  placeholder="Short description of fabric, silhouette, and design details."
                  rows={5}
                />
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="product-collections">Bộ sưu tập</Label>
            <MultiSelectCombobox
              id="product-collections"
              items={collectionOptions.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
              value={collectionIds}
              onValueChange={setCollectionIds}
              placeholder={
                collectionIds.length
                  ? "Thêm bộ sưu tập"
                  : "Chọn hoặc tìm bộ sưu tập"
              }
              emptyText="Không tìm thấy bộ sưu tập phù hợp."
            />
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="product-tags">Tags</Label>
            <MultiSelectCombobox
              id="product-tags"
              items={PRODUCT_TAGS.map((tag) => ({ value: tag, label: tag }))}
              value={tags}
              onValueChange={setTags}
              placeholder={tags.length ? "Thêm tag" : "Chọn hoặc tìm tag"}
              emptyText="Không tìm thấy tag phù hợp."
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
        <div className="mb-5">
          <h2 className="text-base font-semibold">Ảnh sản phẩm</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tải nhiều ảnh dọc cùng lúc, rồi kéo thả để xếp thứ tự trưng bày.
          </p>
        </div>
        <ImageUploader
          images={images}
          onChange={setImages}
          sizeHint={ADMIN_IMAGE_SIZE_HINTS.product}
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
            <Label htmlFor="product-slug">Đường dẫn</Label>
            <div className="flex h-9 items-center overflow-hidden rounded-md border border-input bg-transparent shadow-xs focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
              <span className="flex h-full shrink-0 items-center border-r border-input bg-muted/50 px-2.5 text-sm text-muted-foreground">
                /product/
              </span>
              <Input
                id="product-slug"
                name="slug"
                value={slug}
                onChange={(event) => setSlug(slugify(event.target.value))}
                placeholder="fern-luxury-ivory-ballgown"
                className="h-full rounded-none border-0 shadow-none focus-visible:border-0 focus-visible:ring-0"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Tự tạo từ tên sản phẩm. Có thể sửa lại nếu cần.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="product-seo-title">Tiêu đề SEO</Label>
              <CharacterCount value={seoTitle} limit={SEO_TITLE_LIMIT} />
            </div>
            <Input
              id="product-seo-title"
              name="seoTitle"
              value={seoTitle}
              onChange={(event) => setSeoTitle(event.target.value)}
              placeholder="Fern | Váy cưới ball gown ivory | LINHouse"
            />
            <p className="text-xs text-muted-foreground">
              Nên dài khoảng 50–60 ký tự. Nếu để trống sẽ dùng tên sản phẩm.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="product-seo-description">Mô tả SEO</Label>
              <CharacterCount value={seoDescription} limit={SEO_DESCRIPTION_LIMIT} />
            </div>
            <Textarea
              id="product-seo-description"
              name="seoDescription"
              value={seoDescription}
              onChange={(event) => setSeoDescription(event.target.value)}
              placeholder="Váy cưới ball gown ivory may đo tại atelier LINHouse. Chất liệu tulle, cổ tim, phù hợp lễ đường và buổi chụp hình."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Nên dài khoảng 150–160 ký tự. Hiển thị dưới tiêu đề trên Google.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="product-seo-keywords">Từ khóa</Label>
            <Input
              id="product-seo-keywords"
              name="seoKeywords"
              value={seoKeywords}
              onChange={(event) => setSeoKeywords(event.target.value)}
              placeholder="váy cưới, ball gown, cổ tim, tulle"
            />
            <p className="text-xs text-muted-foreground">
              Phân tách bằng dấu phẩy. Dùng cho tìm kiếm nội bộ và thẻ meta keywords.
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {images.length} ảnh · ảnh bìa là ảnh đầu tiên
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
        description="Sản phẩm sẽ được đánh dấu đã đăng và chỉ hiện trên website khi tới giờ."
      />
    </form>
  )
}
