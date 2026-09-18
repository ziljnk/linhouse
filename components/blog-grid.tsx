import {
  ScrollRevealGroup,
  ScrollRevealItem,
} from "@/components/motion-primitives/scroll-reveal"
import {
  BlogPostCard,
  type BlogCardPost,
} from "@/components/blog-post-card"
import type { Locale } from "@/app/[locale]/dictionaries"

export function BlogGrid({
  locale,
  posts,
  readMore,
}: {
  locale: Locale
  posts: BlogCardPost[]
  readMore: string
}) {
  return (
    <ScrollRevealGroup
      className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-14"
      stagger={0.1}
    >
      {posts.map((post) => (
        <ScrollRevealItem key={post.slug}>
          <BlogPostCard
            locale={locale}
            post={post}
            readMore={readMore}
            variant="stack"
          />
        </ScrollRevealItem>
      ))}
    </ScrollRevealGroup>
  )
}
