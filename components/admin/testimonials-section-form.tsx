"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { saveTestimonialsSectionAction } from "@/app/admin/(dashboard)/testimonials/actions"
import { toastError, toastSuccess } from "@/lib/admin-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import type { TestimonialsSectionCopy } from "@/lib/admin-testimonials"

export function TestimonialsSectionForm({
  defaultValues,
}: {
  defaultValues: TestimonialsSectionCopy
}) {
  const [labelVi, setLabelVi] = useState(defaultValues.labelVi)
  const [labelEn, setLabelEn] = useState(defaultValues.labelEn)
  const [titleVi, setTitleVi] = useState(defaultValues.titleVi)
  const [titleEn, setTitleEn] = useState(defaultValues.titleEn)
  const [localeTab, setLocaleTab] = useState<"vi" | "en">("vi")
  const [pending, setPending] = useState(false)
  const router = useRouter()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!labelVi.trim() || !titleVi.trim()) {
      toastError("Vui lòng nhập nhãn và tiêu đề tiếng Việt.")
      return
    }

    setPending(true)
    try {
      const result = await saveTestimonialsSectionAction({
        labelVi,
        labelEn,
        titleVi,
        titleEn,
      })
      if (!result.ok) {
        toastError(result.error)
        return
      }
      toastSuccess("Đã lưu tiêu đề.")
      router.refresh()
    } catch (error) {
      toastError(
        error instanceof Error ? error.message : "Không lưu được tiêu đề."
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-card p-6 shadow-xs"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Tiêu đề trên trang chủ</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Nhãn nhỏ và tiêu đề lớn của block câu chuyện cô dâu.
          </p>
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Đang lưu..." : "Lưu tiêu đề"}
        </Button>
      </div>

      <Tabs
        value={localeTab}
        onValueChange={(value) => {
          if (value === "vi" || value === "en") setLocaleTab(value)
        }}
        className="gap-4"
      >
        <TabsList>
          <TabsTrigger value="vi">Tiếng Việt</TabsTrigger>
          <TabsTrigger value="en">Tiếng Anh</TabsTrigger>
        </TabsList>
        <TabsContent value="vi" className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="testimonials-label-vi">Nhãn</Label>
            <Input
              id="testimonials-label-vi"
              name="labelVi"
              value={labelVi}
              onChange={(event) => setLabelVi(event.target.value)}
              placeholder="Câu chuyện cô dâu"
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="testimonials-title-vi">Tiêu đề</Label>
            <Input
              id="testimonials-title-vi"
              name="titleVi"
              value={titleVi}
              onChange={(event) => setTitleVi(event.target.value)}
              placeholder="Lời yêu thương từ những cô dâu của LINHOUSE"
            />
          </div>
        </TabsContent>
        <TabsContent value="en" className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="testimonials-label-en">Label</Label>
            <Input
              id="testimonials-label-en"
              name="labelEn"
              value={labelEn}
              onChange={(event) => setLabelEn(event.target.value)}
              placeholder="Bride stories"
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="testimonials-title-en">Title</Label>
            <Input
              id="testimonials-title-en"
              name="titleEn"
              value={titleEn}
              onChange={(event) => setTitleEn(event.target.value)}
              placeholder="From Our Brides with Love"
            />
          </div>
        </TabsContent>
      </Tabs>
    </form>
  )
}
