import { and, eq } from "drizzle-orm"
import { hashPassword } from "better-auth/crypto"
import { auth } from "../lib/auth"
import { db } from "../lib/db/index"
import { account, session } from "../lib/db/schema"

async function resetAdminForFirstLogin() {
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
  const passwordHash = await hashPassword(password)

  if (!existing) {
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
      password: passwordHash,
    })

    await ctx.internalAdapter.updateUser(createdUser.id, {
      mustChangePassword: true,
    })

    console.log("Created admin user for first-login test")
    console.log(`Email: ${email}`)
    return
  }

  const userId = existing.user.id

  await ctx.internalAdapter.updateUser(userId, {
    mustChangePassword: true,
  })

  await db
    .update(account)
    .set({
      password: passwordHash,
      updatedAt: new Date(),
    })
    .where(
      and(eq(account.userId, userId), eq(account.providerId, "credential"))
    )

  await db.delete(session).where(eq(session.userId, userId))

  console.log("Reset admin to first-login state")
  console.log(`Email: ${email}`)
}

resetAdminForFirstLogin()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : "Failed to reset admin"
    )
    process.exit(1)
  })
