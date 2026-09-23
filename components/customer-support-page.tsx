import type { Dictionary, Locale } from "@/app/[locale]/dictionaries"
import { CustomerSupportForm } from "@/components/customer-support-form"

export function CustomerSupportPage({
  locale,
  copy,
}: {
  locale: Locale
  copy: Dictionary["customerSupport"]
}) {
  return (
    <main className="flex flex-1 flex-col overflow-x-clip bg-ivory text-charcoal">
      <section className="px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24">
        <div className="mx-auto max-w-xl">
          <h1 className="text-center font-heading text-3xl font-medium tracking-[0.16em] text-burgundy-deep uppercase sm:text-4xl">
            {copy.title}
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-center text-sm leading-relaxed font-light text-charcoal/70 sm:text-[15px]">
            {copy.intro}
          </p>
          <div className="mt-12">
            <CustomerSupportForm locale={locale} copy={copy} />
          </div>
        </div>
      </section>
    </main>
  )
}
