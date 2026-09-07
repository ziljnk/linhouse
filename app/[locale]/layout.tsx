import type { Metadata } from "next"
import { Geist_Mono, Montserrat } from "next/font/google"
import { notFound } from "next/navigation"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { SocialFloat } from "@/components/social-float"
import { cn } from "@/lib/utils"
import { getDictionary, hasLocale } from "./dictionaries"
import "../globals.css"
import { TooltipProvider } from "@/components/ui/tooltip"

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  variable: "--font-montserrat",
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "LINHouse",
  description: "Atelier váy cưới LINHouse",
  icons: {
    icon: [
      { url: "/icons/favicon.ico", sizes: "any" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: {
      url: "/icons/apple-touch-icon.png",
      sizes: "180x180",
      type: "image/png",
    },
  },
  manifest: "/icons/site.webmanifest",
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
        montserrat.variable,
        geistMono.variable,
        "font-sans"
      )}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>
          <SiteHeader
            locale={locale}
            nav={dict.nav}
            brand={dict.brand}
            booking={dict.booking}
            storeAddress={dict.footer.company.address}
          />
          {children}
          <SiteFooter footer={dict.footer} />
          <SocialFloat
            social={dict.social}
            email={dict.footer.company.email}
            phone={dict.footer.company.phone}
          />
        </TooltipProvider>
      </body>
    </html>
  )
}
