import Link from "next/link"
import { Plus } from "lucide-react"
import { BlogTable } from "@/components/admin/blog-table"
import { Button } from "@/components/ui/button"
import { getDictionary } from "@/app/[locale]/dictionaries"
import { toAdminBlogListItems } from "@/lib/admin-blog"

export const metadata = {
  title: "Blog",
}

export default async function AdminBlogPage() {
  const dict = await getDictionary("vi")
  const posts = toAdminBlogListItems(dict.home.blog.posts)

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
      <BlogTable posts={posts} />
    </div>
  )
}
