import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { AboutPage } from "@/components/about-page"
import { withStorefrontSeo } from "@/lib/storefront-metadata"
import { getDictionary, hasLocale } from "../dictionaries"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(locale)) return {}

  const dict = await getDictionary(locale)

  return withStorefrontSeo(locale, "/about", {
    title: `${dict.aboutPage.metaTitle} | LINHouse`,
    description: dict.aboutPage.metaDescription,
  })
}

export default async function AboutRoute({
  params,
}: PageProps<"/[locale]/about">) {
  const { locale } = await params

  if (!hasLocale(locale)) notFound()

  const dict = await getDictionary(locale)

  return <AboutPage copy={dict.aboutPage} />
}
