import Image from "next/image"
import { ChangePasswordForm } from "@/components/admin/change-password-form"
import { ForcedPasswordSignOut } from "@/components/admin/forced-password-sign-out"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function ForcedPasswordChangeScreen({ email }: { email: string }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-6 py-10">
      <div className="mb-8">
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
            Đặt mật khẩu mới
          </CardTitle>
          <CardDescription>
            Lần đăng nhập đầu tiên cần đổi mật khẩu mặc định trước khi vào trang
            quản trị.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <ChangePasswordForm email={email} variant="forced" />
          <ForcedPasswordSignOut />
        </CardContent>
      </Card>
    </div>
  )
}
