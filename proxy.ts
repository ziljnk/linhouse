import { NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

const locales = ["en", "vi"] as const

function getLocale() {
  return "en"
}

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/")
}

function isAdminLogin(pathname: string) {
  return pathname === "/admin/login"
}

function isLocaleExempt(pathname: string) {
  return (
    pathname === "/api" ||
    pathname.startsWith("/api/") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  )
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isAdminPath(pathname)) {
    // Presence-only gate. Signature and DB checks happen in requireAdminSession.
    const sessionCookie = getSessionCookie(request)

    if (isAdminLogin(pathname)) {
      return NextResponse.next()
    }

    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }

    return NextResponse.next()
  }

  if (isLocaleExempt(pathname)) {
    return NextResponse.next()
  }

  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (pathnameHasLocale) return NextResponse.next()

  const locale = getLocale()
  request.nextUrl.pathname = `/${locale}${pathname}`
  return NextResponse.redirect(request.nextUrl)
}

export const config = {
  matcher: [
    "/((?!_next|robots\\.txt|sitemap\\.xml|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|txt|xml)).*)",
  ],
}
