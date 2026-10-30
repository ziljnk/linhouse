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
 * Under 1280px only the first two cards are shown (`hidden xl:block` on the rest):
 * one per row below 640px, two in a single centered row from 640px.
 * From 1280px, up to four cards share one row and stay centered when fewer.
 */
function homeBlogItemClass(count: number, index: number) {
  const capped = "w-full min-w-0 max-w-[20rem]"
  const pair = "sm:max-xl:w-[min(20rem,calc((100%-0.75rem)/2))]"
  const quad = "xl:w-[min(20rem,calc((100%-2.25rem)/4))]"
  const conceal = index >= 2 ? "hidden xl:block" : ""

  if (count <= 1) return `${capped} ${quad}`
  return `${capped} ${pair} ${quad} ${conceal}`.trim()
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
          {preview.map((post, index) => (
            <ScrollRevealItem
              key={post.slug}
              className={homeBlogItemClass(preview.length, index)}
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
