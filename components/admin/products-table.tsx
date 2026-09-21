"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { deleteProductsAction } from "@/app/admin/(dashboard)/products/actions"
import { AdminFilterSelect } from "@/components/admin/admin-filter-select"
import { AdminPagination } from "@/components/admin/admin-pagination"
import {
  useAdminListParams,
  useAdminSearchQuery,
} from "@/components/admin/use-admin-list-params"
import { toastError, toastSuccess } from "@/lib/admin-toast"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { ChevronDown, Eye, MoreHorizontal, Pencil, Search, Trash2 } from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox"
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
  formatProductPrice,
  formatScheduledAt,
  PRODUCT_KIND_LABELS,
  PRODUCT_KINDS,
  PRODUCT_STATUS_LABELS,
  PRODUCT_STATUSES,
  type AdminProductListItem,
  type ProductStatus,
} from "@/lib/admin-products"

const STATUS_BADGE_VARIANT: Record<
  ProductStatus,
  "default" | "secondary" | "outline"
> = {
  published: "default",
  scheduled: "secondary",
  draft: "outline",
}

const KIND_FILTER_OPTIONS = [
  { value: "all", label: "Tất cả loại" },
  ...PRODUCT_KINDS.map((kind) => ({
    value: kind,
    label: PRODUCT_KIND_LABELS[kind],
  })),
]

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  ...PRODUCT_STATUSES.map((status) => ({
    value: status,
    label: PRODUCT_STATUS_LABELS[status],
  })),
]

