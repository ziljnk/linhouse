import { CatalogManager } from "@/components/admin/catalog-manager"
import { requireUsableAdminSession } from "@/lib/admin-session"
import { listAdminAttributeGroups } from "@/lib/admin-storefront"

export const metadata = {
  title: "Danh mục",
}

export default async function AdminCatalogPage() {
  await requireUsableAdminSession()
  const groups = await listAdminAttributeGroups()

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Danh mục</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Nhóm bộ lọc catalog, tách theo váy cưới và áo dài.
        </p>
      </div>
      <CatalogManager groups={groups} />
    </div>
  )
}
