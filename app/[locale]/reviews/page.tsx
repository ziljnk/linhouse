import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ReviewsPage } from "@/components/reviews-page"
import { getStorefront } from "@/lib/storefront"
import { getDictionary, hasLocale } from "../dictionaries"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/reviews">): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(locale)) return {}

  const dict = await getDictionary(locale)

  return {
    title: `${dict.reviewsPage.metaTitle} | LINHouse`,
    description: dict.reviewsPage.metaDescription,
  }
}

export default async function ReviewsRoute({
  params,
}: PageProps<"/[locale]/reviews">) {
  const { locale } = await params

  if (!hasLocale(locale)) notFound()

  const dict = await getDictionary(locale)
  const storefront = await getStorefront(locale, dict)

  return (
    <ReviewsPage
      copy={dict.reviewsPage}
      items={storefront.testimonials.items}
    />
  )
}
