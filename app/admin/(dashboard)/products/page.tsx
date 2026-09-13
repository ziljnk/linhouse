import Link from "next/link"
import { Plus } from "lucide-react"
import { ProductsTable } from "@/components/admin/products-table"
import { Button } from "@/components/ui/button"
import { getDictionary } from "@/app/[locale]/dictionaries"
import { toAdminProductListItem } from "@/lib/admin-products"

export const metadata = {
  title: "Sản phẩm",
}

export default async function AdminProductsPage() {
  const dict = await getDictionary("vi")
  const collectionLabels = Object.fromEntries(
    dict.home.collection.items.map((item) => [
      item.href.replace("/catalog/", ""),
      item.name,
    ])
  )
  const products = dict.catalog.map((product) =>
    toAdminProductListItem(product, collectionLabels)
  )

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sản phẩm</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Danh sách sản phẩm đang có trên website.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/admin/products/new" />}>
          <Plus />
          Tạo sản phẩm mới
        </Button>
      </div>
      <ProductsTable products={products} />
    </div>
  )
}
