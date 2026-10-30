import { UnsavedDraftsPanel } from "@/components/admin/unsaved-drafts-panel"
import { requireUsableAdminSession } from "@/lib/admin-session"

export const metadata = {
  title: "Nháp chưa lưu",
}

export default async function UnsavedDraftsPage() {
  await requireUsableAdminSession()

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nháp chưa lưu</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Nội dung đang soạn trên trình duyệt này, chưa gửi lên máy chủ.
        </p>
      </div>
      <UnsavedDraftsPanel />
    </div>
  )
}
