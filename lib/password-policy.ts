import type { BetterAuthPlugin } from "better-auth"
import { APIError } from "better-auth/api"
import { isNewPasswordValid } from "@/lib/admin-password"

export const PASSWORD_POLICY_ERROR = {
  code: "PASSWORD_DOES_NOT_MATCH_REQUIREMENTS",
  message: "Password does not match requirements",
} as const

export function passwordPolicy(): BetterAuthPlugin {
  return {
    id: "password-policy",
    init(ctx) {
      const originalHash = ctx.password.hash

      return {
        context: {
          password: {
            ...ctx.password,
            async hash(password: string) {
              if (!isNewPasswordValid(password)) {
                throw APIError.from("BAD_REQUEST", PASSWORD_POLICY_ERROR)
              }

              return originalHash(password)
            },
          },
        },
      }
    },
  }
}
