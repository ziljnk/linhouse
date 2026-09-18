"use client"

import { useState, type FormEvent, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Check, Circle, Eye, EyeOff, Loader2 } from "lucide-react"
import { changeAdminPasswordAction } from "@/app/admin/change-password/actions"
import {
  getNewPasswordChecks,
  validatePasswordChange,
} from "@/lib/admin-password"
import { toastError, toastSuccess } from "@/lib/admin-toast"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  disabled,
  invalid,
  describedBy,
  children,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: string
  disabled: boolean
  invalid: boolean
  describedBy?: string
  children?: ReactNode
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <InputGroup>
        <InputGroupInput
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          disabled={disabled}
          required
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="button"
            size="icon-xs"
            aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            onClick={() => setVisible((current) => !current)}
          >
            {visible ? <EyeOff /> : <Eye />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {children}
    </div>
  )
}

function NewPasswordChecklist({ password }: { password: string }) {
  const checks = getNewPasswordChecks(password)

  return (
    <ul id="new-password-rules" className="flex flex-col gap-1.5 pt-0.5">
      {checks.map((check) => (
        <li
          key={check.id}
          className={cn(
            "flex items-center gap-2 text-xs",
            check.met ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {check.met ? (
            <Check className="size-3.5 shrink-0" aria-hidden />
          ) : (
            <Circle className="size-3.5 shrink-0" aria-hidden />
          )}
          <span>
            {check.label}
            <span className="sr-only">
              {check.met ? " — đủ điều kiện" : " — chưa đủ"}
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}

export function ChangePasswordForm({
  email,
  variant = "settings",
}: {
  email: string
  variant?: "settings" | "forced"
}) {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  function clearMessages() {
    if (error) setError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationError = validatePasswordChange({
      currentPassword,
      newPassword,
      confirmPassword,
    })
    if (validationError) {
      setError(validationError)
      toastError(validationError)
      return
    }

    setError(null)
    setIsPending(true)

    try {
      const result = await changeAdminPasswordAction({
        currentPassword,
        newPassword,
      })

      if (!result.ok) {
        setError(result.error)
        toastError(result.error)
        return
      }

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toastSuccess("Đã đổi mật khẩu.")

      if (variant === "forced") {
        router.push("/admin")
        router.refresh()
        return
      }

      router.refresh()
    } catch {
      const message = "Không thể đổi mật khẩu. Vui lòng thử lại."
      setError(message)
      toastError(message)
    } finally {
      setIsPending(false)
    }
  }

  const invalid = Boolean(error)
  const fields = (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="account-email">Email</Label>
        <Input id="account-email" value={email} readOnly disabled />
      </div>

      <PasswordField
        id="current-password"
        label="Mật khẩu hiện tại"
        value={currentPassword}
        onChange={(value) => {
          setCurrentPassword(value)
          clearMessages()
        }}
        autoComplete="current-password"
        disabled={isPending}
        invalid={invalid}
        describedBy={invalid ? "change-password-error" : undefined}
      />
      <PasswordField
        id="new-password"
        label="Mật khẩu mới"
        value={newPassword}
        onChange={(value) => {
          setNewPassword(value)
          clearMessages()
        }}
        autoComplete="new-password"
        disabled={isPending}
        invalid={invalid}
        describedBy={
          invalid
            ? "new-password-rules change-password-error"
            : "new-password-rules"
        }
      >
        <NewPasswordChecklist password={newPassword} />
      </PasswordField>
      <PasswordField
        id="confirm-password"
        label="Xác nhận mật khẩu mới"
        value={confirmPassword}
        onChange={(value) => {
          setConfirmPassword(value)
          clearMessages()
        }}
        autoComplete="new-password"
        disabled={isPending}
        invalid={invalid}
        describedBy={invalid ? "change-password-error" : undefined}
      />

      {error ? (
        <p
          id="change-password-error"
          role="alert"
          className="text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div>
        <Button
          type="submit"
          disabled={isPending}
          className={variant === "forced" ? "w-full" : undefined}
          size={variant === "forced" ? "lg" : "default"}
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin" />
              Đang lưu...
            </>
          ) : (
            "Đổi mật khẩu"
          )}
        </Button>
      </div>
    </>
  )

  const form = (
    <form
      onSubmit={handleSubmit}
      method="post"
      className="flex flex-col gap-4"
      noValidate
    >
      {fields}
    </form>
  )

  if (variant === "forced") {
    return form
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
      <div className="mb-5">
        <h2 className="text-base font-semibold">Tài khoản</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Đổi mật khẩu đăng nhập admin. Mật khẩu được lưu hash trong database.
        </p>
      </div>
      {form}
    </section>
  )
}
