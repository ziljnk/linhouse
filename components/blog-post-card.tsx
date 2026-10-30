import Link from "next/link"
import type { Locale } from "@/app/[locale]/dictionaries"
import { OptimizedImage } from "@/components/ui/optimized-image"

export type BlogCardPost = {
  slug: string
  title: string
  date: string
  image: string
  imageAlt: string
  excerpt?: string
}

/**
 * Homepage cover slot. The card is capped at 20rem, and from 1280px it is one
 * column of the four-up row (about 279–311px). The portrait is inset 16%, so
 * the image itself peaks near 270px.
 */
const HOME_COVER_SIZES =
  "(min-width: 1280px) 270px, (min-width: 640px) 270px, 270px"

export function BlogPostCard({
  locale,
  post,
  readMore,
  variant = "overlay",
}: {
  locale: Locale
  post: BlogCardPost
  readMore: string
  variant?: "overlay" | "stack"
}) {
  return (
    <Link
      href={`/${locale}/blog/${post.slug}`}
      className="group block h-full outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-4 focus-visible:ring-offset-ivory"
    >
      {variant === "stack" ? (
        <article className="flex h-full flex-col">
          <div className="relative aspect-3/4 overflow-hidden bg-blush">
            <OptimizedImage
              src={post.image}
              alt={post.imageAlt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />
          </div>
          <div className="flex flex-1 flex-col pt-5">
            <h3 className="font-heading text-xl leading-tight font-medium text-charcoal sm:text-[1.35rem]">
              {post.title}
            </h3>
            {post.date ? (
              <p className="mt-2 text-[13px] font-light text-charcoal/50">
                {post.date}
              </p>
            ) : null}
            {post.excerpt ? (
              <p className="mt-3 line-clamp-2 text-sm font-light text-charcoal/70">
                {post.excerpt}
              </p>
            ) : null}
            <span className="mt-auto w-fit pt-5 text-[13px] text-charcoal transition-colors group-hover:text-burgundy">
              <span className="border-b border-charcoal pb-0.5 group-hover:border-burgundy">
                {readMore}
              </span>
            </span>
          </div>
        </article>
      ) : (
        <article className="relative">
          <div className="relative mr-[16%] aspect-3/4 overflow-hidden bg-blush">
            <OptimizedImage
              src={post.image}
              alt={post.imageAlt}
              fill
              sizes={HOME_COVER_SIZES}
              className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />
          </div>
          <div className="absolute top-1/2 right-0 z-10 flex min-h-[78%] w-[66%] -translate-y-1/2 flex-col bg-white px-3 py-3.5 sm:px-3.5 sm:py-4">
            <h3 className="font-heading text-base leading-snug font-medium text-charcoal">
              {post.title}
            </h3>
            {post.date ? (
              <p className="mt-1.5 text-xs font-light text-charcoal/70">{post.date}</p>
            ) : null}
            {post.excerpt ? (
              <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug font-light text-charcoal/75">
                {post.excerpt}
              </p>
            ) : null}
            <span className="mt-auto w-fit pt-3 text-[13px] text-charcoal transition-colors group-hover:text-burgundy">
              <span className="border-b border-charcoal pb-0.5 group-hover:border-burgundy">
                {readMore}
              </span>
            </span>
          </div>
        </article>
      )}
    </Link>
  )
}
