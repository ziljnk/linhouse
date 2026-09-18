"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { deleteTestimonialAction } from "@/app/admin/(dashboard)/testimonials/actions"
import { AdminFilterSelect } from "@/components/admin/admin-filter-select"
import { AdminPagination } from "@/components/admin/admin-pagination"
import {
  useAdminListParams,
  useAdminSearchQuery,
} from "@/components/admin/use-admin-list-params"
import { toastError, toastSuccess } from "@/lib/admin-toast"
import { Eye, MoreHorizontal, Pencil, Search, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  TESTIMONIAL_STATUS_LABELS,
  TESTIMONIAL_STATUSES,
  type AdminTestimonial,
  type TestimonialStatus,
} from "@/lib/admin-testimonials"

const STATUS_BADGE_VARIANT: Record<
  TestimonialStatus,
  "default" | "outline"
> = {
  published: "default",
  draft: "outline",
}

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  ...TESTIMONIAL_STATUSES.map((status) => ({
    value: status,
    label: TESTIMONIAL_STATUS_LABELS[status],
  })),
]

const STOREFRONT_PREVIEW_LOCALES = [
  { locale: "vi", label: "Xem (VI)" },
  { locale: "en", label: "Xem (EN)" },
] as const

export function TestimonialsTable({
  testimonials,
  page,
  pageCount,
  total,
  pageSize,
  query,
  status,
  year,
  yearOptions,
}: {
  testimonials: AdminTestimonial[]
  page: number
  pageCount: number
  total: number
  pageSize: number
  query: string
  status: string
  year: string
  yearOptions: { value: string; label: string }[]
}) {
  const router = useRouter()
  const { setParam, clearParams } = useAdminListParams()
  const search = useAdminSearchQuery(query)
  const [deleteItem, setDeleteItem] = useState<AdminTestimonial | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const hasActiveFilters = query !== "" || status !== "all" || year !== "all"

  const confirmDelete = async () => {
    if (!deleteItem) return
    setPending(true)
    setDeleteError(null)
    const result = await deleteTestimonialAction(deleteItem.id)
    setPending(false)
    if (!result.ok) {
      setDeleteError(result.error)
      toastError(result.error)
      return
    }
    toastSuccess("Đã xóa câu chuyện.")
    setDeleteItem(null)
    router.refresh()
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search.value}
              onChange={(event) => search.onChange(event.target.value)}
              onFocus={search.onFocus}
              onBlur={search.onBlur}
              placeholder="Tìm tên cô dâu, lời nhắn, váy..."
              aria-label="Tìm câu chuyện cô dâu"
              className="pl-8"
            />
          </div>
          <AdminFilterSelect
            id="filter-testimonial-year"
            aria-label="Lọc năm"
            value={year}
            onValueChange={(value) => setParam("year", value)}
            items={[{ value: "all", label: "Tất cả năm" }, ...yearOptions]}
          />
          <AdminFilterSelect
            id="filter-testimonial-status"
            aria-label="Lọc trạng thái"
            value={status}
            onValueChange={(value) => setParam("status", value)}
            items={STATUS_FILTER_OPTIONS}
          />
        </div>

        {hasActiveFilters ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => clearParams(["q", "status", "year"])}
            >
              Xóa bộ lọc
            </Button>
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Ảnh</TableHead>
              <TableHead>Cô dâu</TableHead>
              <TableHead>Váy</TableHead>
              <TableHead>Năm</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Thao tác</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {testimonials.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  {hasActiveFilters
                    ? "Không tìm thấy câu chuyện phù hợp."
                    : "Chưa có câu chuyện nào."}
                </TableCell>
              </TableRow>
            ) : (
              testimonials.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="relative h-14 w-11 overflow-hidden rounded-md bg-muted">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.imageAltVi}
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="flex min-w-48 flex-col">
                      <span className="font-medium">{item.name}</span>
                      <span className="line-clamp-2 text-xs text-muted-foreground italic">
                        {item.quoteVi}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{item.gown || "—"}</TableCell>
                  <TableCell className="tabular-nums">{item.year || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE_VARIANT[item.status]}>
                      {TESTIMONIAL_STATUS_LABELS[item.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label={`Thao tác ${item.name}`}
                        render={<Button variant="ghost" size="icon" />}
                      >
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-40">
                        {STOREFRONT_PREVIEW_LOCALES.map(({ locale, label }) => (
                          <DropdownMenuItem
                            key={locale}
                            render={
                              <Link
                                href={`/${locale}#reviews`}
                                target="_blank"
                                rel="noreferrer"
                              />
                            }
                          >
                            <Eye />
                            {label}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuItem
                          render={
                            <Link href={`/admin/testimonials/${item.slug}/edit`} />
                          }
                        >
                          <Pencil />
                          Sửa
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteItem(item)}
                        >
                          <Trash2 />
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AdminPagination
        page={page}
        pageCount={pageCount}
        total={total}
        pageSize={pageSize}
        noun="câu chuyện"
      />

      <AlertDialog
        open={deleteItem !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteItem(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa câu chuyện?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn sắp xóa câu chuyện của “{deleteItem?.name}”. Thao tác này
              không hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError ? (
            <p className="text-sm text-destructive">{deleteError}</p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={(event) => {
                event.preventDefault()
                void confirmDelete()
              }}
            >
              {pending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
