import { eq } from "drizzle-orm"
import { hashPassword } from "better-auth/crypto"
import { auth } from "../lib/auth"
import { db } from "../lib/db/index"
import { user } from "../lib/db/schema"

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  const name = "LINHouse Admin"

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required")
  }

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters")
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
      console.log("Admin user already exists; password change required")
      return
    }

    console.log("Admin user already exists")
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

  console.log("Created admin user")
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Failed to seed admin")
    process.exit(1)
  })
