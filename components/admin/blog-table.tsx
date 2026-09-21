"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { deleteBlogPostAction } from "@/app/admin/(dashboard)/blog/actions"
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

export function BlogTable({
  posts,
  page,
  pageCount,
  total,
  pageSize,
  query,
  status,
  category,
  categoryOptions,
}: {
  posts: AdminBlogListItem[]
  page: number
  pageCount: number
  total: number
  pageSize: number
  query: string
  status: string
  category: string
  categoryOptions: { value: string; label: string }[]
}) {
  const router = useRouter()
  const { setParam, clearParams } = useAdminListParams()
  const search = useAdminSearchQuery(query)
  const [deletePost, setDeletePost] = useState<AdminBlogListItem | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const hasActiveFilters =
    query !== "" || status !== "all" || category !== "all"

  const confirmDelete = async () => {
    if (!deletePost) return
    setPending(true)
    setDeleteError(null)
    const result = await deleteBlogPostAction(deletePost.id)
    setPending(false)
    if (!result.ok) {
      setDeleteError(result.error)
      toastError(result.error)
      return
    }
    toastSuccess("Đã xóa bài viết.")
    setDeletePost(null)
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
              placeholder="Tìm tiêu đề, danh mục..."
              aria-label="Tìm bài viết"
              className="pl-8"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <AdminFilterSelect
              id="filter-blog-category"
              aria-label="Lọc danh mục"
              value={category}
              onValueChange={(value) => setParam("category", value)}
              items={[
                { value: "all", label: "Tất cả danh mục" },
                ...categoryOptions,
              ]}
            />
            <AdminFilterSelect
              id="filter-blog-status"
              aria-label="Lọc trạng thái"
              value={status}
              onValueChange={(value) => setParam("status", value)}
              items={STATUS_FILTER_OPTIONS}
            />
          </div>
        </div>

        {hasActiveFilters ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => clearParams(["q", "status", "category"])}
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
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Thao tác</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  {hasActiveFilters
                    ? "Không tìm thấy bài viết phù hợp."
                    : "Chưa có bài viết nào."}
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <div className="relative h-14 w-20 overflow-hidden rounded-md bg-muted">
                      {post.thumbnail ? (
                        <OptimizedImage
                          src={post.thumbnail}
                          alt={post.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : null}
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
                      {post.status === "scheduled" && post.publishedAt ? (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {formatScheduledAt(post.publishedAt)}
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

      <AdminPagination
        page={page}
        pageCount={pageCount}
        total={total}
        pageSize={pageSize}
        noun="bài viết"
      />

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
              Bạn sắp xóa “{deletePost?.title}”. Thao tác này không hoàn tác.
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
