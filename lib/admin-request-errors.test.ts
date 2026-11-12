import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  ADMIN_SERVER_BUSY_MESSAGE,
  interpretSessionProbe,
  isAdminServerBusyError,
  isBusyHttpStatus,
  isUnauthenticatedAdminError,
} from "./admin-request-errors"

describe("admin busy errors", () => {
  it("treats gateway timeouts and network failures as a busy server", () => {
    assert.equal(isBusyHttpStatus(504), true)
    assert.equal(isBusyHttpStatus(408), true)
    assert.equal(isBusyHttpStatus(401), false)
    assert.equal(isAdminServerBusyError({ status: 504 }), true)
    assert.equal(isAdminServerBusyError({ status: 502 }), true)
    assert.equal(isAdminServerBusyError(new TypeError("Failed to fetch")), true)
    assert.equal(
      isAdminServerBusyError(new Error("An unexpected response was received from the server.")),
      true
    )
    assert.equal(isAdminServerBusyError(new Error("timeout")), true)
    assert.equal(isAdminServerBusyError(new Error("ok"), { online: false }), true)
  })

  it("does not treat a real 401 or a validation message as the server being busy", () => {
    const expired = new Error("Phiên đăng nhập đã hết hạn.")
    expired.name = "AdminSessionExpiredError"
    assert.equal(isAdminServerBusyError(expired), false)
    assert.equal(isAdminServerBusyError({ status: 401, message: "Unauthorized" }), false)
    assert.equal(isAdminServerBusyError(new Error("Ảnh vượt quá 10MB.")), false)
    assert.equal(isUnauthenticatedAdminError(expired), true)
    assert.equal(isUnauthenticatedAdminError({ status: 401 }), true)
    assert.equal(isUnauthenticatedAdminError({ status: 504 }), false)
    assert.equal(isUnauthenticatedAdminError(new TypeError("Failed to fetch")), false)
  })

  it("recognizes the login redirect digest and the busy copy", () => {
    assert.equal(
      isUnauthenticatedAdminError({ digest: "NEXT_REDIRECT;replace;/admin/login;307;" }),
      true
    )
    assert.equal(isAdminServerBusyError(new Error(ADMIN_SERVER_BUSY_MESSAGE)), true)
    const busy = new Error(ADMIN_SERVER_BUSY_MESSAGE)
    busy.name = "AdminServerBusyError"
    assert.equal(isUnauthenticatedAdminError(busy), false)
  })
})

describe("interpretSessionProbe", () => {
  it("does not treat a failed get-session call as signed out", () => {
    assert.equal(interpretSessionProbe({ data: null, error: { status: 504 } }), "unknown")
    assert.equal(
      interpretSessionProbe({ data: null, error: { message: "Failed to fetch" } }),
      "unknown"
    )
    assert.equal(interpretSessionProbe(null, new TypeError("Failed to fetch")), "unknown")
    assert.equal(interpretSessionProbe(null, new Error("timeout")), "unknown")
  })

  it("treats a real 401 or an empty successful session as signed out", () => {
    assert.equal(interpretSessionProbe({ data: null, error: { status: 401 } }), "anonymous")
    assert.equal(interpretSessionProbe({ data: null, error: null }), "anonymous")
    assert.equal(
      interpretSessionProbe({ data: { session: { id: "s" } }, error: null }),
      "active"
    )
    assert.equal(interpretSessionProbe(null, { status: 401 }), "anonymous")
  })
})
