"use server"

import { headers } from "next/headers"
import { getAdminSession } from "@/lib/admin-session"
import { toChangePasswordError, validateNewPassword } from "@/lib/admin-password"
import { auth } from "@/lib/auth"

export async function changeAdminPasswordAction(input: {
  currentPassword: string
  newPassword: string
}) {
  const session = await getAdminSession()
  if (!session) {
    return { ok: false as const, error: "Phiên đăng nhập đã hết hạn." }
  }

  if (input.currentPassword.length < 8) {
    return { ok: false as const, error: "Mật khẩu hiện tại phải có ít nhất 8 ký tự." }
  }

  const newPasswordError = validateNewPassword(input.newPassword)
  if (newPasswordError) {
    return { ok: false as const, error: newPasswordError }
  }

  if (input.newPassword === input.currentPassword) {
    return { ok: false as const, error: "Mật khẩu mới phải khác mật khẩu hiện tại." }
  }

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : null
    return { ok: false as const, error: toChangePasswordError(message) }
  }

  const ctx = await auth.$context
  await ctx.internalAdapter.updateUser(session.user.id, {
    mustChangePassword: false,
  })

  return { ok: true as const }
}
