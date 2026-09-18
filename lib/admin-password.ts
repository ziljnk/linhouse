export const NEW_PASSWORD_RULES = [
  {
    id: "length",
    label: "Tối thiểu 8 ký tự",
    test: (password: string) => password.length >= 8,
  },
  {
    id: "uppercase",
    label: "Có chữ in hoa",
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    id: "number",
    label: "Có số",
    test: (password: string) => /[0-9]/.test(password),
  },
  {
    id: "special",
    label: "Có ký tự đặc biệt",
    test: (password: string) => /[^A-Za-z0-9]/.test(password),
  },
] as const

export function getNewPasswordChecks(password: string) {
  return NEW_PASSWORD_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    met: rule.test(password),
  }))
}

export function isNewPasswordValid(password: string) {
  return NEW_PASSWORD_RULES.every((rule) => rule.test(password))
}

export function toChangePasswordError(message?: string | null) {
  if (!message) return "Không thể đổi mật khẩu. Vui lòng thử lại."
  if (
    /invalid/i.test(message) ||
    /current/i.test(message) ||
    /incorrect/i.test(message)
  ) {
    return "Mật khẩu hiện tại không đúng."
  }
  if (
    /least|short|length|min|requirement/i.test(message) ||
    /PASSWORD_DOES_NOT_MATCH_REQUIREMENTS/i.test(message)
  ) {
    return "Mật khẩu mới chưa đủ điều kiện."
  }
  return "Không thể đổi mật khẩu. Vui lòng thử lại."
}

export function validateNewPassword(password: string) {
  if (!isNewPasswordValid(password)) {
    return "Mật khẩu mới chưa đủ điều kiện."
  }
  return null
}

export function validatePasswordChange(input: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}) {
  if (input.currentPassword.length < 8) {
    return "Mật khẩu hiện tại phải có ít nhất 8 ký tự."
  }

  const newPasswordError = validateNewPassword(input.newPassword)
  if (newPasswordError) return newPasswordError

  if (input.newPassword !== input.confirmPassword) {
    return "Xác nhận mật khẩu không khớp."
  }
  if (input.newPassword === input.currentPassword) {
    return "Mật khẩu mới phải khác mật khẩu hiện tại."
  }
  return null
}
