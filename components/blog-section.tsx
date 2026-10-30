import Link from "next/link"
import type { Locale } from "@/app/[locale]/dictionaries"
import { BlogPostCard, type BlogCardPost } from "@/components/blog-post-card"
import {
  ScrollReveal,
  ScrollRevealGroup,
  ScrollRevealItem,
} from "@/components/motion-primitives/scroll-reveal"

const HOME_BLOG_LIMIT = 4

const viewAllClass =
  "inline-flex items-center justify-center border border-charcoal/80 px-8 py-3 text-[11px] tracking-[0.22em] text-charcoal uppercase transition-colors hover:bg-charcoal hover:text-ivory"

/**
 * Every homepage card uses the four-up column width, capped at 20rem.
 * Horizontal gap is 0.75rem, so the width math stays in sync with `gap-x-3`.
 * 1 — one card, centered.
 * 2 — two cards from 640px, centered.
 * 3 — two from 640px (third centered), three from 1024px.
 * 4 — two-by-two from 640px, four from 1280px.
 * Fewer than four never stretch; they keep this width and sit in a centered group.
 */
function homeBlogItemClass(count: number) {
  const capped = "w-full min-w-0 max-w-[20rem]"
  const pair = "sm:max-xl:w-[min(20rem,calc((100%-0.75rem)/2))]"
  const triple = "lg:max-xl:w-[min(20rem,calc((100%-1.5rem)/3))]"
  const quad = "xl:w-[min(20rem,calc((100%-2.25rem)/4))]"

  if (count <= 1) return `${capped} ${quad}`
  if (count === 3) {
    return `${capped} sm:max-lg:w-[min(20rem,calc((100%-0.75rem)/2))] ${triple} ${quad}`
  }
  return `${capped} ${pair} ${quad}`
}

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

        <ScrollRevealGroup
          className="flex flex-wrap justify-center gap-x-3 gap-y-10 sm:gap-y-12"
          stagger={0.16}
        >
          {preview.map((post) => (
            <ScrollRevealItem
              key={post.slug}
              className={homeBlogItemClass(preview.length)}
            >
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