export function ProductsTable({
  products,
  page,
  pageCount,
  total,
  pageSize,
  query,
  kind,
  status,
  collection,
  category,
  collectionOptions,
  categoryOptions,
}: {
  products: AdminProductListItem[]
  page: number
  pageCount: number
  total: number
  pageSize: number
  query: string
  kind: string
  status: string
  collection: string
  category: string
  collectionOptions: { value: string; label: string }[]
  categoryOptions: { value: string; label: string }[]
}) {
  const router = useRouter()
  const { setParam, setParams, clearParams } = useAdminListParams()
  const search = useAdminSearchQuery(query)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    const visible = new Set(products.map((product) => product.id))
    setSelected((current) => {
      const next = new Set([...current].filter((id) => visible.has(id)))
      return next.size === current.size ? current : next
    })
  }, [products])

  const selectedCount = selected.size
  const allSelected =
    products.length > 0 && products.every((product) => selected.has(product.id))
  const someSelected =
    products.some((product) => selected.has(product.id)) && !allSelected
  const deleteOpen = deleteIds !== null
  const hasActiveFilters =
    query !== "" ||
    kind !== "all" ||
    status !== "all" ||
    category !== "all" ||
    collection !== "all"

  const deleteNames = useMemo(() => {
    if (!deleteIds) return []
    const ids = new Set(deleteIds)
    return products
      .filter((product) => ids.has(product.id))
      .map((product) => product.name)
  }, [deleteIds, products])

  const toggleAll = (checked: boolean) => {
    setSelected((current) => {
      const next = new Set(current)
      for (const product of products) {
        if (checked) next.add(product.id)
        else next.delete(product.id)
      }
      return next
    })
  }

  const toggleOne = (id: string, checked: boolean) => {
    setSelected((current) => {
      const next = new Set(current)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const confirmDelete = async () => {
    if (!deleteIds) return
    setPending(true)
    setDeleteError(null)
    const result = await deleteProductsAction(deleteIds)
    setPending(false)
    if (!result.ok) {
      setDeleteError(result.error)
      toastError(result.error)
      return
    }
    toastSuccess(
      deleteIds.length === 1
        ? "Đã xóa sản phẩm."
        : `Đã xóa ${deleteIds.length} sản phẩm.`
    )
    setSelected((current) => {
      const next = new Set(current)
      for (const id of deleteIds) next.delete(id)
      return next
    })
    setDeleteIds(null)
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
              placeholder="Tìm tên, mã, loại, danh mục, bộ sưu tập..."
              aria-label="Tìm sản phẩm"
              className="pl-8"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <AdminFilterSelect
              id="filter-kind"
              aria-label="Lọc loại sản phẩm"
              value={kind}
              onValueChange={(value) => setParams({ kind: value, category: "all" })}
              items={KIND_FILTER_OPTIONS}
            />
            <AdminFilterSelect
              id="filter-category"
              aria-label="Lọc danh mục"
              value={category}
              onValueChange={(value) => setParam("category", value)}
              items={[
                { value: "all", label: "Tất cả danh mục" },
                ...categoryOptions,
              ]}
            />
            <AdminFilterSelect
              id="filter-collection"
              aria-label="Lọc bộ sưu tập"
              value={collection}
              onValueChange={(value) => setParam("collection", value)}
              items={[
                { value: "all", label: "Tất cả bộ sưu tập" },
                ...collectionOptions,
              ]}
            />
            <AdminFilterSelect
              id="filter-status"
              aria-label="Lọc trạng thái"
              value={status}
              onValueChange={(value) => setParam("status", value)}
              items={STATUS_FILTER_OPTIONS}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {selectedCount > 0 ? (
              <p className="text-sm text-muted-foreground">
                Đã chọn {selectedCount} sản phẩm
              </p>
            ) : null}
            {hasActiveFilters ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  clearParams(["q", "kind", "status", "category", "collection"])
                }
              >
                Xóa bộ lọc
              </Button>
            ) : null}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={selectedCount === 0}
              render={<Button variant="outline" />}
            >
              Hành động
              <ChevronDown />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteIds([...selected])}
              >
                <Trash2 />
                Xóa đã chọn
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Chọn tất cả sản phẩm"
                  disabled={products.length === 0}
                />
              </TableHead>
              <TableHead>Ảnh</TableHead>
              <TableHead>Tên sản phẩm</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Giá</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Thao tác</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  {hasActiveFilters
                    ? "Không tìm thấy sản phẩm phù hợp."
                    : "Chưa có sản phẩm nào."}
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => {
                const isSelected = selected.has(product.id)

                return (
                  <TableRow
                    key={product.id}
                    data-state={isSelected ? "selected" : undefined}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => toggleOne(product.id, checked)}
                        aria-label={`Chọn ${product.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="relative h-14 w-11 overflow-hidden rounded-md bg-muted">
                        {product.image ? (
                          <OptimizedImage
                            src={product.image}
                            alt={product.name}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <div className="flex min-w-40 flex-col">
                        <span className="font-medium">{product.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {product.collections.length > 0
                            ? product.collections.join(" · ")
                            : "Chưa gán bộ sưu tập"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{PRODUCT_KIND_LABELS[product.kind]}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell className="whitespace-normal">
                      <div className="flex flex-col gap-1">
                        <Badge variant={STATUS_BADGE_VARIANT[product.status]}>
                          {PRODUCT_STATUS_LABELS[product.status]}
                        </Badge>
                        {product.status === "scheduled" && product.publishedAt ? (
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {formatScheduledAt(product.publishedAt)}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatProductPrice(product.price, product.priceDisplay)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label={`Thao tác ${product.name}`}
                          render={<Button variant="ghost" size="icon" />}
                        >
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-40">
                          <DropdownMenuItem
                            render={
                              <Link
                                href={`/vi/product/${product.slug}`}
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
                              <Link href={`/admin/products/${product.slug}/edit`} />
                            }
                          >
                            <Pencil />
                            Sửa
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeleteIds([product.id])}
                          >
                            <Trash2 />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AdminPagination
        page={page}
        pageCount={pageCount}
        total={total}
        pageSize={pageSize}
        noun="sản phẩm"
      />

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open) setDeleteIds(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteIds?.length === 1 ? "Xóa sản phẩm?" : "Xóa sản phẩm đã chọn?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteIds?.length === 1
                ? `Bạn sắp xóa “${deleteNames[0]}”.`
                : `Bạn sắp xóa ${deleteIds?.length ?? 0} sản phẩm.`}{" "}
              Thao tác này không hoàn tác.
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
