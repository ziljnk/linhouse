import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CustomerSupportPage } from "@/components/customer-support-page"
import { staticPageMetadata } from "@/lib/page-seo"
import { getDictionary, hasLocale } from "../dictionaries"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/support">): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(locale)) return {}

  return staticPageMetadata(locale, "support")
}

export default async function CustomerSupportRoute({
  params,
}: PageProps<"/[locale]/support">) {
  const { locale } = await params

  if (!hasLocale(locale)) notFound()

  const dict = await getDictionary(locale)

  return <CustomerSupportPage locale={locale} copy={dict.customerSupport} />
}
