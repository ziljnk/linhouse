import { AdminBackButton } from "@/components/admin/back-button"
import { BlogForm } from "@/components/admin/blog-form"

export const metadata = {
  title: "Tạo bài viết",
}

export default function NewBlogPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <div>
        <div className="flex items-center gap-2">
          <AdminBackButton href="/admin/blog" />
          <h1 className="text-2xl font-semibold tracking-tight">Tạo bài viết</h1>
        </div>
        <p className="mt-1 ps-11 text-sm text-muted-foreground">
          Thêm tiêu đề, nội dung, ảnh bìa và SEO cho bài blog.
        </p>
      </div>
      <BlogForm />
    </div>
  )
}
