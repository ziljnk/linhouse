import { notFound } from "next/navigation"
import { AdminBackButton } from "@/components/admin/back-button"
import { CollectionForm } from "@/components/admin/collection-form"
import { getDictionary } from "@/app/[locale]/dictionaries"
import {
  findAdminCollection,
  toAdminCollectionListItems,
} from "@/lib/admin-collections"

export const metadata = {
  title: "Sửa bộ sưu tập",
}

export default async function EditCollectionPage({
  params,
}: PageProps<"/admin/collections/[slug]/edit">) {
  const { slug } = await params
  const dict = await getDictionary("vi")
  const collection = findAdminCollection(
    toAdminCollectionListItems(dict.home.collection.items, dict.catalog),
    slug
  )

  if (!collection) notFound()

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <div>
        <div className="flex items-center gap-2">
          <AdminBackButton href="/admin/collections" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Sửa bộ sưu tập
          </h1>
        </div>
        <p className="mt-1 ps-11 text-sm text-muted-foreground">
          {collection.name}
        </p>
      </div>
      <CollectionForm
        defaultValues={{
          name: collection.name,
          subtitle: collection.subtitle,
          slug: collection.slug,
          coverUrl: collection.image,
        }}
      />
    </div>
  )
}
