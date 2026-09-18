import { notFound } from "next/navigation"
import { AdminBackButton } from "@/components/admin/back-button"
import { TestimonialForm } from "@/components/admin/testimonial-form"
import { requireUsableAdminSession } from "@/lib/admin-session"
import { getAdminTestimonial } from "@/lib/admin-storefront"

export const metadata = {
  title: "Sửa câu chuyện",
}

export default async function EditTestimonialPage({
  params,
}: PageProps<"/admin/testimonials/[slug]/edit">) {
  const { slug } = await params
  await requireUsableAdminSession()
  const testimonial = await getAdminTestimonial(slug)

  if (!testimonial) notFound()

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <div>
        <div className="flex items-center gap-2">
          <AdminBackButton href="/admin/testimonials" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Sửa câu chuyện
          </h1>
        </div>
        <p className="mt-1 ps-11 text-sm text-muted-foreground">
          {testimonial.name}
        </p>
      </div>
      <TestimonialForm
        defaultValues={{
          id: testimonial.id,
          name: testimonial.name,
          slug: testimonial.slug,
          quoteVi: testimonial.quoteVi,
          quoteEn: testimonial.quoteEn,
          imageUrl: testimonial.image,
          imageAltVi: testimonial.imageAltVi,
          imageAltEn: testimonial.imageAltEn,
          gown: testimonial.gown,
          year: testimonial.year,
          status: testimonial.status,
        }}
      />
    </div>
  )
}
