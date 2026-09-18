import { AdminBackButton } from "@/components/admin/back-button"
import { ProductForm } from "@/components/admin/product-form"
import { requireUsableAdminSession } from "@/lib/admin-session"
import {
  listAdminAttributeGroups,
  listAdminCollectionOptions,
} from "@/lib/admin-storefront"

export const metadata = {
  title: "Tạo sản phẩm",
}

export default async function NewProductPage() {
  await requireUsableAdminSession()
  const [groups, collections] = await Promise.all([
    listAdminAttributeGroups(),
    listAdminCollectionOptions(),
  ])

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <div>
        <div className="flex items-center gap-2">
          <AdminBackButton href="/admin/products" />
          <h1 className="text-2xl font-semibold tracking-tight">Tạo sản phẩm mới</h1>
        </div>
        <p className="mt-1 ps-11 text-sm text-muted-foreground">
          Thêm thông tin, ảnh và SEO cho sản phẩm.
        </p>
      </div>
      <ProductForm groups={groups} collections={collections} />
    </div>
  )
}
