import { AdminBackButton } from "@/components/admin/back-button"
import { CollectionForm } from "@/components/admin/collection-form"
import { requireUsableAdminSession } from "@/lib/admin-session"

export const metadata = {
  title: "Tạo bộ sưu tập",
}

export default async function NewCollectionPage() {
  await requireUsableAdminSession()

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <div>
        <div className="flex items-center gap-2">
          <AdminBackButton href="/admin/collections" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Tạo bộ sưu tập
          </h1>
        </div>
        <p className="mt-1 ps-11 text-sm text-muted-foreground">
          Thêm tên, mô tả, ảnh bìa, lookbook và SEO cho bộ sưu tập.
        </p>
      </div>
      <CollectionForm />
    </div>
  )
}
