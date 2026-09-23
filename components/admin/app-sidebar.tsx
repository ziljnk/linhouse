"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Bell,
  Images,
  FileText,
  LayoutDashboard,
  Library,
  LogOut,
  Newspaper,
  Quote,
  Settings,
  Shirt,
} from "lucide-react"
import { authClient } from "@/lib/auth-client"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"

const navItems = [
  { title: "Tổng quan", href: "/admin", icon: LayoutDashboard },
  { title: "Sản phẩm", href: "/admin/products", icon: Shirt },
  { title: "Bộ sưu tập", href: "/admin/collections", icon: Images },
  { title: "Danh mục", href: "/admin/catalog", icon: Library },
  { title: "Câu chuyện cô dâu", href: "/admin/testimonials", icon: Quote },
  { title: "Blog", href: "/admin/blog", icon: Newspaper },
  { title: "Nội dung", href: "/admin/content", icon: FileText },
]

const systemItems = [
  { title: "Cài đặt chung", href: "/admin/settings", icon: Settings },
  { title: "Cài đặt thông báo", href: "/admin/notifications", icon: Bell },
]

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="LINHouse Admin"
              render={<Link href="/admin" />}
            >
              <span className="relative size-8 shrink-0 overflow-hidden rounded-md">
                <Image
                  src="/logo.png"
                  alt="LINHouse"
                  fill
                  className="object-contain p-0.5"
                />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5 leading-none">
                <span className="truncate font-semibold">LINHouse</span>
                <span className="truncate text-xs text-muted-foreground">
                  Trang quản trị
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Quản lý</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isActivePath(pathname, item.href)}
                    tooltip={item.title}
                    render={<Link href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Hệ thống</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isActivePath(pathname, item.href)}
                    tooltip={item.title}
                    render={<Link href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Xem website" render={<Link href="/vi" />}>
              <span>Xem website</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Đăng xuất"
              onClick={async () => {
                await authClient.signOut()
                router.push("/admin/login")
                router.refresh()
              }}
            >
              <LogOut />
              <span>Đăng xuất</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
