import { notFound } from "next/navigation"
import { AdminBackButton } from "@/components/admin/back-button"
import { CollectionForm } from "@/components/admin/collection-form"
import { requireUsableAdminSession } from "@/lib/admin-session"
import { getAdminCollection } from "@/lib/admin-storefront"

export const metadata = {
  title: "Sửa bộ sưu tập",
}

export default async function EditCollectionPage({
  params,
}: PageProps<"/admin/collections/[slug]/edit">) {
  const { slug } = await params
  await requireUsableAdminSession()
  const collection = await getAdminCollection(slug)

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
          {collection.name.vi}
        </p>
      </div>
      <CollectionForm
        defaultValues={{
          id: collection.id,
          nameVi: collection.name.vi,
          nameEn: collection.name.en,
          subtitleVi: collection.subtitle.vi,
          subtitleEn: collection.subtitle.en,
          imageAltVi: collection.imageAlt.vi,
          imageAltEn: collection.imageAlt.en,
          slug: collection.slug,
          year: collection.year,
          status: collection.status,
          publishedAt: collection.publishedAt,
          coverUrl: collection.coverUrl,
          galleryUrls: collection.galleryUrls,
          seoTitle: collection.seoTitle,
          seoDescription: collection.seoDescription,
          seoKeywords: collection.seoKeywords,
        }}
      />
    </div>
  )
}
