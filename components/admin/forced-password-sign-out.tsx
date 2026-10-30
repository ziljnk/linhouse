"use client"

import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { clearUserDrafts } from "@/lib/admin-drafts"
import { Button } from "@/components/ui/button"

export function ForcedPasswordSignOut() {
  const router = useRouter()

  return (
    <Button
      type="button"
      variant="ghost"
      className="w-full"
      onClick={async () => {
        const { data } = await authClient.getSession()
        if (data?.user?.id) {
          try {
            await clearUserDrafts(data.user.id)
          } catch (error) {
            console.error("Could not clear admin drafts", error)
          }
        }
        await authClient.signOut()
        router.push("/admin/login")
        router.refresh()
      }}
    >
      Đăng xuất
    </Button>
  )
}
