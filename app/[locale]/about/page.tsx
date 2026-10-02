import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { AboutPage } from "@/components/about-page"
import { staticPageMetadata } from "@/lib/page-seo"
import { getDictionary, hasLocale } from "../dictionaries"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(locale)) return {}

  return staticPageMetadata(locale, "about")
}

export default async function AboutRoute({
  params,
}: PageProps<"/[locale]/about">) {
  const { locale } = await params

  if (!hasLocale(locale)) notFound()

  const dict = await getDictionary(locale)

  return <AboutPage copy={dict.aboutPage} />
}
