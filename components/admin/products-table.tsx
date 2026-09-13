"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  formatScheduledAt,
  formatVnd,
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

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  ...PRODUCT_STATUSES.map((status) => ({
    value: status,
    label: PRODUCT_STATUS_LABELS[status],
  })),
]

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("đ", "d")
    .replaceAll("Đ", "d")
    .toLowerCase()
}

function FilterSelect({
  id,
  value,
  onValueChange,
  items,
  "aria-label": ariaLabel,
}: {
  id: string
  value: string
  onValueChange: (value: string) => void
  items: { value: string; label: string }[]
  "aria-label": string
}) {
  return (
    <Select
      id={id}
      value={value}
      onValueChange={(next) => onValueChange(next ?? "all")}
      items={items}
    >
      <SelectTrigger className="w-full sm:w-44" aria-label={ariaLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} className="w-(--anchor-width)">
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value} label={item.label}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function ProductsTable({
  products: initialProducts,
}: {
  products: AdminProductListItem[]
}) {
  const [products, setProducts] = useState(initialProducts)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [collectionFilter, setCollectionFilter] = useState("all")

  const categoryOptions = useMemo(() => {
    const values = [...new Set(products.map((product) => product.category))].sort(
      (a, b) => a.localeCompare(b, "vi")
    )
    return [
      { value: "all", label: "Tất cả danh mục" },
      ...values.map((value) => ({ value, label: value })),
    ]
  }, [products])

  const collectionOptions = useMemo(() => {
    const values = [
      ...new Set(products.flatMap((product) => product.collections)),
    ].sort((a, b) => a.localeCompare(b, "vi"))
    return [
      { value: "all", label: "Tất cả bộ sưu tập" },
      ...values.map((value) => ({ value, label: value })),
    ]
  }, [products])

  const filteredProducts = useMemo(() => {
    const needle = normalize(query.trim())

    return products.filter((product) => {
      if (statusFilter !== "all" && product.status !== statusFilter) return false
      if (categoryFilter !== "all" && product.category !== categoryFilter) {
        return false
      }
      if (
        collectionFilter !== "all" &&
        !product.collections.includes(collectionFilter)
      ) {
        return false
      }
      if (!needle) return true

      const haystack = [
        product.name,
        product.fullName,
        product.code,
        product.category,
        ...product.collections,
        PRODUCT_STATUS_LABELS[product.status],
        formatVnd(product.price),
      ].join(" ")

      return normalize(haystack).includes(needle)
    })
  }, [products, query, statusFilter, categoryFilter, collectionFilter])

  const selectedCount = selected.size
  const allSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((product) => selected.has(product.id))
  const someSelected =
    filteredProducts.some((product) => selected.has(product.id)) && !allSelected
  const deleteOpen = deleteIds !== null
  const hasActiveFilters =
    query.trim() !== "" ||
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    collectionFilter !== "all"

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
      for (const product of filteredProducts) {
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

  const confirmDelete = () => {
    if (!deleteIds) return
    const ids = new Set(deleteIds)
    setProducts((current) => current.filter((product) => !ids.has(product.id)))
    setSelected((current) => {
      const next = new Set(current)
      for (const id of deleteIds) next.delete(id)
      return next
    })
    setDeleteIds(null)
  }

  const resetFilters = () => {
    setQuery("")
    setStatusFilter("all")
    setCategoryFilter("all")
    setCollectionFilter("all")
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm tên, mã, danh mục, bộ sưu tập..."
              aria-label="Tìm sản phẩm"
              className="pl-8"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <FilterSelect
              id="filter-category"
              aria-label="Lọc danh mục"
              value={categoryFilter}
              onValueChange={setCategoryFilter}
              items={categoryOptions}
            />
            <FilterSelect
              id="filter-collection"
              aria-label="Lọc bộ sưu tập"
              value={collectionFilter}
              onValueChange={setCollectionFilter}
              items={collectionOptions}
            />
            <FilterSelect
              id="filter-status"
              aria-label="Lọc trạng thái"
              value={statusFilter}
              onValueChange={setStatusFilter}
              items={STATUS_FILTER_OPTIONS}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {selectedCount > 0
                ? `Đã chọn ${selectedCount} sản phẩm`
                : filteredProducts.length === products.length
                  ? `${products.length} sản phẩm`
                  : `${filteredProducts.length} / ${products.length} sản phẩm`}
            </p>
            {hasActiveFilters ? (
              <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
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
                  disabled={filteredProducts.length === 0}
                />
              </TableHead>
              <TableHead>Ảnh</TableHead>
              <TableHead>Tên sản phẩm</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Giá</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Thao tác</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  {products.length === 0
                    ? "Chưa có sản phẩm nào."
                    : "Không tìm thấy sản phẩm phù hợp."}
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => {
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
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
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
                    <TableCell>{product.category}</TableCell>
                    <TableCell className="whitespace-normal">
                      <div className="flex flex-col gap-1">
                        <Badge variant={STATUS_BADGE_VARIANT[product.status]}>
                          {PRODUCT_STATUS_LABELS[product.status]}
                        </Badge>
                        {product.status === "scheduled" && product.scheduledAt ? (
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {formatScheduledAt(product.scheduledAt)}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatVnd(product.price)}
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
              Thao tác này chỉ áp dụng trên trang quản trị, chưa lưu lên máy chủ.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
