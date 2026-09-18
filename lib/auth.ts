import { betterAuth } from "better-auth"
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { nextCookies } from "better-auth/next-js"
import { db } from "@/lib/db"
import { account, rateLimit, session, user, verification } from "@/lib/db/schema"
import { passwordPolicy } from "@/lib/password-policy"

const authSecret = process.env.BETTER_AUTH_SECRET
const isProd = process.env.NODE_ENV === "production"
const baseURL = process.env.BETTER_AUTH_URL

if (!authSecret) {
  throw new Error("BETTER_AUTH_SECRET is missing")
}

if (authSecret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET must be at least 32 characters")
}

if (isProd && (!baseURL || !baseURL.startsWith("https://"))) {
  throw new Error("BETTER_AUTH_URL must be https:// in production")
}

export const auth = betterAuth({
  appName: "LINHouse Admin",
  database: drizzleAdapter(db, {
    provider: "mysql",
    schema: {
      user,
      session,
      account,
      verification,
      rateLimit,
    },
  }),
  secret: authSecret,
  baseURL,
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 8,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 30,
    storage: "database",
    customRules: {
      "/sign-in/email": {
        window: 15 * 60,
        max: 5,
      },
      "/change-password": {
        window: 15 * 60,
        max: 5,
      },
    },
  },
  user: {
    additionalFields: {
      mustChangePassword: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false,
        returned: true,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 8,
    updateAge: 60 * 60,
    cookieCache: {
      enabled: false,
    },
  },
  trustedOrigins: [
    baseURL,
    ...(!isProd
      ? ["http://localhost:3000", "http://127.0.0.1:3000"]
      : []),
  ].filter((origin): origin is string => Boolean(origin)),
  advanced: {
    useSecureCookies: isProd,
    defaultCookieAttributes: {
      httpOnly: true,
      secure: isProd,
      sameSite: "strict",
      path: "/",
    },
  },
  plugins: [passwordPolicy(), nextCookies()],
})
