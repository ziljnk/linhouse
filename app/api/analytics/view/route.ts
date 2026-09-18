import { NextResponse } from "next/server"
import { recordPageview } from "@/lib/analytics"

export async function POST(request: Request) {
  let path = ""
  let referrer = ""

  try {
    const raw = await request.text()
    if (raw) {
      const body = JSON.parse(raw) as { path?: unknown; referrer?: unknown }
      if (typeof body.path === "string") path = body.path
      if (typeof body.referrer === "string") referrer = body.referrer
    }
  } catch {
    return new NextResponse(null, { status: 204 })
  }

  try {
    await recordPageview({ path, referrer }, request.headers)
  } catch {
    // Tracking must never break the storefront.
  }

  return new NextResponse(null, { status: 204 })
}

