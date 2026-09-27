import { eq } from "drizzle-orm"
import { hashPassword } from "better-auth/crypto"
import { auth } from "../lib/auth"
import { db } from "../lib/db/index"
import { user } from "../lib/db/schema"

async function seedDevAdmin() {
  const email = process.env.DEV_ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.DEV_ADMIN_PASSWORD
  const name = process.env.DEV_ADMIN_NAME?.trim()

  if (!email || !password || !name) {
    throw new Error(
      "DEV_ADMIN_EMAIL, DEV_ADMIN_PASSWORD, and DEV_ADMIN_NAME are required"
    )
  }

  if (password.length < 8) {
    throw new Error("DEV_ADMIN_PASSWORD must be at least 8 characters")
  }

  const ctx = await auth.$context
  const existing = await ctx.internalAdapter.findUserByEmail(email)

  if (existing) {
    const [current] = await db
      .select({ mustChangePassword: user.mustChangePassword })
      .from(user)
      .where(eq(user.id, existing.user.id))
      .limit(1)

    if (current?.mustChangePassword == null) {
      await ctx.internalAdapter.updateUser(existing.user.id, {
        mustChangePassword: true,
      })
      console.log("Dev admin user already exists; password change required")
      return
    }

    console.log("Dev admin user already exists")
    return
  }

  const createdUser = await ctx.internalAdapter.createUser(
    {
      email,
      name,
      emailVerified: true,
    },
    { method: "email" }
  )

  await ctx.internalAdapter.createAccount({
    userId: createdUser.id,
    accountId: createdUser.id,
    providerId: "credential",
    password: await hashPassword(password),
  })

  await ctx.internalAdapter.updateUser(createdUser.id, {
    mustChangePassword: true,
  })

  console.log("Created dev admin user")
}

seedDevAdmin()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : "Failed to seed dev admin"
    )
    process.exit(1)
  })
