import { NextResponse } from "next/server";
 
let locales = ['en', 'vi']
 
// Get the preferred locale, similar to the above or using a library
function getLocale(request) { return 'en' }
 
function isLocaleExempt(pathname) {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  )
}

export function proxy(request) {
  // Check if there is any supported locale in the pathname
  const { pathname } = request.nextUrl

  if (isLocaleExempt(pathname)) return

  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )
 
  if (pathnameHasLocale) return
 
  // Redirect if there is no locale
  const locale = getLocale(request)
  request.nextUrl.pathname = `/${locale}${pathname}`
  // e.g. incoming request is /products
  // The new URL is now /en/products
  return NextResponse.redirect(request.nextUrl)
}
 
export const config = {
  matcher: [
    // Skip internal Next.js paths and static files in /public
    "/((?!_next|admin(?:/|$)|robots\\.txt|sitemap\\.xml|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|txt|xml)).*)",
  ],
};