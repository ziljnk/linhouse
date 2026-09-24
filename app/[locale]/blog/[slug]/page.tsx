import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { sanitizeRichTextHtml } from "@/lib/sanitize-content"
import {
  getStorefront,
  getStorefrontBlogSlugs,
} from "@/lib/storefront"
import { getDictionary, hasLocale } from "../../dictionaries"

export async function generateStaticParams() {
  try {
    const slugs = await getStorefrontBlogSlugs()
    return (["en", "vi"] as const).flatMap((locale) =>
      slugs.map((slug) => ({ locale, slug }))
    )
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/blog/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params
  if (!hasLocale(locale)) return {}

  const dict = await getDictionary(locale)
  const storefront = await getStorefront(locale, dict)
  const post = storefront.blogPosts.find((item) => item.slug === slug)
  if (!post) return {}

  return {
    title: `${post.seoTitle || post.title} | LINHouse`,
    description: post.seoDescription || post.excerpt,
  }
}

export default async function BlogPostPage({
  params,
}: PageProps<"/[locale]/blog/[slug]">) {
  const { locale, slug } = await params

  if (!hasLocale(locale)) notFound()

  const dict = await getDictionary(locale)
  const storefront = await getStorefront(locale, dict)
  const post = storefront.blogPosts.find((item) => item.slug === slug)

  if (!post) notFound()

  const rawBody = post.content.trim() || post.excerpt
  const body = sanitizeRichTextHtml(rawBody)
  const isHtml = /<\/?[a-z][\s\S]*>/i.test(body)

  return (
    <main className="bg-ivory px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
      <article className="mx-auto max-w-3xl">
        {post.date ? (
          <p className="text-[13px] font-light text-charcoal/50">{post.date}</p>
        ) : null}
        <h1 className="mt-4 font-heading text-3xl leading-[1.2] font-medium text-charcoal sm:text-4xl lg:text-[2.65rem]">
          {post.title}
        </h1>
        <div className="relative mt-10 aspect-3/4 overflow-hidden sm:aspect-4/5">
          <OptimizedImage
            src={post.image}
            alt={post.imageAlt}
            fill
            loading="eager"
            fetchPriority="high"
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover object-center"
          />
        </div>
        {isHtml ? (
          <div
            className="mt-10 text-base leading-relaxed font-light text-charcoal/75 sm:text-lg [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-medium [&_h2]:text-charcoal [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:font-heading [&_h3]:text-xl [&_h3]:font-medium [&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:ps-5 [&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-charcoal/20 [&_blockquote]:ps-4 [&_a]:text-burgundy [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        ) : (
          <p className="mt-10 text-base leading-relaxed font-light text-charcoal/75 sm:text-lg">
            {body}
          </p>
        )}
        <Link
          href={`/${locale}/blog`}
          className="mt-10 inline-flex text-[13px] text-charcoal transition-colors hover:text-burgundy"
        >
          <span className="border-b border-charcoal pb-0.5 hover:border-burgundy">
            {dict.home.blog.back}
          </span>
        </Link>
      </article>
    </main>
  )
}
