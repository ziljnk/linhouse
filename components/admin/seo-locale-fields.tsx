"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const SEO_TITLE_LIMIT = 60
const SEO_DESCRIPTION_LIMIT = 160

export type SeoLocaleValues = {
  titleVi: string
  titleEn: string
  descriptionVi: string
  descriptionEn: string
  keywordsVi: string
  keywordsEn: string
}

type SeoPlaceholders = {
  title: string
  description: string
  keywords: string
}

function CharacterCount({ value, limit }: { value: string; limit: number }) {
  const length = value.length
  const over = length > limit

  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        over ? "text-destructive" : "text-muted-foreground"
      )}
    >
      {length}/{limit}
    </span>
  )
}

function SeoFields({
  idPrefix,
  locale,
  title,
  description,
  keywords,
  placeholders,
  emptyTitleFallback,
  onTitleChange,
  onDescriptionChange,
  onKeywordsChange,
}: {
  idPrefix: string
  locale: "vi" | "en"
  title: string
  description: string
  keywords: string
  placeholders: SeoPlaceholders
  emptyTitleFallback: string
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onKeywordsChange: (value: string) => void
}) {
  const suffix = locale === "vi" ? "vi" : "en"

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor={`${idPrefix}-seo-title-${suffix}`}>Tiêu đề SEO</Label>
          <CharacterCount value={title} limit={SEO_TITLE_LIMIT} />
        </div>
        <Input
          id={`${idPrefix}-seo-title-${suffix}`}
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder={placeholders.title}
        />
        <p className="text-xs text-muted-foreground">
          {locale === "vi"
            ? `Nên dài khoảng 50–60 ký tự. Nếu để trống sẽ dùng ${emptyTitleFallback}.`
            : "Nên dài khoảng 50–60 ký tự. Nếu để trống, trang tiếng Anh sẽ dùng nội dung tiếng Việt."}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor={`${idPrefix}-seo-description-${suffix}`}>Mô tả SEO</Label>
          <CharacterCount value={description} limit={SEO_DESCRIPTION_LIMIT} />
        </div>
        <Textarea
          id={`${idPrefix}-seo-description-${suffix}`}
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder={placeholders.description}
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          {locale === "vi"
            ? "Nên dài khoảng 150–160 ký tự. Hiển thị dưới tiêu đề trên Google."
            : "Nên dài khoảng 150–160 ký tự. Nếu để trống, trang tiếng Anh sẽ dùng mô tả tiếng Việt."}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-seo-keywords-${suffix}`}>Từ khóa</Label>
        <Input
          id={`${idPrefix}-seo-keywords-${suffix}`}
          value={keywords}
          onChange={(event) => onKeywordsChange(event.target.value)}
          placeholder={placeholders.keywords}
        />
        <p className="text-xs text-muted-foreground">
          Phân tách bằng dấu phẩy. Dùng cho thẻ meta keywords của phiên bản ngôn ngữ này.
        </p>
      </div>
    </div>
  )
}

export function SeoLocaleFields({
  idPrefix,
  value,
  onChange,
  placeholders,
  emptyTitleFallback,
}: {
  idPrefix: string
  value: SeoLocaleValues
  onChange: (next: SeoLocaleValues) => void
  placeholders: { vi: SeoPlaceholders; en: SeoPlaceholders }
  emptyTitleFallback: string
}) {
  const [locale, setLocale] = useState<"vi" | "en">("vi")

  return (
    <Tabs
      value={locale}
      onValueChange={(next) => {
        if (next === "vi" || next === "en") setLocale(next)
      }}
      className="gap-3"
    >
      <TabsList>
        <TabsTrigger value="vi">Tiếng Việt</TabsTrigger>
        <TabsTrigger value="en">Tiếng Anh</TabsTrigger>
      </TabsList>
      <TabsContent value="vi">
        <SeoFields
          idPrefix={idPrefix}
          locale="vi"
          title={value.titleVi}
          description={value.descriptionVi}
          keywords={value.keywordsVi}
          placeholders={placeholders.vi}
          emptyTitleFallback={emptyTitleFallback}
          onTitleChange={(titleVi) => onChange({ ...value, titleVi })}
          onDescriptionChange={(descriptionVi) => onChange({ ...value, descriptionVi })}
          onKeywordsChange={(keywordsVi) => onChange({ ...value, keywordsVi })}
        />
      </TabsContent>
      <TabsContent value="en">
        <SeoFields
          idPrefix={idPrefix}
          locale="en"
          title={value.titleEn}
          description={value.descriptionEn}
          keywords={value.keywordsEn}
          placeholders={placeholders.en}
          emptyTitleFallback={emptyTitleFallback}
          onTitleChange={(titleEn) => onChange({ ...value, titleEn })}
          onDescriptionChange={(descriptionEn) => onChange({ ...value, descriptionEn })}
          onKeywordsChange={(keywordsEn) => onChange({ ...value, keywordsEn })}
        />
      </TabsContent>
    </Tabs>
  )
}
