"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X } from "lucide-react"
import { HeaderSearch } from "@/components/header-search"
import { HeaderWishlist } from "@/components/header-wishlist"
import { cn } from "@/lib/utils"
import type { Dictionary, Locale } from "@/app/[locale]/dictionaries"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { BookAppointmentDialog } from "@/components/book-appointment-dialog"

const languages = [
  { value: "en", label: "English", flag: "/flags/usa.svg" },
  { value: "vi", label: "Tiếng Việt", flag: "/flags/vietnam.svg" },
] as const

const triggerClass =
  "h-14 rounded-none bg-transparent px-3 text-[12.5px] font-medium uppercase tracking-[0.14em] text-charcoal shadow-none hover:bg-transparent hover:text-burgundy focus:bg-transparent data-open:bg-transparent data-popup-open:bg-transparent data-open:hover:bg-transparent data-popup-open:hover:bg-transparent border-b-2 border-transparent data-popup-open:border-burgundy data-popup-open:text-burgundy [&_svg]:hidden"

const megaLinkClass =
  "rounded-none p-0 py-1.5 text-sm font-normal text-charcoal hover:bg-transparent hover:text-burgundy focus:bg-transparent focus-visible:ring-0"

const iconButtonClass = "inline-flex size-9 items-center justify-center"

type MegaColumn = Dictionary["nav"]["homeColumns"][number]

function navSections(nav: Dictionary["nav"]) {
  return [
    // { title: nav.newIn, columns: nav.homeColumns },
    { title: nav.collection, columns: nav.collectionColumns },
    { title: nav.bridal, columns: nav.bridalColumns },
    { title: nav.aodai, columns: nav.aodaiColumns },
    { title: nav.services, columns: [{ title: nav.services, links: nav.serviceItems }] },
  ]
}

function isFeaturedNavLink(href: string) {
  return href === "/catalog/all-gowns" || href === "/catalog/all-ao-dai"
}

