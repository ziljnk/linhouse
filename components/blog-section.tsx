import Image from "next/image"
import Link from "next/link"
import type { Dictionary, Locale } from "@/app/[locale]/dictionaries"

export function BlogSection({
  locale,
  copy,
}: {
  locale: Locale
  copy: Dictionary["home"]["blog"]
}) {
  return (
    <section id="blog" className="bg-ivory px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-10 text-center font-heading text-3xl font-medium tracking-[0.16em] text-burgundy-deep uppercase sm:mb-14 sm:text-4xl">
          {copy.title}
        </h2>

        <div className="grid gap-12 md:grid-cols-2 md:gap-10 xl:gap-16">
          {copy.posts.map((post) => (
            <Link
              key={post.slug}
              href={`/${locale}/blog/${post.slug}`}
              className="group block outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-4 focus-visible:ring-offset-ivory"
            >
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
                  <p className="mt-3 text-[13px] font-light text-charcoal/50">{post.date}</p>
                  <span className="mt-auto w-fit pt-8 text-[13px] text-charcoal transition-colors group-hover:text-burgundy">
                    <span className="border-b border-charcoal pb-0.5 group-hover:border-burgundy">
                      {copy.readMore}
                    </span>
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
