import { notFound } from "next/navigation"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { getDictionary, hasLocale } from "./dictionaries"

export default async function LangLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params

  if (!hasLocale(lang)) notFound()

  const dict = await getDictionary(lang)

  return (
    <>
      <SiteHeader lang={lang} nav={dict.nav} brand={dict.brand} />
      {children}
      <SiteFooter footer={dict.footer} />
    </>
  )
}
