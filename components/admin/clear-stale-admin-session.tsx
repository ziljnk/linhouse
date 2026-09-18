"use client"

import { useEffect } from "react"
import { authClient } from "@/lib/auth-client"

export function ClearStaleAdminSession() {
  useEffect(() => {
    void authClient.signOut({
      fetchOptions: {
        throw: false,
      },
    })
  }, [])

  return null
}
