import type { Metadata } from "next"
import { Cormorant_Garamond, Geist, Geist_Mono, Inter } from "next/font/google"
import { notFound } from "next/navigation"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { cn } from "@/lib/utils"
import { getDictionary, hasLocale } from "./dictionaries"
import "../globals.css"

const inter = Inter({ subsets: ["latin", "vietnamese"], variable: "--font-sans" })

const heading = Cormorant_Garamond({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
})

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "LINHouse",
  description: "Atelier váy cưới LINHouse",
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params

  if (!hasLocale(locale)) notFound()

  const dict = await getDictionary(locale)

  return (
    <html
      lang={locale}
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        heading.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader locale={locale} nav={dict.nav} brand={dict.brand} />
        {children}
        <SiteFooter footer={dict.footer} />
      </body>
    </html>
  )
}
