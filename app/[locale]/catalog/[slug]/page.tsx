import { notFound } from "next/navigation"
import { ProductGrid } from "@/components/product-grid"
import { findCategoryLabel, getDictionary, hasLocale } from "../../dictionaries"

export default async function CatalogPage({
  params,
}: PageProps<"/[locale]/catalog/[slug]">) {
  const { locale, slug } = await params

  if (!hasLocale(locale)) notFound()

  const dict = await getDictionary(locale)
  const title = findCategoryLabel(dict, slug)

  return (
    <main className="bg-ivory px-10 py-10">
      <h1 className="mx-auto mb-8 max-w-6xl text-center font-[family-name:var(--font-heading)] text-3xl font-medium tracking-[0.12em] text-burgundy-deep uppercase">
        {title}
      </h1>
      <ProductGrid products={dict.catalog} contactLabel={dict.products.contact} />
    </main>
  )
}
