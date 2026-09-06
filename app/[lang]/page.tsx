import Image from "next/image"
import { notFound } from "next/navigation"
import { getDictionary, hasLocale } from "./dictionaries"

export default async function Page({ params }: PageProps<"/[lang]">) {
  const { lang } = await params

  if (!hasLocale(lang)) notFound()

  const dict = await getDictionary(lang)

  return (
    <main className="bg-ivory">
      <section className="relative min-h-[80vh]">
        <Image
          src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=80"
          alt=""
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-x-0 bottom-16 text-center text-white">
          <p className="font-[family-name:var(--font-heading)] text-4xl tracking-[0.2em] uppercase">
            {dict.home.headline}
          </p>
          <p className="mt-3 text-sm tracking-[0.16em] uppercase">{dict.home.subhead}</p>
        </div>
      </section>
    </main>
  )
}
