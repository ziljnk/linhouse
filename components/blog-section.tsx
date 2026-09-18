import Link from "next/link"
import type { Locale } from "@/app/[locale]/dictionaries"
import { BlogPostCard, type BlogCardPost } from "@/components/blog-post-card"
import {
  ScrollReveal,
  ScrollRevealGroup,
  ScrollRevealItem,
} from "@/components/motion-primitives/scroll-reveal"

const HOME_BLOG_LIMIT = 2

const viewAllClass =
  "inline-flex items-center justify-center border border-charcoal/80 px-8 py-3 text-[11px] tracking-[0.22em] text-charcoal uppercase transition-colors hover:bg-charcoal hover:text-ivory"

export function BlogSection({
  locale,
  title,
  readMore,
  viewAll,
  posts,
}: {
  locale: Locale
  title: string
  readMore: string
  viewAll: string
  posts: BlogCardPost[]
}) {
  const preview = posts.slice(0, HOME_BLOG_LIMIT)

  return (
    <section id="blog" className="bg-ivory px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <h2 className="mb-10 text-center font-heading text-3xl font-medium tracking-[0.16em] text-burgundy-deep uppercase sm:mb-14 sm:text-4xl">
            {title}
          </h2>
        </ScrollReveal>

        <ScrollRevealGroup className="grid gap-12 md:grid-cols-2 md:gap-10 xl:gap-16" stagger={0.16}>
          {preview.map((post) => (
            <ScrollRevealItem key={post.slug}>
              <BlogPostCard locale={locale} post={post} readMore={readMore} />
            </ScrollRevealItem>
          ))}
        </ScrollRevealGroup>

        <ScrollReveal delay={0.08} className="mt-12 flex justify-center sm:mt-16">
          <Link href={`/${locale}/blog`} className={viewAllClass}>
            {viewAll}
          </Link>
        </ScrollReveal>
      </div>
    </section>
  )
}
