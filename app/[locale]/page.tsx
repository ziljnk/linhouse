import { notFound } from "next/navigation"
import { AboutSection } from "@/components/about-section"
import { BlogSection } from "@/components/blog-section"
import { CollectionSection } from "@/components/collection-section"
import { FeaturedProducts } from "@/components/featured-products"
import { HeroSection } from "@/components/hero-section"
import { TestimonialSection } from "@/components/testimonial-section"
import { getStorefront } from "@/lib/storefront"
import { getDictionary, hasLocale } from "./dictionaries"

export default async function Page({ params }: PageProps<"/[locale]">) {
  const { locale } = await params

  if (!hasLocale(locale)) notFound()

  const dict = await getDictionary(locale)
  const storefront = await getStorefront(locale, dict)

  return (
    <main className="overflow-x-clip bg-ivory">
      <HeroSection locale={locale} copy={storefront.hero} />
      {storefront.collections.length > 0 ? (
        <CollectionSection
          locale={locale}
          copy={{
            title: storefront.collectionTitle,
            items: storefront.collections,
          }}
        />
      ) : null}
      {storefront.featuredProducts.length > 0 ? (
        <FeaturedProducts
          products={storefront.featuredProducts}
          locale={locale}
          title={storefront.featuredTitle}
          loadMore={dict.home.featured.loadMore}
          showLess={dict.home.featured.showLess}
          contactLabel={dict.products.contact}
        />
      ) : null}
      <AboutSection copy={storefront.about} />
      {storefront.testimonials.items.length > 0 ? (
        <TestimonialSection copy={storefront.testimonials} />
      ) : null}
      {storefront.blogPosts.length > 0 ? (
        <BlogSection
          locale={locale}
          title={storefront.blogTitle}
          readMore={dict.home.blog.readMore}
          viewAll={dict.home.blog.viewAll}
          posts={storefront.blogPosts}
        />
      ) : null}
    </main>
  )
}
