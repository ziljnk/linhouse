import { redirect } from "next/navigation"
import { ForcedPasswordChangeScreen } from "@/components/admin/forced-password-change-screen"
import {
  needsPasswordChange,
  requireAdminSession,
} from "@/lib/admin-session"

export const metadata = {
  title: "Đổi mật khẩu",
}

export default async function AdminChangePasswordPage() {
  const session = await requireAdminSession()

  if (!needsPasswordChange(session.user)) {
    redirect("/admin")
  }

  return <ForcedPasswordChangeScreen email={session.user.email} />
}
