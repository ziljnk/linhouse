import type { Dictionary } from "@/app/[lang]/dictionaries"

export function SiteFooter({ footer }: { footer: Dictionary["footer"] }) {
  return (
    <footer id="footer" className="bg-burgundy-deep px-10 pt-12 pb-8 text-ivory">
      <div className="mx-auto mb-8 grid max-w-6xl gap-8 md:grid-cols-4">
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
        <div>
          <h3 className="mb-4 text-xs tracking-[0.16em] text-gold uppercase">{footer.map}</h3>
          <a
            href="https://maps.google.com/?q=Ho+Chi+Minh+City"
            target="_blank"
            rel="noreferrer"
            className="relative block min-h-40 bg-burgundy bg-[url('https://images.unsplash.com/photo-1524661131558-74138d4680ea?auto=format&fit=crop&w=800&q=60')] bg-cover bg-center"
          >
            <span className="absolute inset-x-3 bottom-3 bg-burgundy-deep/80 px-2.5 py-2 text-xs">
              {footer.address}
            </span>
          </a>
        </div>
      </div>
      <p className="mx-auto max-w-6xl border-t border-ivory/20 pt-4 text-xs text-ivory/70">
        {footer.copy}
      </p>
    </footer>
  )
}
