"use client"

import { authClient } from "@/lib/auth-client"
import {
  interpretSessionProbe,
  isLoginRedirect,
  isUnauthenticatedAdminError,
} from "@/lib/admin-request-errors"

export { isLoginRedirect }

export async function hasActiveAdminSession() {
  try {
    const result = await authClient.getSession()
    return interpretSessionProbe(result) !== "anonymous"
  } catch (error) {
    return interpretSessionProbe(null, error) !== "anonymous"
  }
}

export function isSessionExpiredFailure(error: unknown) {
  return isUnauthenticatedAdminError(error)
}
