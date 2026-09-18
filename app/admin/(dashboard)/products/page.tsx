import Link from "next/link"
import { Plus } from "lucide-react"
import { ProductsTable } from "@/components/admin/products-table"
import { Button } from "@/components/ui/button"
import {
  parseAdminFilter,
  parseAdminPage,
  parseAdminQuery,
} from "@/lib/admin-pagination"
import { requireUsableAdminSession } from "@/lib/admin-session"
import {
  listAdminCollectionOptions,
  listAdminProductCategoryOptions,
  listAdminProducts,
} from "@/lib/admin-storefront"

export const metadata = {
  title: "Sản phẩm",
}

export default async function AdminProductsPage({
  searchParams,
}: PageProps<"/admin/products">) {
  await requireUsableAdminSession()
  const params = await searchParams
  const q = parseAdminQuery(params.q)
  const kind = parseAdminFilter(params.kind)
  const status = parseAdminFilter(params.status)
  const collection = parseAdminFilter(params.collection)
  const category = parseAdminFilter(params.category)

  const [result, collections, categories] = await Promise.all([
    listAdminProducts({
      q,
      page: parseAdminPage(params.page),
      kind,
      status,
      collection,
      category,
    }),
    listAdminCollectionOptions(),
    listAdminProductCategoryOptions(kind),
  ])

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
      <ProductsTable
        products={result.items}
        page={result.page}
        pageCount={result.pageCount}
        total={result.total}
        pageSize={result.pageSize}
        query={q}
        kind={kind || "all"}
        status={status || "all"}
        collection={collection || "all"}
        category={category || "all"}
        collectionOptions={collections.map((item) => ({
          value: item.slug,
          label: item.name,
        }))}
        categoryOptions={categories}
      />
    </div>
  )
}
