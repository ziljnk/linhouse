import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { AboutSection } from "@/components/about-section"
import { BlogSection } from "@/components/blog-section"
import { CollectionSection } from "@/components/collection-section"
import { FeaturedProducts } from "@/components/featured-products"
import { HeroSection } from "@/components/hero-section"
import { TestimonialSection } from "@/components/testimonial-section"
import { JsonLd } from "@/components/json-ld"
import { getStorefront, getStorefrontContact } from "@/lib/storefront"
import { withStorefrontSeo } from "@/lib/storefront-metadata"
import { homeStructuredData } from "@/lib/structured-data"
import { getDictionary, hasLocale } from "./dictionaries"

const homeSeo = {
  vi: {
    title: "LINHouse | Váy Cưới Thiết Kế",
    description:
      "LINHouse – Bridal studio chuyên váy cưới thiết kế, mang đến những thiết kế tinh tế và thanh lịch dành cho mọi cô dâu, với lựa chọn đặc biệt cho cô dâu Big Size.",
  },
  en: {
    title: "LINHouse | Designer Wedding Dresses",
    description:
      "LINHouse – A bridal studio specializing in thoughtfully designed wedding dresses, offering elegant and refined styles for every bride, with a special selection for plus-size brides.",
  },
} as const

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(locale)) return {}

  return withStorefrontSeo(locale, "/", {
    ...homeSeo[locale],
    image: "/og-image.webp",
    imageAlt: "LINHouse",
  })
}

export default async function Page({ params }: PageProps<"/[locale]">) {
  const { locale } = await params

  if (!hasLocale(locale)) notFound()

  const dict = await getDictionary(locale)
  const [storefront, contact] = await Promise.all([
    getStorefront(locale, dict),
    getStorefrontContact(locale, dict),
  ])
  const sameAs = [contact.social.facebookUrl, contact.social.instagramUrl].filter(
    (url) => url.startsWith("http")
  )

  return (
    <main className="overflow-x-clip bg-ivory">
      <JsonLd
        data={homeStructuredData({
          name: contact.brand.name || "LINHouse",
          description: homeSeo[locale].description,
          email: contact.footer.company.email,
          phone: contact.footer.company.phone,
          address: contact.storeAddress,
          sameAs,
        })}
      />
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
        <TestimonialSection locale={locale} copy={storefront.testimonials} />
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
