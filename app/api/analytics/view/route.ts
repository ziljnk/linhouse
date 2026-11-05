import { NextResponse } from "next/server"
import { recordPageview } from "@/lib/analytics"

export async function POST(request: Request) {
  let path = ""
  let referrer = ""
  let source: string | undefined

  try {
    const raw = await request.text()
    if (raw) {
      const body = JSON.parse(raw) as {
        path?: unknown
        referrer?: unknown
        source?: unknown
      }
      if (typeof body.path === "string") path = body.path
      if (typeof body.referrer === "string") referrer = body.referrer
      if (typeof body.source === "string") source = body.source
    }
  } catch {
    return new NextResponse(null, { status: 204 })
  }

  try {
    await recordPageview({ path, referrer, source }, request.headers)
  } catch {
    // Tracking must never break the storefront.
  }

  return new NextResponse(null, { status: 204 })
}

