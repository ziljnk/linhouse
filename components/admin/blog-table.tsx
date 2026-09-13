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
  BLOG_STATUS_LABELS,
  BLOG_STATUSES,
  formatScheduledAt,
  type AdminBlogListItem,
  type BlogStatus,
} from "@/lib/admin-blog"

const STATUS_BADGE_VARIANT: Record<
  BlogStatus,
  "default" | "secondary" | "outline"
> = {
  published: "default",
  scheduled: "secondary",
  draft: "outline",
}

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  ...BLOG_STATUSES.map((status) => ({
    value: status,
    label: BLOG_STATUS_LABELS[status],
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

export function BlogTable({
  posts: initialPosts,
}: {
  posts: AdminBlogListItem[]
}) {
  const [posts, setPosts] = useState(initialPosts)
  const [deletePost, setDeletePost] = useState<AdminBlogListItem | null>(null)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const categoryOptions = useMemo(() => {
    const values = [...new Set(posts.map((post) => post.category))].sort((a, b) =>
      a.localeCompare(b, "vi")
    )
    return [
      { value: "all", label: "Tất cả danh mục" },
      ...values.map((value) => ({ value, label: value })),
    ]
  }, [posts])

  const filteredPosts = useMemo(() => {
    const needle = normalize(query.trim())

    return posts.filter((post) => {
      if (statusFilter !== "all" && post.status !== statusFilter) return false
      if (categoryFilter !== "all" && post.category !== categoryFilter) {
        return false
      }
      if (!needle) return true

      const haystack = [
        post.title,
        post.category,
        BLOG_STATUS_LABELS[post.status],
      ].join(" ")

      return normalize(haystack).includes(needle)
    })
  }, [posts, query, statusFilter, categoryFilter])

  const hasActiveFilters =
    query.trim() !== "" || statusFilter !== "all" || categoryFilter !== "all"

  const confirmDelete = () => {
    if (!deletePost) return
    const id = deletePost.id
    setPosts((current) => current.filter((post) => post.id !== id))
    setDeletePost(null)
  }

  const resetFilters = () => {
    setQuery("")
    setStatusFilter("all")
    setCategoryFilter("all")
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
              placeholder="Tìm tiêu đề, danh mục..."
              aria-label="Tìm bài viết"
              className="pl-8"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <FilterSelect
              id="filter-blog-category"
              aria-label="Lọc danh mục"
              value={categoryFilter}
              onValueChange={setCategoryFilter}
              items={categoryOptions}
            />
            <FilterSelect
              id="filter-blog-status"
              aria-label="Lọc trạng thái"
              value={statusFilter}
              onValueChange={setStatusFilter}
              items={STATUS_FILTER_OPTIONS}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {filteredPosts.length === posts.length
              ? `${posts.length} bài viết`
              : `${filteredPosts.length} / ${posts.length} bài viết`}
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
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Thao tác</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPosts.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  {posts.length === 0
                    ? "Chưa có bài viết nào."
                    : "Không tìm thấy bài viết phù hợp."}
                </TableCell>
              </TableRow>
            ) : (
              filteredPosts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <div className="relative h-14 w-20 overflow-hidden rounded-md bg-muted">
                      <Image
                        src={post.thumbnail}
                        alt={post.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <span className="font-medium">{post.title}</span>
                  </TableCell>
                  <TableCell>{post.category}</TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="flex flex-col gap-1">
                      <Badge variant={STATUS_BADGE_VARIANT[post.status]}>
                        {BLOG_STATUS_LABELS[post.status]}
                      </Badge>
                      {post.status === "scheduled" && post.scheduledAt ? (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {formatScheduledAt(post.scheduledAt)}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label={`Thao tác ${post.title}`}
                        render={<Button variant="ghost" size="icon" />}
                      >
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-40">
                        <DropdownMenuItem
                          render={
                            <Link
                              href={`/vi/blog/${post.slug}`}
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
                            <Link href={`/admin/blog/${post.slug}/edit`} />
                          }
                        >
                          <Pencil />
                          Sửa
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeletePost(post)}
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
        open={deletePost !== null}
        onOpenChange={(open) => {
          if (!open) setDeletePost(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bài viết?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn sắp xóa “{deletePost?.title}”. Thao tác này chỉ áp dụng trên
              trang quản trị, chưa lưu lên máy chủ.
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
