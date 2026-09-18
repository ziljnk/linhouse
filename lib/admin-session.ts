import { cache } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export const getAdminSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
    query: {
      disableCookieCache: true,
    },
  })
})

export async function requireAdminSession() {
  const session = await getAdminSession()
  if (!session) {
    redirect("/admin/login")
  }
  return session
}

export function needsPasswordChange(user: {
  mustChangePassword?: boolean | null
}) {
  return user.mustChangePassword === true
}

export async function requireUsableAdminSession() {
  const session = await requireAdminSession()
  if (needsPasswordChange(session.user)) {
    redirect("/admin/change-password")
  }
  return session
}
