import type { Metadata } from "next"
import Image from "next/image"
import { AdminLoginForm } from "@/components/admin/login-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Đăng nhập",
}

export default function AdminLoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-burgundy-deep lg:block">
        <Image
          src="/hero/appointment.jpg"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover object-[center_30%]"
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-primary/40 to-transparent to-50%" />
        <div className="absolute inset-0 flex flex-col justify-between p-10 text-ivory">
          <Image
            src="/logo.png"
            alt="LINHouse"
            width={410}
            height={512}
            className="h-14 w-auto shrink-0 self-start"
            priority
          />
          <div className="max-w-md space-y-3">
            <p className="text-xs font-medium tracking-[0.28em] text-gold uppercase">
              Atelier váy cưới
            </p>
            <p className="font-heading text-3xl leading-tight font-medium">
              LINHouse Admin
            </p>
            <p className="text-sm text-ivory/80">
              Quản lý sản phẩm, bộ sưu tập và nội dung website.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center bg-background px-6 py-10">
        <div className="mb-8 lg:hidden">
          <Image
            src="/logo.png"
            alt="LINHouse"
            width={410}
            height={512}
            className="mx-auto h-16 w-auto"
            priority
          />
        </div>

        <Card className="w-full max-w-md ring-border">
          <CardHeader className="gap-2">
            <CardTitle className="font-heading text-xl font-medium">
              Đăng nhập
            </CardTitle>
            <CardDescription>
              Nhập thông tin tài khoản để truy cập trang quản trị.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminLoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
