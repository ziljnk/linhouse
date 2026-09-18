"use client"

import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"

export function ForcedPasswordSignOut() {
  const router = useRouter()

  return (
    <Button
      type="button"
      variant="ghost"
      className="w-full"
      onClick={async () => {
        await authClient.signOut()
        router.push("/admin/login")
        router.refresh()
      }}
    >
      Đăng xuất
    </Button>
  )
}
