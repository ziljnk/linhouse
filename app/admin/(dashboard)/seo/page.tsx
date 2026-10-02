import { PageSeoForm } from "@/components/admin/page-seo-form"
import { requireUsableAdminSession } from "@/lib/admin-session"
import { getStaticPageSeoEditor } from "@/lib/page-seo"

export const metadata = {
  title: "SEO",
}

export default async function AdminSeoPage() {
  await requireUsableAdminSession()
  const pages = await getStaticPageSeoEditor()

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">SEO</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chỉnh tiêu đề, mô tả và từ khóa của các trang tĩnh. Các thẻ này hiện trên Google và khi chia sẻ link. Sản phẩm, bộ sưu tập và bài viết chỉnh trong từng mục tương ứng. Để trống một ô để giữ nội dung mặc định của trang.
        </p>
      </div>
      <PageSeoForm pages={pages} />
    </div>
  )
}
