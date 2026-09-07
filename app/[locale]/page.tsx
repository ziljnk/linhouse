import { notFound } from "next/navigation"
import { AboutSection } from "@/components/about-section"
import { BlogSection } from "@/components/blog-section"
import { CollectionSection } from "@/components/collection-section"
import { FeaturedProducts } from "@/components/featured-products"
import { HeroSection } from "@/components/hero-section"
import { TestimonialSection } from "@/components/testimonial-section"
import { getDictionary, hasLocale } from "./dictionaries"

export default async function Page({ params }: PageProps<"/[locale]">) {
  const { locale } = await params

  if (!hasLocale(locale)) notFound()

  const dict = await getDictionary(locale)

  return (
    <main className="overflow-x-clip bg-ivory">
      <HeroSection locale={locale} copy={dict.home} />
      <CollectionSection locale={locale} copy={dict.home.collection} />
      <FeaturedProducts
        products={dict.catalog}
        title={dict.home.featured.title}
        loadMore={dict.home.featured.loadMore}
        showLess={dict.home.featured.showLess}
        contactLabel={dict.products.contact}
      />
      <AboutSection copy={dict.home.about} />
      <TestimonialSection copy={dict.home.testimonials} />
      <BlogSection locale={locale} copy={dict.home.blog} />
    </main>
  )
}
