import { notFound } from "next/navigation"
import { AdminBackButton } from "@/components/admin/back-button"
import { BlogForm } from "@/components/admin/blog-form"
import { getDictionary } from "@/app/[locale]/dictionaries"
import { findAdminBlogPost, toAdminBlogListItems } from "@/lib/admin-blog"

export const metadata = {
  title: "Sửa bài viết",
}

export default async function EditBlogPage({
  params,
}: PageProps<"/admin/blog/[slug]/edit">) {
  const { slug } = await params
  const dict = await getDictionary("vi")
  const post = findAdminBlogPost(toAdminBlogListItems(dict.home.blog.posts), slug)

  if (!post) notFound()

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <div>
        <div className="flex items-center gap-2">
          <AdminBackButton href="/admin/blog" />
          <h1 className="text-2xl font-semibold tracking-tight">Sửa bài viết</h1>
        </div>
        <p className="mt-1 ps-11 text-sm text-muted-foreground">{post.title}</p>
      </div>
      <BlogForm
        defaultValues={{
          title: post.title,
          slug: post.slug,
          category: post.category,
          coverUrl: post.thumbnail,
        }}
      />
    </div>
  )
}
