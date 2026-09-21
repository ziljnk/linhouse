"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { deleteCollectionAction } from "@/app/admin/(dashboard)/collections/actions"
import { AdminFilterSelect } from "@/components/admin/admin-filter-select"
import { AdminPagination } from "@/components/admin/admin-pagination"
import {
  useAdminListParams,
  useAdminSearchQuery,
} from "@/components/admin/use-admin-list-params"
import { toastError, toastSuccess } from "@/lib/admin-toast"
import { OptimizedImage } from "@/components/ui/optimized-image"
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
  COLLECTION_STATUS_LABELS,
  COLLECTION_STATUSES,
  formatScheduledAt,
  type AdminCollectionListItem,
  type CollectionStatus,
} from "@/lib/admin-collections"

const STATUS_BADGE_VARIANT: Record<
  CollectionStatus,
  "default" | "secondary" | "outline"
> = {
  published: "default",
  scheduled: "secondary",
  draft: "outline",
}

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  ...COLLECTION_STATUSES.map((status) => ({
    value: status,
    label: COLLECTION_STATUS_LABELS[status],
  })),
]

export function CollectionsTable({
  collections,
  page,
  pageCount,
  total,
  pageSize,
  query,
  status,
}: {
  collections: AdminCollectionListItem[]
  page: number
  pageCount: number
  total: number
  pageSize: number
  query: string
  status: string
}) {
  const router = useRouter()
  const { setParam, clearParams } = useAdminListParams()
  const search = useAdminSearchQuery(query)
  const [deleteCollection, setDeleteCollection] =
    useState<AdminCollectionListItem | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const hasActiveFilters = query !== "" || status !== "all"

  const confirmDelete = async () => {
    if (!deleteCollection) return
    setPending(true)
    setDeleteError(null)
    const result = await deleteCollectionAction(deleteCollection.id)
    setPending(false)
    if (!result.ok) {
      setDeleteError(result.error)
      toastError(result.error)
      return
    }
    toastSuccess("Đã xóa bộ sưu tập.")
    setDeleteCollection(null)
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
              placeholder="Tìm tên, mô tả, đường dẫn..."
              aria-label="Tìm bộ sưu tập"
              className="pl-8"
            />
          </div>
          <AdminFilterSelect
            id="filter-collection-status"
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
              onClick={() => clearParams(["q", "status"])}
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
              <TableHead>Tên bộ sưu tập</TableHead>
              <TableHead>Sản phẩm</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Thao tác</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {collections.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  {hasActiveFilters
                    ? "Không tìm thấy bộ sưu tập phù hợp."
                    : "Chưa có bộ sưu tập nào."}
                </TableCell>
              </TableRow>
            ) : (
              collections.map((collection) => (
                <TableRow key={collection.id}>
                  <TableCell>
                    <div className="relative h-14 w-11 overflow-hidden rounded-md bg-muted">
                      {collection.image ? (
                        <OptimizedImage
                          src={collection.image}
                          alt={collection.imageAlt}
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="flex min-w-40 flex-col">
                      <span className="font-medium">{collection.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {collection.subtitle}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {collection.productCount}
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="flex flex-col gap-1">
                      <Badge variant={STATUS_BADGE_VARIANT[collection.status]}>
                        {COLLECTION_STATUS_LABELS[collection.status]}
                      </Badge>
                      {collection.status === "scheduled" &&
                      collection.publishedAt ? (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {formatScheduledAt(collection.publishedAt)}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label={`Thao tác ${collection.name}`}
                        render={<Button variant="ghost" size="icon" />}
                      >
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-40">
                        <DropdownMenuItem
                          render={
                            <Link
                              href={`/vi/catalog/${collection.slug}`}
                              target="_blank"
                              rel="noreferrer"
                            />
                          }
                        >
                          <Eye />
                          Xem
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          render={
                            <Link
                              href={`/admin/collections/${collection.slug}/edit`}
                            />
                          }
                        >
                          <Pencil />
                          Sửa
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteCollection(collection)}
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
        noun="bộ sưu tập"
      />

      <AlertDialog
        open={deleteCollection !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteCollection(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bộ sưu tập?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn sắp xóa “{deleteCollection?.name}”. Không xóa được bộ sưu tập
              đang gắn sản phẩm.
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
