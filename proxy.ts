import { NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

const locales = ["en", "vi"] as const
const appModes = ["all", "storefront", "admin"] as const

type AppMode = (typeof appModes)[number]

function getLocale() {
  return "en"
}

function getAppMode(): AppMode {
  const mode = process.env.APP_MODE?.trim()
  if (mode === "all" || mode === "storefront" || mode === "admin") return mode
  return "all"
}

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/")
}

function isAdminApiPath(pathname: string) {
  return pathname === "/api/admin" || pathname.startsWith("/api/admin/")
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

  // `all` and `admin` serve both surfaces. `storefront` hides admin entirely.
  if (
    getAppMode() === "storefront" &&
    (isAdminPath(pathname) || isAdminApiPath(pathname))
  ) {
    if (isAdminApiPath(pathname)) {
      return new NextResponse(null, { status: 404 })
    }

    const url = request.nextUrl.clone()
    url.pathname = `/${getLocale()}/__not-found`
    return NextResponse.rewrite(url)
  }

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
