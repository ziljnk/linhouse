import Link from "next/link"
import { Plus } from "lucide-react"
import { TestimonialsSectionForm } from "@/components/admin/testimonials-section-form"
import { TestimonialsTable } from "@/components/admin/testimonials-table"
import { Button } from "@/components/ui/button"
import {
  parseAdminFilter,
  parseAdminPage,
  parseAdminQuery,
} from "@/lib/admin-pagination"
import { requireUsableAdminSession } from "@/lib/admin-session"
import {
  getTestimonialsSectionCopy,
  listAdminTestimonials,
  listAdminTestimonialYears,
} from "@/lib/admin-storefront"

export const metadata = {
  title: "Câu chuyện cô dâu",
}

export default async function AdminTestimonialsPage({
  searchParams,
}: PageProps<"/admin/testimonials">) {
  await requireUsableAdminSession()
  const params = await searchParams
  const q = parseAdminQuery(params.q)
  const status = parseAdminFilter(params.status)
  const year = parseAdminFilter(params.year)
  const [section, result, years] = await Promise.all([
    getTestimonialsSectionCopy(),
    listAdminTestimonials({
      q,
      page: parseAdminPage(params.page),
      status,
      year,
    }),
    listAdminTestimonialYears(),
  ])

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Câu chuyện cô dâu
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý tiêu đề và các câu chuyện hiển thị trên trang chủ.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/admin/testimonials/new" />}
        >
          <Plus />
          Thêm câu chuyện
        </Button>
      </div>
      <TestimonialsSectionForm defaultValues={section} />
      <TestimonialsTable
        testimonials={result.items}
        page={result.page}
        pageCount={result.pageCount}
        total={result.total}
        pageSize={result.pageSize}
        query={q}
        status={status || "all"}
        year={year || "all"}
        yearOptions={years.map((item) => ({ value: item, label: item }))}
      />
    </div>
  )
}
