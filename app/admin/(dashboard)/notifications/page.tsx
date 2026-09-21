import { NotificationSettingsForm } from "@/components/admin/notification-settings-form"
import { requireUsableAdminSession } from "@/lib/admin-session"
import { getSiteSettings } from "@/lib/site-settings-store"

export const metadata = {
  title: "Cài đặt thông báo",
}

export default async function AdminNotificationSettingsPage() {
  await requireUsableAdminSession()
  const settings = await getSiteSettings()

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Cài đặt thông báo
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Email nhận thông báo khi khách gửi form đặt lịch trên website.
        </p>
      </div>
      <NotificationSettingsForm
        defaultEmails={settings.notifications.emails}
        fallbackEmail={settings.contact.email}
      />
    </div>
  )
}
