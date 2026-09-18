"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { toastError } from "@/lib/admin-toast"
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

function toLoginError(error?: {
  message?: string | null
  status?: number
  statusCode?: number
} | null) {
  const status = error?.status ?? error?.statusCode
  if (status === 429 || /too many/i.test(error?.message ?? "")) {
    return "Quá nhiều lần thử đăng nhập. Vui lòng đợi rồi thử lại."
  }
  if (!error?.message) return "Không thể đăng nhập. Vui lòng thử lại."
  if (
    /invalid/i.test(error.message) ||
    /credentials/i.test(error.message) ||
    /password/i.test(error.message)
  ) {
    return "Email hoặc mật khẩu không đúng."
  }
  return "Không thể đăng nhập. Vui lòng thử lại."
}

export function AdminLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function login() {
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
      const message = "Vui lòng nhập email hợp lệ."
      setError(message)
      toastError(message)
      return
    }
    if (password.length < 8) {
      const message = "Mật khẩu phải có ít nhất 8 ký tự."
      setError(message)
      toastError(message)
      return
    }

    setError(null)
    setIsPending(true)

    try {
      const { error: signInError } = await authClient.signIn.email({
        email: trimmedEmail,
        password,
        rememberMe: remember,
      })

      if (signInError) {
        const message = toLoginError(signInError)
        setError(message)
        toastError(message)
        return
      }

      router.push("/admin")
      router.refresh()
    } catch {
      const message = "Không thể đăng nhập. Vui lòng thử lại."
      setError(message)
      toastError(message)
    } finally {
      setIsPending(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void login()
  }

  return (
    <form
      onSubmit={handleSubmit}
      method="post"
      className="flex flex-col gap-5"
      noValidate
    >
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
