import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/admin/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  needsPasswordChange,
  requireAdminSession,
} from "@/lib/admin-session"

export default async function AdminDashboardLayout({
  children,
}: LayoutProps<"/admin">) {
  const session = await requireAdminSession()

  if (needsPasswordChange(session.user)) {
    redirect("/admin/change-password")
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
