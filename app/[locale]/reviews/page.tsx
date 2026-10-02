import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ReviewsPage } from "@/components/reviews-page"
import { getStorefront } from "@/lib/storefront"
import { staticPageMetadata } from "@/lib/page-seo"
import { getDictionary, hasLocale } from "../dictionaries"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/reviews">): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(locale)) return {}

  return staticPageMetadata(locale, "reviews")
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
