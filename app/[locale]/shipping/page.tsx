import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ShippingPolicyPage } from "@/components/shipping-policy-page"
import { getDictionary, hasLocale } from "../dictionaries"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/shipping">): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(locale)) return {}

  const dict = await getDictionary(locale)

  return {
    title: `${dict.shippingPolicy.metaTitle} | LINHouse`,
    description: dict.shippingPolicy.metaDescription,
  }
}

export default async function ShippingPolicyRoute({
  params,
}: PageProps<"/[locale]/shipping">) {
  const { locale } = await params

  if (!hasLocale(locale)) notFound()

  const dict = await getDictionary(locale)

  return <ShippingPolicyPage copy={dict.shippingPolicy} />
}
