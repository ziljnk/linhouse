export function normalizeDatabaseUrl(raw) {
  let value = String(raw).replace(/^\uFEFF/, "").trim()
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim()
  }
  return value
}

export function encodeMysqlUrl(raw) {
  const value = normalizeDatabaseUrl(raw)
  if (!value) {
    throw new Error("DATABASE_URL is empty")
  }

  try {
    const parsed = new URL(value)
    if (parsed.protocol !== "mysql:" && parsed.protocol !== "mysql2:") {
      throw new Error("DATABASE_URL must start with mysql://")
    }
    return parsed.href
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "DATABASE_URL must start with mysql://"
    ) {
      throw error
    }
  }

  const match = value.match(/^(mysql2?:\/\/)(.+)$/i)
  if (!match) {
    throw new Error(
      "DATABASE_URL is invalid. Use mysql://USER:PASSWORD@HOST:3306/DATABASE"
    )
  }

  const [, protocol, rest] = match
  const at = rest.lastIndexOf("@")
  if (at < 0) {
    throw new Error(
      "DATABASE_URL is invalid. Use mysql://USER:PASSWORD@HOST:3306/DATABASE"
    )
  }

  const userinfo = rest.slice(0, at)
  const hostAndDb = rest.slice(at + 1)
  const colon = userinfo.indexOf(":")
  const user = colon === -1 ? userinfo : userinfo.slice(0, colon)
  const password = colon === -1 ? "" : userinfo.slice(colon + 1)
  return `${protocol}${encodeURIComponent(user)}:${encodeURIComponent(password)}@${hostAndDb}`
}
