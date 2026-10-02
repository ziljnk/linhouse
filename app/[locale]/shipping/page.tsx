import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ShippingPolicyPage } from "@/components/shipping-policy-page"
import { staticPageMetadata } from "@/lib/page-seo"
import { getDictionary, hasLocale } from "../dictionaries"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/shipping">): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(locale)) return {}

  return staticPageMetadata(locale, "shipping")
}

export default async function ShippingPolicyRoute({
  params,
}: PageProps<"/[locale]/shipping">) {
  const { locale } = await params

  if (!hasLocale(locale)) notFound()

  const dict = await getDictionary(locale)

  return <ShippingPolicyPage copy={dict.shippingPolicy} />
}
