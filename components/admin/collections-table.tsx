"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
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

export function CollectionsTable({
  collections: initialCollections,
}: {
  collections: AdminCollectionListItem[]
}) {
  const [collections, setCollections] = useState(initialCollections)
  const [deleteCollection, setDeleteCollection] =
    useState<AdminCollectionListItem | null>(null)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredCollections = useMemo(() => {
    const needle = normalize(query.trim())

    return collections.filter((collection) => {
      if (statusFilter !== "all" && collection.status !== statusFilter) {
        return false
      }
      if (!needle) return true

      const haystack = [
        collection.name,
        collection.subtitle,
        collection.slug,
        COLLECTION_STATUS_LABELS[collection.status],
      ].join(" ")

      return normalize(haystack).includes(needle)
    })
  }, [collections, query, statusFilter])

  const hasActiveFilters = query.trim() !== "" || statusFilter !== "all"

  const confirmDelete = () => {
    if (!deleteCollection) return
    const id = deleteCollection.id
    setCollections((current) =>
      current.filter((collection) => collection.id !== id)
    )
    setDeleteCollection(null)
  }

  const resetFilters = () => {
    setQuery("")
    setStatusFilter("all")
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
              placeholder="Tìm tên, mô tả, đường dẫn..."
              aria-label="Tìm bộ sưu tập"
              className="pl-8"
            />
          </div>
          <FilterSelect
            id="filter-collection-status"
            aria-label="Lọc trạng thái"
            value={statusFilter}
            onValueChange={setStatusFilter}
            items={STATUS_FILTER_OPTIONS}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {filteredCollections.length === collections.length
              ? `${collections.length} bộ sưu tập`
              : `${filteredCollections.length} / ${collections.length} bộ sưu tập`}
          </p>
          {hasActiveFilters ? (
            <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
              Xóa bộ lọc
            </Button>
          ) : null}
        </div>
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
            {filteredCollections.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  {collections.length === 0
                    ? "Chưa có bộ sưu tập nào."
                    : "Không tìm thấy bộ sưu tập phù hợp."}
                </TableCell>
              </TableRow>
            ) : (
              filteredCollections.map((collection) => (
                <TableRow key={collection.id}>
                  <TableCell>
                    <div className="relative h-14 w-11 overflow-hidden rounded-md bg-muted">
                      <Image
                        src={collection.image}
                        alt={collection.imageAlt}
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
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
                      collection.scheduledAt ? (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {formatScheduledAt(collection.scheduledAt)}
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
              Bạn sắp xóa “{deleteCollection?.name}”. Thao tác này chỉ áp dụng
              trên trang quản trị, chưa lưu lên máy chủ.
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
