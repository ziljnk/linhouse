"use client"

import { useState, useTransition, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function AdminLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedEmail = email.trim()
    if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
      setError("Vui lòng nhập email hợp lệ.")
      return
    }
    if (!password) {
      setError("Vui lòng nhập mật khẩu.")
      return
    }

    setError(null)
    startTransition(() => {
      router.push("/admin")
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="admin-email">Email</Label>
        <Input
          id="admin-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="admin@linhouse.com.vn"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            if (error) setError(null)
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "admin-login-error" : undefined}
          disabled={isPending}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="admin-password">Mật khẩu</Label>
        <InputGroup>
          <InputGroupInput
            id="admin-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Nhập mật khẩu"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              if (error) setError(null)
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "admin-login-error" : undefined}
            disabled={isPending}
            required
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>

      <label className="flex items-center gap-2 text-sm select-none">
        <Checkbox
          checked={remember}
          onCheckedChange={(checked) => setRemember(checked === true)}
          disabled={isPending}
          name="remember"
        />
        Ghi nhớ đăng nhập
      </label>

      {error ? (
        <p
          id="admin-login-error"
          role="alert"
          className="text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isPending} size="lg">
        {isPending ? (
          <>
            <Loader2 className="animate-spin" />
            Đang đăng nhập...
          </>
        ) : (
          "Đăng nhập"
        )}
      </Button>
    </form>
  )
}
