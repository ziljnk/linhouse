import { CatalogManager } from "@/components/admin/catalog-manager"
import { requireUsableAdminSession } from "@/lib/admin-session"
import {
  listAdminAttributeGroups,
  listAdminProductKinds,
} from "@/lib/admin-storefront"

export const metadata = {
  title: "Danh mục",
}

export default async function AdminCatalogPage() {
  await requireUsableAdminSession()
  const [groups, kinds] = await Promise.all([
    listAdminAttributeGroups(),
    listAdminProductKinds(),
  ])

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Danh mục</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Nhóm bộ lọc catalog theo từng loại sản phẩm. Thêm loại mới cạnh các tab
          bên dưới.
        </p>
      </div>
      <CatalogManager groups={groups} kinds={kinds} />
    </div>
  )
}
