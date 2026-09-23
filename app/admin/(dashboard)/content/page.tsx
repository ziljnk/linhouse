import { SiteContentForm } from "@/components/admin/site-content-form"
import { requireUsableAdminSession } from "@/lib/admin-session"
import { getSiteContentForm } from "@/lib/site-content"

export const metadata = {
  title: "Nội dung",
}

export default async function AdminContentPage() {
  const [, content] = await Promise.all([
    requireUsableAdminSession(),
    getSiteContentForm(),
  ])

  return (
    <div className="flex w-full flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nội dung</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sửa chữ cố định trên website: trang giới thiệu, chính sách giao hàng, hỗ trợ khách hàng, điều khoản sử dụng, chính sách bảo mật, tiêu đề section và các đoạn mô tả dùng chung.
        </p>
      </div>
      <SiteContentForm
        sections={content.sections}
        defaultValues={content.values}
        defaults={content.defaults}
      />
    </div>
  )
}
