import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Not found | LINHouse",
  robots: {
    index: false,
    follow: false,
  },
}

export default function NotFound() {
  return (
    <main className="bg-ivory px-6 py-24 text-center sm:py-32">
      <p className="text-[11px] tracking-[0.18em] text-gold uppercase">404</p>
      <h1 className="mt-3 font-heading text-3xl font-medium tracking-[0.08em] text-burgundy-deep uppercase">
        Page not found
      </h1>
      <p className="mt-4 text-base font-light text-charcoal/75">
        Không tìm thấy trang này.
      </p>
      <p className="mt-8 flex items-center justify-center gap-6 text-[11px] tracking-[0.18em] uppercase">
        <Link href="/vi" className="text-burgundy">
          Trang chủ
        </Link>
        <Link href="/en" className="text-burgundy">
          Home
        </Link>
      </p>
    </main>
  )
}
