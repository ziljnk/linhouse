import { ChangePasswordForm } from "@/components/admin/change-password-form"
import { SettingsForm } from "@/components/admin/settings-form"
import { requireUsableAdminSession } from "@/lib/admin-session"
import { getSiteSettings } from "@/lib/site-settings-store"

export const metadata = {
  title: "Cài đặt",
}

export default async function AdminSettingsPage() {
  const session = await requireUsableAdminSession()
  const settings = await getSiteSettings()

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cài đặt</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tài khoản đăng nhập và thông tin hiển thị trên website.
        </p>
      </div>
      <ChangePasswordForm email={session.user.email} />
      <SettingsForm defaultValues={settings} />
    </div>
  )
}
