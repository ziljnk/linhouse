"use client"

import { authClient } from "@/lib/auth-client"
import { AdminSessionExpiredError } from "@/lib/persist-admin-images"

export async function hasActiveAdminSession() {
  try {
    const { data, error } = await authClient.getSession()
    if (error) return true
    return Boolean(data?.session)
  } catch {
    return true
  }
}

export function isLoginRedirect(error: unknown) {
  if (typeof error !== "object" || error === null || !("digest" in error)) {
    return false
  }
  const digest = String((error as { digest?: unknown }).digest ?? "")
  return digest.includes("NEXT_REDIRECT") && digest.includes("/admin/login")
}

export function isSessionExpiredFailure(error: unknown) {
  return isLoginRedirect(error) || error instanceof AdminSessionExpiredError
}
