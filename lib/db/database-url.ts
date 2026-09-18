const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1"])

/** Matches `.env.example` / local Docker Compose. Safe only on loopback. */
const LOCAL_DEV_PASSWORD = "linhouse"

export function assertDatabaseUrl(connectionString: string) {
  let url: URL
  try {
    url = new URL(connectionString)
  } catch {
    throw new Error("DATABASE_URL is invalid")
  }

  if (url.protocol !== "mysql:" && url.protocol !== "mysql2:") {
    throw new Error("DATABASE_URL must be a mysql connection string")
  }

  const host = url.hostname.toLowerCase()
  const isLoopback = LOOPBACK_HOSTS.has(host)
  const password = decodeURIComponent(url.password)

  if (process.env.VERCEL === "1" && isLoopback) {
    throw new Error(
      "DATABASE_URL points to localhost, which is not reachable on Vercel. Use a hosted MySQL URL."
    )
  }

  if (!isLoopback && password === LOCAL_DEV_PASSWORD) {
    throw new Error(
      "DATABASE_URL is using the local-dev password on a remote host. Use a unique password for this environment."
    )
  }
}
