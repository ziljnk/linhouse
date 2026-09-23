import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { LegalDocumentPage } from "@/components/legal-document-page"
import { getDictionary, hasLocale } from "../dictionaries"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/terms">): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(locale)) return {}

  const dict = await getDictionary(locale)

  return {
    title: `${dict.termsOfUse.metaTitle} | LINHouse`,
    description: dict.termsOfUse.metaDescription,
  }
}

export default async function TermsOfUseRoute({
  params,
}: PageProps<"/[locale]/terms">) {
  const { locale } = await params

  if (!hasLocale(locale)) notFound()

  const dict = await getDictionary(locale)

  return <LegalDocumentPage copy={dict.termsOfUse} />
}
