import type { Dictionary } from "@/app/[locale]/dictionaries"
import { googleMapsUrls } from "@/lib/site-settings"

export function SiteFooter({ footer }: { footer: Dictionary["footer"] }) {
  const { company } = footer
  const phoneHref = `tel:${company.phone.replaceAll(" ", "")}`
  const map = googleMapsUrls(footer.mapQuery || footer.address)

  return (
    <footer id="footer" className="bg-burgundy-deep px-10 pt-12 pb-8 text-ivory">
      <div className="mx-auto mb-8 grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-[1.15fr_1fr_1fr_1fr_1.45fr]">
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
          {footer.customerServiceLinks.map((link) => (
            <a key={link} href="#footer" className="block py-1 text-sm font-light text-ivory/80 hover:text-ivory">
              {link}
            </a>
          ))}
        </div>
        <div>
          <h3 className="mb-4 text-xs tracking-[0.16em] text-gold uppercase">{footer.support}</h3>
          {footer.supportLinks.map((link) => (
            <a key={link} href="#footer" className="block py-1 text-sm font-light text-ivory/80 hover:text-ivory">
              {link}
            </a>
          ))}
        </div>
        <div>
          <h3 className="mb-4 text-xs tracking-[0.16em] text-gold uppercase">{footer.legal}</h3>
          {footer.legalLinks.map((link) => (
            <a key={link} href="#footer" className="block py-1 text-sm font-light text-ivory/80 hover:text-ivory">
              {link}
            </a>
          ))}
        </div>
        <div className="min-w-0 sm:col-span-2 lg:col-span-1">
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
