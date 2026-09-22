import { notFound } from "next/navigation"
import { AdminBackButton } from "@/components/admin/back-button"
import { ProductForm } from "@/components/admin/product-form"
import { requireUsableAdminSession } from "@/lib/admin-session"
import {
  getAdminProduct,
  listAdminAttributeGroups,
  listAdminCollectionOptions,
} from "@/lib/admin-storefront"

export const metadata = {
  title: "Sửa sản phẩm",
}

export default async function EditProductPage({
  params,
}: PageProps<"/admin/products/[slug]/edit">) {
  const { slug } = await params
  await requireUsableAdminSession()
  const [product, groups, collections] = await Promise.all([
    getAdminProduct(slug),
    listAdminAttributeGroups(),
    listAdminCollectionOptions(),
  ])

  if (!product) notFound()

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
        groups={groups}
        collections={collections}
        defaultValues={{
          id: product.id,
          name: product.name,
          code: product.code,
          slug: product.slug,
          descriptionVi: product.description.vi,
          descriptionEn: product.description.en,
          attributeIds: product.attributeIds,
          collectionIds: product.collectionIds,
          tags: product.tags,
          purchaseOptions: product.purchaseOptions,
          priceVnd: product.priceVnd,
          priceDisplay: product.priceDisplay,
          kind: product.kind,
          imageUrls: product.imageUrls,
          status: product.status,
          publishedAt: product.publishedAt,
          seoTitle: product.seoTitle,
          seoDescription: product.seoDescription,
          seoKeywords: product.seoKeywords,
        }}
      />
    </div>
  )
}
