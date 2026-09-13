import { SettingsForm } from "@/components/admin/settings-form"
import { getSiteSettings } from "@/lib/site-settings-store"

export const metadata = {
  title: "Cài đặt",
}

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings()

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cài đặt chung</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Thông tin liên hệ, địa chỉ và doanh nghiệp hiển thị trên website.
        </p>
      </div>
      <SettingsForm defaultValues={settings} />
    </div>
  )
}
