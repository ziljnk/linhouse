import { notFound } from "next/navigation"
import { AdminBackButton } from "@/components/admin/back-button"
import { BlogForm } from "@/components/admin/blog-form"
import { requireUsableAdminSession } from "@/lib/admin-session"
import {
  getAdminBlogPost,
  listAdminBlogCategories,
} from "@/lib/admin-storefront"

export const metadata = {
  title: "Sửa bài viết",
}

export default async function EditBlogPage({
  params,
}: PageProps<"/admin/blog/[slug]/edit">) {
  const { slug } = await params
  await requireUsableAdminSession()
  const [post, categories] = await Promise.all([
    getAdminBlogPost(slug),
    listAdminBlogCategories(),
  ])

  if (!post) notFound()

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <div>
        <div className="flex items-center gap-2">
          <AdminBackButton href="/admin/blog" />
          <h1 className="text-2xl font-semibold tracking-tight">Sửa bài viết</h1>
        </div>
        <p className="mt-1 ps-11 text-sm text-muted-foreground">{post.title.vi}</p>
      </div>
      <BlogForm
        categories={categories}
        defaultValues={{
          id: post.id,
          titleVi: post.title.vi,
          titleEn: post.title.en,
          excerptVi: post.excerpt.vi,
          excerptEn: post.excerpt.en,
          contentVi: post.content.vi,
          contentEn: post.content.en,
          imageAltVi: post.imageAlt.vi,
          imageAltEn: post.imageAlt.en,
          slug: post.slug,
          categoryId: post.categoryId,
          coverUrl: post.coverUrl,
          status: post.status,
          publishedAt: post.publishedAt,
          seo: {
            titleVi: post.seoTitle.vi,
            titleEn: post.seoTitle.en,
            descriptionVi: post.seoDescription.vi,
            descriptionEn: post.seoDescription.en,
            keywordsVi: post.seoKeywords.vi,
            keywordsEn: post.seoKeywords.en,
          },
        }}
      />
    </div>
  )
}
