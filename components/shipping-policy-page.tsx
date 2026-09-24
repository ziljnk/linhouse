import type { Dictionary } from "@/app/[locale]/dictionaries"

export function ShippingPolicyPage({ copy }: { copy: Dictionary["shippingPolicy"] }) {
  return (
    <main className="overflow-x-clip bg-ivory text-charcoal">
      <section className="px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-center font-heading text-3xl font-medium tracking-[0.16em] text-burgundy-deep uppercase sm:text-4xl">
            {copy.title}
          </h1>
          {copy.intro ? (
            <p className="mx-auto mt-6 max-w-2xl text-center text-base leading-relaxed font-light text-charcoal/70 sm:text-lg">
              {copy.intro}
            </p>
          ) : null}
          <div className="mt-14 flex flex-col">
            {copy.sections.map((section, index) =>
              section.title || section.body ? (
                <article
                  key={`${section.title}-${index}`}
                  className="border-t border-charcoal/15 py-8 first:border-t-0 first:pt-0"
                >
                  {section.title ? (
                    <h2 className="font-heading text-2xl font-semibold tracking-tight text-charcoal sm:text-[1.7rem]">
                      {section.title}
                    </h2>
                  ) : null}
                  {section.body ? (
                    <p className="mt-3 text-base leading-relaxed font-light whitespace-pre-line text-charcoal/75 sm:text-lg">
                      {section.body}
                    </p>
                  ) : null}
                </article>
              ) : null
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
