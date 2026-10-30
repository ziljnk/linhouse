"use client"

import { useEffect } from "react"
import { authClient } from "@/lib/auth-client"

export function ClearStaleAdminSession() {
  useEffect(() => {
    // Expired sessions land here. Do not clear local drafts.
    void authClient.signOut({
      fetchOptions: {
        throw: false,
      },
    })
  }, [])

  return null
}
