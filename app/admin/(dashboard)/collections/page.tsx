import Link from "next/link"
import { Plus } from "lucide-react"
import { CollectionsTable } from "@/components/admin/collections-table"
import { Button } from "@/components/ui/button"
import { getDictionary } from "@/app/[locale]/dictionaries"
import { toAdminCollectionListItems } from "@/lib/admin-collections"

export const metadata = {
  title: "Bộ sưu tập",
}

export default async function AdminCollectionsPage() {
  const dict = await getDictionary("vi")
  const collections = toAdminCollectionListItems(
    dict.home.collection.items,
    dict.catalog
  )

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bộ sưu tập</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Danh sách bộ sưu tập đang có trên website.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/admin/collections/new" />}
        >
          <Plus />
          Tạo bộ sưu tập
        </Button>
      </div>
      <CollectionsTable collections={collections} />
    </div>
  )
}
