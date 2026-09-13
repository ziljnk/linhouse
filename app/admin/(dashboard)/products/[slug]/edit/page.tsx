import { notFound } from "next/navigation"
import { AdminBackButton } from "@/components/admin/back-button"
import { ProductForm } from "@/components/admin/product-form"
import { findProduct, parseProductName, productSlug } from "@/lib/catalog"
import { getDictionary } from "@/app/[locale]/dictionaries"

export const metadata = {
  title: "Sửa sản phẩm",
}

export default async function EditProductPage({
  params,
}: PageProps<"/admin/products/[slug]/edit">) {
  const { slug } = await params
  const dict = await getDictionary("vi")
  const product = findProduct(dict.catalog, slug)

  if (!product) notFound()

  const { shortName, code } = parseProductName(product.name)

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <div>
        <div className="flex items-center gap-2">
          <AdminBackButton href="/admin/products" />
          <h1 className="text-2xl font-semibold tracking-tight">Sửa sản phẩm</h1>
        </div>
        <p className="mt-1 ps-11 text-sm text-muted-foreground">{product.name}</p>
      </div>
      <ProductForm
        defaultValues={{
          name: shortName,
          code,
          slug: productSlug(product),
          silhouette: product.silhouette,
          neckline: product.neckline,
          fabric: product.fabric,
          collections: product.collections,
        }}
      />
    </div>
  )
}
