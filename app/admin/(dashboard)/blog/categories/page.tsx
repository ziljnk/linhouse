import { AdminBackButton } from "@/components/admin/back-button"
import { BlogCategoriesManager } from "@/components/admin/blog-categories-manager"
import { requireUsableAdminSession } from "@/lib/admin-session"
import { listAdminBlogCategories } from "@/lib/admin-storefront"

export const metadata = {
  title: "Danh mục blog",
}

export default async function AdminBlogCategoriesPage() {
  await requireUsableAdminSession()
  const categories = await listAdminBlogCategories()

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <div>
        <div className="flex items-center gap-2">
          <AdminBackButton href="/admin/blog" />
          <h1 className="text-2xl font-semibold tracking-tight">Danh mục blog</h1>
        </div>
        <p className="mt-1 ps-11 text-sm text-muted-foreground">
          Tạo danh mục trước khi viết bài. Bài viết chỉ lưu được khi đã chọn danh mục.
        </p>
      </div>
      <BlogCategoriesManager categories={categories} />
    </div>
  )
}
