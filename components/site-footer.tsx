import Link from "next/link"
import type { Dictionary, Locale } from "@/app/[locale]/dictionaries"
import { googleMapsUrls } from "@/lib/site-settings"

const SHIPPING_LABELS = new Set([
  "chính sách giao hàng",
  "shipping policy",
  "vận chuyển",
  "shipping",
])

const SUPPORT_LABELS = new Set(["hỗ trợ khách hàng", "customer support"])

const ORDER_LABELS = new Set(["hướng dẫn mua hàng", "how to order"])

const TERMS_LABELS = new Set([
  "điều khoản sử dụng",
  "terms of use",
  "terms of service",
])

const PRIVACY_LABELS = new Set([
  "chính sách bảo mật",
  "privacy policy",
  "privacy",
])

function matchesLabel(label: string, expected: string, aliases: Set<string>) {
  const value = label.trim().toLocaleLowerCase("vi")
  return value === expected.trim().toLocaleLowerCase("vi") || aliases.has(value)
}

export function SiteFooter({
  locale,
  footer,
  shippingLabel,
  supportLabel,
  termsLabel,
  privacyLabel,
  faqLink,
}: {
  locale: Locale
  footer: Dictionary["footer"]
  shippingLabel: string
  supportLabel: string
  termsLabel: string
  privacyLabel: string
  faqLink: { label: string; href: string }
}) {
  const { company } = footer
  const phoneHref = `tel:${company.phone.replaceAll(" ", "")}`
  const map = googleMapsUrls(footer.mapQuery || footer.address)
  const shippingHref = `/${locale}/shipping`
  const orderHref = `/${locale}#about`
  const supportHref = `/${locale}/support`
  const termsHref = `/${locale}/terms`
  const privacyHref = `/${locale}/privacy`
  const customerLinks = [...footer.customerServiceLinks]
  if (!customerLinks.some((link) => matchesLabel(link, shippingLabel, SHIPPING_LABELS))) {
    customerLinks.push(shippingLabel)
  }

  const legalHref = (label: string, index: number) => {
    if (matchesLabel(label, termsLabel, TERMS_LABELS)) return termsHref
    if (matchesLabel(label, privacyLabel, PRIVACY_LABELS)) return privacyHref
    if (index === 0) return termsHref
    if (index === 1) return privacyHref
    return "#footer"
  }

  const footerLink = (label: string, index: number, hrefOverride?: string) => {
    const href =
      hrefOverride ??
      (matchesLabel(label, shippingLabel, SHIPPING_LABELS)
        ? shippingHref
        : matchesLabel(label, "how to order", ORDER_LABELS)
          ? orderHref
          : matchesLabel(label, supportLabel, SUPPORT_LABELS)
            ? supportHref
            : "#footer")
    const className = "block py-1 text-sm font-light text-ivory/80 hover:text-ivory"
    if (href.startsWith("/")) {
      return (
        <Link key={`${label}-${index}`} href={href} className={className}>
          {label}
        </Link>
      )
    }
    return (
      <a key={`${label}-${index}`} href={href} className={className}>
        {label}
      </a>
    )
  }

  return (
    <footer id="footer" className="bg-burgundy-deep px-10 pt-12 pb-8 text-ivory">
      <div className="mx-auto mb-8 grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-[1.15fr_1fr_1fr_1.45fr]">
        <div>
          <h3 className="mb-4 text-xs tracking-[0.16em] text-gold uppercase">{company.title}</h3>
          <p className="mb-3 font-[family-name:var(--font-heading)] text-xl text-ivory">{company.name}</p>
          <p className="mb-3 text-sm leading-relaxed font-light text-ivory/80">{company.address}</p>
          <a href={phoneHref} className="block py-0.5 text-sm font-light text-ivory/80 hover:text-ivory">
            {company.phoneLabel}: {company.phone}
          </a>
          <a
            href={`mailto:${company.email}`}
            className="block py-0.5 text-sm font-light text-ivory/80 hover:text-ivory"
          >
            {company.emailLabel}: {company.email}
          </a>
        </div>
        <div>
          <h3 className="mb-4 text-xs tracking-[0.16em] text-gold uppercase">{footer.customerService}</h3>
          {customerLinks.map((link, index) => footerLink(link, index))}
          <Link
            href={faqLink.href}
            className="block py-1 text-sm font-light text-ivory/80 hover:text-ivory"
          >
            {faqLink.label}
          </Link>
        </div>
        <div>
          <h3 className="mb-4 text-xs tracking-[0.16em] text-gold uppercase">{footer.legal}</h3>
          {footer.legalLinks.map((link, index) => footerLink(link, index, legalHref(link, index)))}
        </div>
        <div className="min-w-0">
          <h3 className="mb-4 text-xs tracking-[0.16em] text-gold uppercase">{footer.map}</h3>
          <div className="overflow-hidden border border-ivory/15">
            <iframe
              title={footer.address}
              src={map.embedSrc}
              className="h-52 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <a
            href={map.href}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block text-xs leading-relaxed text-ivory/70 hover:text-ivory"
          >
            {footer.address}
          </a>
        </div>
      </div>
      <p className="mx-auto max-w-7xl border-t border-ivory/20 pt-4 text-xs text-ivory/70">
        {footer.copy}
      </p>
    </footer>
  )
}
