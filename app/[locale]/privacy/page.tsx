import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { LegalDocumentPage } from "@/components/legal-document-page"
import { getDictionary, hasLocale } from "../dictionaries"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(locale)) return {}

  const dict = await getDictionary(locale)

  return {
    title: `${dict.privacyPolicy.metaTitle} | LINHouse`,
    description: dict.privacyPolicy.metaDescription,
  }
}

export default async function PrivacyPolicyRoute({
  params,
}: PageProps<"/[locale]/privacy">) {
  const { locale } = await params

  if (!hasLocale(locale)) notFound()

  const dict = await getDictionary(locale)

  return <LegalDocumentPage copy={dict.privacyPolicy} />
}
