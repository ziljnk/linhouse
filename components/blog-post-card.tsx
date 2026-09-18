import Image from "next/image"
import Link from "next/link"
import type { Locale } from "@/app/[locale]/dictionaries"

export type BlogCardPost = {
  slug: string
  title: string
  date: string
  image: string
  imageAlt: string
  excerpt?: string
}

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
            <Image
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
          <div className="relative mr-[22%] aspect-3/4 overflow-hidden bg-blush sm:mr-[30%]">
            <Image
              src={post.image}
              alt={post.imageAlt}
              fill
              sizes="(max-width: 768px) 80vw, 40vw"
              className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />
          </div>
          <div className="absolute top-1/2 right-0 z-10 flex min-h-[78%] w-[62%] -translate-y-1/2 flex-col bg-white px-5 py-6 sm:w-[54%] sm:px-7 sm:py-8 lg:px-8 lg:py-9">
            <h3 className="font-heading text-[1.35rem] leading-tight font-medium text-charcoal sm:text-[1.55rem] lg:text-[1.7rem]">
              {post.title}
            </h3>
            {post.date ? (
              <p className="mt-3 text-[13px] font-light text-charcoal/50">
                {post.date}
              </p>
            ) : null}
            <span className="mt-auto w-fit pt-8 text-[13px] text-charcoal transition-colors group-hover:text-burgundy">
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
