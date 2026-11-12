export const ADMIN_SERVER_BUSY_MESSAGE = "Máy chủ đang bận, vui lòng thử lại"
export const ADMIN_SERVER_BUSY_RETRY_LABEL = "Thử lại"

const BUSY_STATUSES = new Set([408, 502, 503, 504, 524])

const BUSY_MESSAGE =
  /failed to fetch|networkerror|network error|load failed|timeout|timed out|gateway time-?out|econnreset|econnaborted|enotfound|fetch failed|socket hang up|unexpected response was received from the server|aborted/i

export function isBusyHttpStatus(status: number) {
  return BUSY_STATUSES.has(status)
}

export function readErrorStatus(error: unknown): number | null {
  if (typeof error !== "object" || error === null) return null
  const record = error as { status?: unknown; statusCode?: unknown; error?: unknown }
  const direct = record.status ?? record.statusCode
  if (typeof direct === "number" && Number.isFinite(direct)) return direct
  if (record.error && record.error !== error) return readErrorStatus(record.error)
  return null
}

export function readErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message
    return typeof message === "string" ? message : ""
  }
  return ""
}

export function isAdminServerBusyError(
  error: unknown,
  options?: { online?: boolean }
) {
  if (readErrorStatus(error) === 401) return false
  if (error instanceof Error && error.name === "AdminServerBusyError") return true
  if (readErrorMessage(error) === ADMIN_SERVER_BUSY_MESSAGE) return true
  if (options?.online === false) return true
  const status = readErrorStatus(error)
  if (status != null && BUSY_STATUSES.has(status)) return true
  const message = readErrorMessage(error)
  if (!message) return false
  return BUSY_MESSAGE.test(message)
}

export function isLoginRedirect(error: unknown) {
  if (typeof error !== "object" || error === null || !("digest" in error)) {
    return false
  }
  const digest = String((error as { digest?: unknown }).digest ?? "")
  return digest.includes("NEXT_REDIRECT") && digest.includes("/admin/login")
}

/** Real signed-out / 401 responses. Timeouts and 5xx are not session expiry. */
export function isUnauthenticatedAdminError(error: unknown) {
  if (isAdminServerBusyError(error)) return false
  if (isLoginRedirect(error)) return true
  if (error instanceof Error && error.name === "AdminSessionExpiredError") return true
  return readErrorStatus(error) === 401
}

export type SessionProbe = {
  data?: { session?: unknown } | null
  error?: { status?: number; message?: string } | string | null
}

/**
 * A failed get-session call is "unknown": the save must still run.
 * Only a successful response with no session, or a real 401, is anonymous.
 */
export function interpretSessionProbe(
  result: SessionProbe | null | undefined,
  thrown?: unknown
): "active" | "anonymous" | "unknown" {
  if (thrown) {
    if (readErrorStatus(thrown) === 401) return "anonymous"
    if (thrown instanceof Error && thrown.name === "AdminSessionExpiredError") {
      return "anonymous"
    }
    return "unknown"
  }
  if (!result) return "unknown"
  if (result.error) {
    const status = typeof result.error === "string" ? null : (result.error.status ?? null)
    if (status === 401) return "anonymous"
    return "unknown"
  }
  if (result.data?.session) return "active"
  return "anonymous"
}
