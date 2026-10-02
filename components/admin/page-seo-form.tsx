"use client"

import { useState, useTransition, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { saveStaticPageSeoAction } from "@/app/admin/(dashboard)/seo/actions"
import { SeoLocaleFields, type SeoLocaleValues } from "@/components/admin/seo-locale-fields"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { toastError, toastSuccess } from "@/lib/admin-toast"
import type { PageSeoFields, StaticPageSeoEditorPage } from "@/lib/page-seo"

function isCustomized(value: PageSeoFields) {
  return Object.values(value).some((item) => item.trim().length > 0)
}

export function PageSeoForm({ pages }: { pages: StaticPageSeoEditorPage[] }) {
  const router = useRouter()
  const [values, setValues] = useState<Record<string, PageSeoFields>>(() =>
    Object.fromEntries(pages.map((page) => [page.id, page.values]))
  )
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    startTransition(async () => {
      const result = await saveStaticPageSeoAction(values)
      if (!result.ok) {
        toastError(result.error)
        return
      }
      toastSuccess("Đã lưu thẻ SEO.")
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
      <Accordion multiple className="rounded-xl border border-border bg-card px-6 shadow-xs">
        {pages.map((page) => {
          const value = values[page.id] ?? page.values
          const customized = isCustomized(value)
          return (
            <AccordionItem key={page.id} value={page.id}>
              <AccordionTrigger className="items-center py-5 hover:no-underline">
                <span className="flex min-w-0 flex-col items-start gap-1 pr-4 text-left">
                  <span className="flex items-center gap-2 text-base font-semibold">
                    {page.label}
                    {customized ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        Đã chỉnh
                      </span>
                    ) : null}
                  </span>
                  <span className="truncate text-sm font-normal text-muted-foreground">
                    {page.path === "/" ? "/vi" : `/vi${page.path}`} · {page.preview.vi.title}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <SeoLocaleFields
                  idPrefix={`page-seo-${page.id}`}
                  value={value}
                  onChange={(next: SeoLocaleValues) =>
                    setValues((current) => ({ ...current, [page.id]: next }))
                  }
                  emptyTitleFallback={`tiêu đề “${page.placeholders.vi.title}”`}
                  placeholders={page.placeholders}
                />
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Đang lưu..." : "Lưu SEO"}
        </Button>
      </div>
    </form>
  )
}
