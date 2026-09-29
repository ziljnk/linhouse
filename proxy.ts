import { NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"
import { getAppMode, isIndexableDeployment, NOINDEX_ROBOTS_HEADER } from "@/lib/seo"

const locales = ["en", "vi"] as const

function getLocale() {
  return "en"
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

function isPrivatePath(pathname: string) {
  return (
    isAdminPath(pathname) ||
    isAdminApiPath(pathname) ||
    pathname === "/api" ||
    pathname.startsWith("/api/")
  )
}

function withIndexingHeaders(response: NextResponse, request: NextRequest) {
  if (!isIndexableDeployment() || isPrivatePath(request.nextUrl.pathname)) {
    response.headers.set("X-Robots-Tag", NOINDEX_ROBOTS_HEADER)
  }
  return response
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
      return withIndexingHeaders(new NextResponse(null, { status: 404 }), request)
    }

    const url = request.nextUrl.clone()
    url.pathname = `/${getLocale()}/__not-found`
    return withIndexingHeaders(NextResponse.rewrite(url), request)
  }

  if (isAdminPath(pathname)) {
    // Presence-only gate. Signature and DB checks happen in requireAdminSession.
    const sessionCookie = getSessionCookie(request)

    if (isAdminLogin(pathname)) {
      return withIndexingHeaders(NextResponse.next(), request)
    }

    if (!sessionCookie) {
      return withIndexingHeaders(
        NextResponse.redirect(new URL("/admin/login", request.url)),
        request
      )
    }

    return withIndexingHeaders(NextResponse.next(), request)
  }

  if (isLocaleExempt(pathname)) {
    return withIndexingHeaders(NextResponse.next(), request)
  }

  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (pathnameHasLocale) return withIndexingHeaders(NextResponse.next(), request)

  const locale = getLocale()
  request.nextUrl.pathname = `/${locale}${pathname}`
  return withIndexingHeaders(NextResponse.redirect(request.nextUrl), request)
}

export const config = {
  matcher: [
    "/((?!_next|robots\\.txt|sitemap\\.xml|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|txt|xml)).*)",
  ],
}
