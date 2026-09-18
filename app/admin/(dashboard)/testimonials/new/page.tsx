import { AdminBackButton } from "@/components/admin/back-button"
import { TestimonialForm } from "@/components/admin/testimonial-form"
import { requireUsableAdminSession } from "@/lib/admin-session"

export const metadata = {
  title: "Thêm câu chuyện",
}

export default async function NewTestimonialPage() {
  await requireUsableAdminSession()

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <div>
        <div className="flex items-center gap-2">
          <AdminBackButton href="/admin/testimonials" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Thêm câu chuyện
          </h1>
        </div>
        <p className="mt-1 ps-11 text-sm text-muted-foreground">
          Thêm ảnh, lời nhắn và thông tin váy cho slider trang chủ.
        </p>
      </div>
      <TestimonialForm />
    </div>
  )
}
