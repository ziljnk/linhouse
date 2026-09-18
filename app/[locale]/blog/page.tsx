import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { BlogGrid } from "@/components/blog-grid"
import { ScrollReveal } from "@/components/motion-primitives/scroll-reveal"
import { getStorefront } from "@/lib/storefront"
import { getDictionary, hasLocale } from "../dictionaries"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/blog">): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(locale)) return {}

  const dict = await getDictionary(locale)

  return {
    title: `${dict.home.blog.title} | LINHouse`,
    description: dict.home.blog.description,
  }
}

export default async function BlogIndexPage({
  params,
}: PageProps<"/[locale]/blog">) {
  const { locale } = await params

  if (!hasLocale(locale)) notFound()

  const dict = await getDictionary(locale)
  const storefront = await getStorefront(locale, dict)
  const copy = dict.home.blog

  return (
    <main className="overflow-x-clip bg-ivory">
      <section className="px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <h1 className="text-center font-heading text-3xl font-medium tracking-[0.16em] text-burgundy-deep uppercase sm:text-4xl">
              {storefront.blogTitle}
            </h1>
            {copy.description ? (
              <p className="mx-auto mt-4 max-w-2xl text-center text-sm font-light text-charcoal/60 sm:text-[15px]">
                {copy.description}
              </p>
            ) : null}
          </ScrollReveal>

          {storefront.blogPosts.length > 0 ? (
            <div className="mt-12 sm:mt-16">
              <BlogGrid
                locale={locale}
                posts={storefront.blogPosts}
                readMore={copy.readMore}
              />
            </div>
          ) : (
            <p className="mt-16 text-center text-sm font-light text-charcoal/60">
              {copy.empty}
            </p>
          )}
        </div>
      </section>
    </main>
  )
}
