import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { LegalDocumentPage } from "@/components/legal-document-page"
import { staticPageMetadata } from "@/lib/page-seo"
import { getDictionary, hasLocale } from "../dictionaries"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/terms">): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(locale)) return {}

  return staticPageMetadata(locale, "terms")
}

export default async function TermsOfUseRoute({
  params,
}: PageProps<"/[locale]/terms">) {
  const { locale } = await params

  if (!hasLocale(locale)) notFound()

  const dict = await getDictionary(locale)

  return <LegalDocumentPage copy={dict.termsOfUse} />
}
