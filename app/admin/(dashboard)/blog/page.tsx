import Link from "next/link"
import { Plus } from "lucide-react"
import { BlogTable } from "@/components/admin/blog-table"
import { Button } from "@/components/ui/button"
import {
  parseAdminFilter,
  parseAdminPage,
  parseAdminQuery,
} from "@/lib/admin-pagination"
import { requireUsableAdminSession } from "@/lib/admin-session"
import {
  listAdminBlogCategories,
  listAdminBlogPosts,
} from "@/lib/admin-storefront"

export const metadata = {
  title: "Blog",
}

export default async function AdminBlogPage({
  searchParams,
}: PageProps<"/admin/blog">) {
  await requireUsableAdminSession()
  const params = await searchParams
  const q = parseAdminQuery(params.q)
  const status = parseAdminFilter(params.status)
  const category = parseAdminFilter(params.category)
  const [result, categories] = await Promise.all([
    listAdminBlogPosts({
      q,
      page: parseAdminPage(params.page),
      status,
      category,
    }),
    listAdminBlogCategories(),
  ])

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Blog</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Danh sách bài viết đang có trên website.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/admin/blog/new" />}>
          <Plus />
          Tạo bài viết
        </Button>
      </div>
      <BlogTable
        posts={result.items}
        page={result.page}
        pageCount={result.pageCount}
        total={result.total}
        pageSize={result.pageSize}
        query={q}
        status={status || "all"}
        category={category || "all"}
        categoryOptions={categories.map((item) => ({
          value: item.slug,
          label: item.label,
        }))}
      />
    </div>
  )
}
