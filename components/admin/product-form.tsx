"use client"

import { useState, type FormEvent } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  ProductImageUploader,
  type ProductImage,
} from "@/components/admin/product-image-uploader"
import { cn } from "@/lib/utils"

const SILHOUETTE_OPTIONS = [
  { value: "ball-gown", label: "Váy sân khấu" },
  { value: "a-line", label: "Váy dáng A" },
  { value: "mini-dress", label: "Váy ngắn" },
  { value: "2-in-1", label: "Váy 2 trong 1" },
]

const NECKLINE_OPTIONS = [
  { value: "strapless", label: "Cúp ngực" },
  { value: "sweetheart", label: "Cổ tim" },
  { value: "off-the-shoulder", label: "Trễ vai" },
  { value: "v-neck", label: "Cổ V" },
  { value: "long-sleeve", label: "Tay dài" },
]

const FABRIC_OPTIONS = [
  { value: "sparkling", label: "Kim tuyến" },
  { value: "lace", label: "Ren" },
  { value: "tulle", label: "Voan lưới" },
  { value: "satin", label: "Satin / Mikado / Taffeta" },
  { value: "organza", label: "Organza" },
]

const COLLECTION_OPTIONS = [
  { value: "spring-2026", label: "Spring 2026" },
  { value: "atelier-noir", label: "Atelier Noir" },
  { value: "garden-muse", label: "Garden Muse" },
  { value: "bloom", label: "Bloom" },
  { value: "opera", label: "Opera" },
  { value: "silk-route", label: "Silk Route" },
  { value: "after-party", label: "After Party" },
]

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

export function ProductForm() {
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [description, setDescription] = useState("")
  const [silhouette, setSilhouette] = useState("")
  const [neckline, setNeckline] = useState("")
  const [fabric, setFabric] = useState("")
  const [collections, setCollections] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [images, setImages] = useState<ProductImage[]>([])
  const [slug, setSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)
  const [seoTitle, setSeoTitle] = useState("")
  const [seoDescription, setSeoDescription] = useState("")
  const [seoKeywords, setSeoKeywords] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const toggleCollection = (value: string) => {
    setCollections((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    )
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(false)

    if (!name.trim()) {
      setFormError("Vui lòng nhập tên sản phẩm.")
      return
    }

    if (images.length === 0) {
      setFormError("Vui lòng tải lên ít nhất một ảnh sản phẩm.")
      return
    }

    setFormError(null)
    setSubmitted(true)
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
                setName(nextName)
                if (!slugTouched) setSlug(slugify(nextName))
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="product-silhouette">Dáng váy</Label>
            <Select
              id="product-silhouette"
              value={silhouette || null}
              onValueChange={(value) => setSilhouette(value ?? "")}
              items={SILHOUETTE_OPTIONS}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn dáng váy" />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} className="w-(--anchor-width)">
                {SILHOUETTE_OPTIONS.map((option) => (
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
            <Label htmlFor="product-neckline">Kiểu cổ</Label>
            <Select
              id="product-neckline"
              value={neckline || null}
              onValueChange={(value) => setNeckline(value ?? "")}
              items={NECKLINE_OPTIONS}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn kiểu cổ" />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} className="w-(--anchor-width)">
                {NECKLINE_OPTIONS.map((option) => (
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
            <Label htmlFor="product-fabric">Chất liệu</Label>
            <Select
              id="product-fabric"
              value={fabric || null}
              onValueChange={(value) => setFabric(value ?? "")}
              items={FABRIC_OPTIONS}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn chất liệu" />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} className="w-(--anchor-width)">
                {FABRIC_OPTIONS.map((option) => (
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

          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="product-description">Mô tả</Label>
            <Textarea
              id="product-description"
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Mô tả ngắn về chất liệu, dáng váy và chi tiết thiết kế."
              rows={4}
            />
          </div>

          <fieldset className="flex flex-col gap-2 sm:col-span-2">
            <legend className="text-sm font-medium">Bộ sưu tập</legend>
            <div className="flex flex-wrap gap-2">
              {COLLECTION_OPTIONS.map((option) => {
                const selected = collections.includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleCollection(option.value)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-colors",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    )}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="product-tags">Tags</Label>
            <Combobox
              items={PRODUCT_TAGS}
              multiple
              autoHighlight
              value={tags}
              onValueChange={(value) => setTags(value ?? [])}
            >
              <ComboboxChips className="w-full">
                <ComboboxValue>
                  {tags.map((tag) => (
                    <ComboboxChip key={tag}>{tag}</ComboboxChip>
                  ))}
                </ComboboxValue>
                <ComboboxChipsInput
                  id="product-tags"
                  placeholder={tags.length ? "Thêm tag" : "Chọn hoặc tìm tag"}
                />
              </ComboboxChips>
              <ComboboxContent>
                <ComboboxEmpty>Không tìm thấy tag phù hợp.</ComboboxEmpty>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item} value={item}>
                      {item}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            <p className="text-xs text-muted-foreground">
              Có thể chọn nhiều tag. Gõ để lọc, bấm lại hoặc nút × để bỏ chọn.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
        <div className="mb-5">
          <h2 className="text-base font-semibold">Ảnh sản phẩm</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tải nhiều ảnh cùng lúc, rồi kéo thả để xếp thứ tự trưng bày.
          </p>
        </div>
        <ProductImageUploader images={images} onChange={setImages} />
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
                onChange={(event) => {
                  setSlugTouched(true)
                  setSlug(slugify(event.target.value))
                }}
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

      {formError ? (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      {submitted ? (
        <p role="status" className="text-sm text-foreground">
          Đã nhận {images.length} ảnh theo thứ tự đã sắp xếp. Lưu lên máy chủ sẽ được
          bổ sung sau.
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit">Lưu sản phẩm</Button>
        <p className="text-xs text-muted-foreground">
          {images.length} ảnh · ảnh bìa là ảnh đầu tiên
        </p>
      </div>
    </form>
  )
}
