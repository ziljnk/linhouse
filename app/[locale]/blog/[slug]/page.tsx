import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { findBlogPost, getDictionary, hasLocale } from "../../dictionaries"

export default async function BlogPostPage({
  params,
}: PageProps<"/[locale]/blog/[slug]">) {
  const { locale, slug } = await params

  if (!hasLocale(locale)) notFound()

  const dict = await getDictionary(locale)
  const post = findBlogPost(dict, slug)

  if (!post) notFound()

  return (
    <main className="bg-ivory px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
      <article className="mx-auto max-w-3xl">
        <p className="text-[13px] font-light text-charcoal/50">{post.date}</p>
        <h1 className="mt-4 font-heading text-3xl leading-[1.2] font-medium text-charcoal sm:text-4xl lg:text-[2.65rem]">
          {post.title}
        </h1>
        <div className="relative mt-10 aspect-3/4 overflow-hidden sm:aspect-4/5">
          <Image
            src={post.image}
            alt={post.imageAlt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover object-center"
          />
        </div>
        <p className="mt-10 text-sm leading-relaxed font-light text-charcoal/75 sm:text-[15px]">
          {post.excerpt}
        </p>
        <Link
          href={`/${locale}#blog`}
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