function MegaColumns({
  columns,
  locale,
}: {
  columns: MegaColumn[]
  locale: Locale
}) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-wrap gap-x-20 gap-y-10 px-8 py-10">
      {columns.map((column) => (
        <div key={column.title} className="min-w-40">
          <h3 className="mb-4 text-xs font-semibold tracking-[0.12em] text-gold uppercase">
            {column.title}
          </h3>
          <ul className="flex flex-col">
            {column.links.map((link) => (
              <li key={link.label}>
                <NavigationMenuLink
                  render={
                    <Link
                      href={navHref(locale, link.href)}
                    />
                  }
                  className={cn(
                    megaLinkClass,
                    isFeaturedNavLink(link.href) && "font-bold text-primary"
                  )}
                >
                  {link.label}
                </NavigationMenuLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function HeaderIcons({
  locale,
  nav,
}: {
  locale: Locale
  nav: Dictionary["nav"]
}) {
  return (
    <div className="flex items-center justify-end gap-1 sm:gap-3">
      <HeaderSearch locale={locale} nav={nav} />
      <HeaderWishlist locale={locale} nav={nav} />
      <LanguageSwitcher locale={locale} />
    </div>
  )
}

function navHref(locale: Locale, href: string) {
  if (
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("http://") ||
    href.startsWith("https://")
  ) {
    return href
  }
  const path = href.startsWith("/") ? href : `/${href}`
  return `/${locale}${path}`
}

function MobileNav({
  locale,
  nav,
  brand,
  onBook,
}: {
  locale: Locale
  nav: Dictionary["nav"]
  brand: Dictionary["brand"]
  onBook: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        nativeButton
        className={iconButtonClass}
        aria-label={nav.menu}
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-[min(100%,22rem)] gap-0 bg-background p-0"
      >
        <SheetHeader className="flex-row items-center justify-between space-y-0 border-b px-4 py-3">
          <SheetTitle className="p-0">
            <Image
              src="/logo-text.png"
              alt={brand.name}
              width={400}
              height={107}
              className="h-8 w-auto"
              sizes="160px"
            />
          </SheetTitle>
          <SheetClose
            nativeButton
            className={iconButtonClass}
            aria-label={nav.closeMenu}
          >
            <X className="size-4" />
          </SheetClose>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="border-b px-4 py-5">
            <p className="mb-3 text-[11px] font-medium tracking-[0.18em] text-gold uppercase">
              {nav.book}
            </p>
            <p className="mb-3 text-sm font-light text-muted-foreground">
              {nav.bookHint}
            </p>
            <button
              type="button"
              className="h-10 w-full bg-burgundy px-4 text-xs font-medium tracking-widest text-ivory uppercase hover:bg-burgundy-deep"
              onClick={() => {
                setOpen(false)
                onBook()
              }}
            >
              {nav.bookSubmit}
            </button>
          </div>

          <nav className="border-b px-4">
            <SheetClose
              nativeButton={false}
              render={
                <Link
                  href={`/${locale}`}
                  className="block rounded-none py-3.5 text-[12.5px] font-medium tracking-[0.14em] text-charcoal uppercase hover:text-burgundy"
                />
              }
            >
              {nav.home}
            </SheetClose>
            <SheetClose
              nativeButton={false}
              render={
                <Link
                  href={`/${locale}/about`}
                  className="block rounded-none py-3.5 text-[12.5px] font-medium tracking-[0.14em] text-charcoal uppercase hover:text-burgundy"
                />
              }
            >
              {nav.about}
            </SheetClose>
          </nav>

          <Accordion className="px-4">
            {navSections(nav).map((section) => (
              <AccordionItem key={section.title} value={section.title}>
                <AccordionTrigger className="rounded-none py-3.5 text-[12.5px] font-medium tracking-[0.14em] text-charcoal uppercase hover:no-underline hover:text-burgundy">
                  {section.title}
                </AccordionTrigger>
                <AccordionContent className="[&_a]:no-underline">
                  <div className="flex flex-col gap-4 pb-2">
                    {section.columns.map((column) => (
                      <div key={column.title}>
                        {section.columns.length > 1 && (
                          <p className="mb-1.5 text-[11px] font-semibold tracking-[0.12em] text-gold uppercase">
                            {column.title}
                          </p>
                        )}
                        <ul className="flex flex-col">
                          {column.links.map((link) => (
                            <li key={link.label}>
                              <SheetClose
                                nativeButton={false}
                                render={
                                  <Link
                                    href={navHref(locale, link.href)}
                                    className={cn(
                                      "block py-1.5 text-sm text-charcoal hover:text-burgundy",
                                      isFeaturedNavLink(link.href) &&
                                        "font-bold text-primary"
                                    )}
                                  />
                                }
                              >
                                {link.label}
                              </SheetClose>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <nav className="flex flex-col gap-1 border-t px-4 py-4 text-sm text-muted-foreground">
            <SheetClose nativeButton={false} render={<Link href={`/${locale}/support`} className="py-1.5 hover:text-burgundy" />}>
              {nav.top.contact}
            </SheetClose>
            <SheetClose nativeButton={false} render={<Link href={`/${locale}/reviews`} className="py-1.5 hover:text-burgundy" />}>
              {nav.top.reviews}
            </SheetClose>
            <SheetClose nativeButton={false} render={<Link href={`/${locale}/shipping`} className="py-1.5 hover:text-burgundy" />}>
              {nav.top.shipping}
            </SheetClose>
            <SheetClose nativeButton={false} render={<Link href={`/${locale}/about#faq`} className="py-1.5 hover:text-burgundy" />}>
              {nav.top.faq}
            </SheetClose>
            <SheetClose nativeButton={false} render={<Link href="#footer" className="py-1.5 hover:text-burgundy" />}>
              {nav.top.services}
            </SheetClose>
          </nav>
        </div>

        <div className="border-t px-4 py-3">
          <LanguageSwitcher locale={locale} />
        </div>
      </SheetContent>
    </Sheet>
  )
}

const COLLAPSE_AFTER = 32
const EXPAND_BEFORE = 8
const COLLAPSE_LOCK_MS = 350

export function SiteHeader({
  locale,
  nav,
  brand,
  booking,
  storeAddress,
  contactMethods,
}: {
  locale: Locale
  nav: Dictionary["nav"]
  brand: Dictionary["brand"]
  booking: Dictionary["booking"]
  storeAddress: string
  contactMethods: { id: string; label: string }[]
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [bookingOpen, setBookingOpen] = useState(false)
  const collapsedRef = useRef(false)

  useEffect(() => {
    let frame = 0
    let lockTimer = 0
    let locked = false

    const pinScroll = (y: number) => {
      if (window.scrollY < EXPAND_BEFORE) {
        window.scrollTo({ top: y, behavior: "auto" })
      }
    }

    const apply = (next: boolean, keepY = 0) => {
      if (next === collapsedRef.current) return
      collapsedRef.current = next
      setCollapsed(next)

      const root = document.documentElement
      root.style.overflowAnchor = "none"
      locked = true
      window.clearTimeout(lockTimer)

      if (next) {
        requestAnimationFrame(() => pinScroll(Math.max(keepY, COLLAPSE_AFTER)))
      }

      lockTimer = window.setTimeout(() => {
        root.style.overflowAnchor = ""
        locked = false
        sync()
      }, COLLAPSE_LOCK_MS)
    }

    const sync = () => {
      frame = 0
      if (locked) return
      const y = window.scrollY
      if (!collapsedRef.current && y > COLLAPSE_AFTER) apply(true, y)
      else if (collapsedRef.current && y < EXPAND_BEFORE) apply(false)
    }

    const onScroll = () => {
      if (frame || locked) return
      frame = requestAnimationFrame(sync)
    }

    sync()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.clearTimeout(lockTimer)
      if (frame) cancelAnimationFrame(frame)
      document.documentElement.style.overflowAnchor = ""
    }
  }, [])

  return (
    <>
    <header className="sticky top-0 z-40 w-full border-b bg-background [overflow-anchor:none]">
      <div
        className={cn(
          "hidden overflow-hidden border-b text-xs tracking-wide text-muted-foreground transition-[max-height,opacity] duration-300 lg:block",
          collapsed ? "max-h-0 border-transparent opacity-0" : "max-h-12 opacity-100"
        )}
      >
        <nav className="flex items-center gap-4 px-6 py-2">
          <Link href={`/${locale}/support`} className="hover:text-burgundy">
            {nav.top.contact}
          </Link>
          <Link href={`/${locale}/reviews`} className="hover:text-burgundy">
            {nav.top.reviews}
          </Link>
          <Link href={`/${locale}/shipping`} className="hover:text-burgundy">
            {nav.top.shipping}
          </Link>
          <Link href={`/${locale}/about#faq`} className="hover:text-burgundy">
            {nav.top.faq}
          </Link>
          <Link href="#footer" className="hover:text-burgundy">
            {nav.top.services}
          </Link>
        </nav>
      </div>

      <div
        className={cn(
          "hidden overflow-hidden text-center transition-[max-height,padding,opacity] duration-300 lg:block",
          collapsed ? "max-h-0 py-0 opacity-0" : "max-h-56 px-6 py-5 opacity-100"
        )}
      >
        <Link href={`/${locale}`} className="inline-flex items-center">
          <Image
            src="/logo.png"
            alt={brand.name}
            width={410}
            height={512}
            className="h-16 w-auto sm:h-20"
            priority
          />
        </Link>
      </div>

      <div className="flex items-center justify-between px-4 py-2 lg:hidden">
        <div className="flex items-center gap-1">
          <MobileNav
            locale={locale}
            nav={nav}
            brand={brand}
            onBook={() => setBookingOpen(true)}
          />
          <Link href={`/${locale}`} className="flex items-center">
            <Image
              src="/logo.png"
              alt={brand.name}
              width={410}
              height={512}
              className="h-9 w-auto"
              priority
            />
          </Link>
        </div>
        <HeaderIcons locale={locale} nav={nav} />
      </div>

      <div className="relative hidden grid-cols-[1fr_auto_1fr] items-center px-6 lg:grid">
        <Link
          href={`/${locale}`}
          className={cn(
            "inline-flex w-fit items-center gap-2 transition-opacity duration-300",
            collapsed ? "opacity-100" : "pointer-events-none opacity-0"
          )}
          tabIndex={collapsed ? undefined : -1}
          aria-hidden={!collapsed}
        >
          <Image
            src="/logo.png"
            alt={brand.name}
            width={410}
            height={512}
            className="h-10 w-auto"
          />
        </Link>

        <div className="flex items-center justify-self-center">
          <button
            type="button"
            className="mr-2 h-8 rounded-none border-0 bg-burgundy px-3.5 text-[12.5px] font-medium tracking-[0.14em] text-ivory uppercase hover:bg-burgundy-deep hover:text-ivory data-open:bg-burgundy-deep"
            onClick={() => setBookingOpen(true)}
          >
            {nav.book}
          </button>
          <NavigationMenu fullWidth>
            <NavigationMenuList className="flex-wrap">
              <NavigationMenuItem>
                <NavigationMenuLink
                  render={<Link href={`/${locale}`} />}
                  className={triggerClass}
                >
                  {nav.home}
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  render={<Link href={`/${locale}/about`} />}
                  className={triggerClass}
                >
                  {nav.about}
                </NavigationMenuLink>
              </NavigationMenuItem>
              {navSections(nav).map((section) => (
                <NavigationMenuItem key={section.title}>
                  <NavigationMenuTrigger className={triggerClass}>
                    {section.title}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="w-full p-0">
                    <MegaColumns columns={section.columns} locale={locale} />
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <HeaderIcons locale={locale} nav={nav} />
      </div>
    </header>
    <BookAppointmentDialog
      open={bookingOpen}
      onOpenChange={setBookingOpen}
      locale={locale}
      brand={brand}
      booking={booking}
      storeAddress={storeAddress}
      contactMethods={contactMethods}
    />
    </>
  )
}

function LanguageLabel({
  flag,
  label,
}: {
  flag: string
  label: string
}) {
  return (
    <span className="flex items-center gap-2">
      <img
        src={flag}
        alt=""
        width={20}
        height={14}
        className="h-3.5 w-5 rounded-sm object-cover ring-1 ring-black/10"
      />
      {label}
    </span>
  )
}

function LanguageSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter()
  const pathname = usePathname()

  function onLocaleChange(nextLocale: string | null) {
    if (!nextLocale || nextLocale === locale) return

    const segments = pathname.split("/")
    if (segments[1] === "en" || segments[1] === "vi") {
      segments[1] = nextLocale
    }

    const hash = window.location.hash
    router.replace(`${segments.join("/")}${hash}`)
  }

  return (
    <Select
      value={locale}
      onValueChange={onLocaleChange}
      items={languages.map((language) => ({
        value: language.value,
        label: <LanguageLabel flag={language.flag} label={language.label} />,
      }))}
    >
      <SelectTrigger size="sm" aria-label="Language" className="h-7 border-0 bg-transparent shadow-none">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end" alignItemWithTrigger={false}>
        {languages.map((language) => (
          <SelectItem
            key={language.value}
            value={language.value}
            label={language.label}
          >
            <LanguageLabel flag={language.flag} label={language.label} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
