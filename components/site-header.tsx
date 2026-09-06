"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Search, ShoppingBag, User } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Dictionary, Locale } from "@/app/[lang]/dictionaries"
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

const languages = [
  { value: "en", label: "English", flag: "/flags/usa.svg" },
  { value: "vi", label: "Tiếng Việt", flag: "/flags/vietnam.svg" },
] as const

const triggerClass =
  "h-14 rounded-none bg-transparent px-3 text-[12.5px] font-medium uppercase tracking-[0.14em] text-charcoal shadow-none hover:bg-transparent hover:text-burgundy focus:bg-transparent data-open:bg-transparent data-popup-open:bg-transparent data-open:hover:bg-transparent data-popup-open:hover:bg-transparent border-b-2 border-transparent data-popup-open:border-burgundy data-popup-open:text-burgundy [&_svg]:hidden"

const megaLinkClass =
  "rounded-none p-0 py-1.5 text-sm font-normal text-charcoal hover:bg-transparent hover:text-burgundy focus:bg-transparent focus-visible:ring-0"

type MegaColumn = Dictionary["nav"]["homeColumns"][number]

function MegaColumns({
  columns,
  lang,
}: {
  columns: MegaColumn[]
  lang: Locale
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
                      href={
                        link.href.startsWith("#")
                          ? link.href
                          : `/${lang}${link.href}`
                      }
                    />
                  }
                  className={megaLinkClass}
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

export function SiteHeader({
  lang,
  nav,
  brand,
}: {
  lang: Locale
  nav: Dictionary["nav"]
  brand: Dictionary["brand"]
}) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const onScroll = () => setCollapsed(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div
        className={cn(
          "overflow-hidden border-b text-xs tracking-wide text-muted-foreground transition-[max-height,opacity] duration-300",
          collapsed ? "max-h-0 border-transparent opacity-0" : "max-h-12 opacity-100"
        )}
      >
        <div className="flex items-center justify-between px-6 py-2">
          <nav className="flex items-center gap-4">
            <Link href="#footer" className="hover:text-burgundy">
              {nav.top.contact}
            </Link>
            <Link href={`/${lang}`} className="hover:text-burgundy">
              {nav.top.reviews}
            </Link>
            <Link href="#footer" className="hover:text-burgundy">
              {nav.top.shipping}
            </Link>
            <Link href="#footer" className="hover:text-burgundy">
              {nav.top.faq}
            </Link>
            <Link href="#footer" className="hover:text-burgundy">
              {nav.top.services}
            </Link>
          </nav>
          <LanguageSwitcher lang={lang} />
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden text-center transition-[max-height,padding,opacity] duration-300",
          collapsed ? "max-h-0 py-0 opacity-0" : "max-h-48 px-6 py-5 opacity-100"
        )}
      >
        <Link href={`/${lang}`} className="inline-flex flex-col items-center gap-1">
          <span className="grid size-10 place-items-center rounded-full border border-burgundy font-[family-name:var(--font-heading)] text-lg tracking-[0.08em] text-burgundy-deep">
            LH
          </span>
          <span className="font-[family-name:var(--font-heading)] text-3xl font-medium tracking-[0.28em] text-burgundy-deep uppercase">
            {brand.name}
          </span>
          <span className="text-[11px] tracking-[0.32em] text-gold uppercase">
            {brand.tagline}
          </span>
        </Link>
      </div>

      <div className="relative grid grid-cols-[40px_1fr_88px] items-center px-6">
        <button type="button" className="inline-flex size-9 items-center justify-center" aria-label={nav.search}>
          <Search className="size-4" />
        </button>

        <NavigationMenu fullWidth className="justify-self-center">
          <NavigationMenuList className="flex-wrap">
            <NavigationMenuItem>
              <NavigationMenuTrigger
                className={`${triggerClass} mt-0 mr-2 h-8 border-0 bg-burgundy px-3.5 text-ivory hover:bg-burgundy-deep hover:text-ivory data-popup-open:bg-burgundy-deep data-popup-open:text-ivory data-popup-open:border-transparent`}
              >
                {nav.book}
              </NavigationMenuTrigger>
              <NavigationMenuContent className="w-full p-0">
                <form
                  className="mx-auto flex max-w-sm flex-col items-center gap-3 px-6 py-8 text-center"
                  onSubmit={(event) => {
                    event.preventDefault()
                    event.currentTarget.reset()
                  }}
                >
                  <p className="text-sm font-light text-muted-foreground">{nav.bookHint}</p>
                  <div className="flex w-full gap-2">
                    <input
                      type="tel"
                      required
                      placeholder={nav.bookPlaceholder}
                      className="h-10 flex-1 border border-border bg-background px-3 text-sm outline-none"
                    />
                    <button
                      type="submit"
                      className="h-10 bg-burgundy px-4 text-xs font-medium tracking-widest text-ivory uppercase hover:bg-burgundy-deep"
                    >
                      {nav.bookSubmit}
                    </button>
                  </div>
                </form>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className={triggerClass}>{nav.home}</NavigationMenuTrigger>
              <NavigationMenuContent className="w-full p-0">
                <MegaColumns columns={nav.homeColumns} lang={lang} />
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className={triggerClass}>
                {nav.collection}
              </NavigationMenuTrigger>
              <NavigationMenuContent className="w-full p-0">
                <MegaColumns columns={nav.collectionColumns} lang={lang} />
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className={triggerClass}>{nav.bridal}</NavigationMenuTrigger>
              <NavigationMenuContent className="w-full p-0">
                <MegaColumns columns={nav.bridalColumns} lang={lang} />
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className={triggerClass}>{nav.aodai}</NavigationMenuTrigger>
              <NavigationMenuContent className="w-full p-0">
                <MegaColumns columns={nav.aodaiColumns} lang={lang} />
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className={triggerClass}>
                {nav.services}
              </NavigationMenuTrigger>
              <NavigationMenuContent className="w-full p-0">
                <MegaColumns
                  columns={[{ title: nav.services, links: nav.serviceItems }]}
                  lang={lang}
                />
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex justify-end gap-3">
          <button type="button" className="inline-flex size-9 items-center justify-center" aria-label={nav.account}>
            <User className="size-4" />
          </button>
          <button type="button" className="inline-flex size-9 items-center justify-center" aria-label={nav.bag}>
            <ShoppingBag className="size-4" />
          </button>
        </div>
      </div>
    </header>
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

function LanguageSwitcher({ lang }: { lang: Locale }) {
  const router = useRouter()
  const pathname = usePathname()

  function onLanguageChange(nextLang: string | null) {
    if (!nextLang || nextLang === lang) return

    const segments = pathname.split("/")
    if (segments[1] === "en" || segments[1] === "vi") {
      segments[1] = nextLang
    }

    const hash = window.location.hash
    router.replace(`${segments.join("/")}${hash}`)
  }

  return (
    <Select
      value={lang}
      onValueChange={onLanguageChange}
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
