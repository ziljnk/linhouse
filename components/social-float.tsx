import Image from "next/image"
import type { Dictionary } from "@/app/[locale]/dictionaries"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  whatsappHref,
  zaloHref,
  type FloatIconId,
} from "@/lib/site-settings"

const iconButtonClass =
  "flex size-12 items-center justify-center rounded-xl border border-charcoal/15 bg-ivory/90 text-charcoal shadow-lg backdrop-blur-xl"

const ICONS: Record<FloatIconId, string> = {
  gmail: "/socials/gmail.svg",
  zalo: "/socials/zalo.svg",
  instagram: "/socials/instagram.svg",
  facebook: "/socials/facebook.svg",
  whatsapp: "/socials/whatsapp.svg",
}

function SocialIcon({ src }: { src: string }) {
  return <Image src={src} alt="" width={20} height={20} className="size-8" />
}

export function SocialFloat({
  social,
  email,
  phone,
  zalo,
  order,
}: {
  social: Dictionary["social"]
  email: string
  phone: string
  zalo?: string
  order: FloatIconId[]
}) {
  const zaloLink = zaloHref(zalo || social.zaloPhone, phone)
  const whatsappLink = whatsappHref(phone)

  const links: Record<FloatIconId, { href: string; label: string } | null> = {
    gmail: email
      ? { href: `mailto:${email}`, label: social.gmail }
      : null,
    zalo: zaloLink ? { href: zaloLink, label: social.zalo } : null,
    instagram: social.instagramUrl
      ? { href: social.instagramUrl, label: social.instagram }
      : null,
    facebook: social.facebookUrl
      ? { href: social.facebookUrl, label: social.facebook }
      : null,
    whatsapp: whatsappLink
      ? { href: whatsappLink, label: social.whatsapp }
      : null,
  }

  const visible = order.flatMap((id) => {
    const link = links[id]
    if (!link) return []
    return [{ key: id, ...link, icon: ICONS[id] }]
  })

  if (visible.length === 0) return null

  return (
    <nav
      aria-label={social.label}
      className="fixed right-5 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-50 flex flex-col gap-2.5 sm:right-6"
    >
      {visible.map((link) => {
        const isExternal = link.href.startsWith("http")
        return (
          <Tooltip key={link.key}>
            <TooltipTrigger
              delay={150}
              render={
                <a
                  href={link.href}
                  aria-label={link.label}
                  className={iconButtonClass}
                  {...(isExternal ? { target: "_blank", rel: "noreferrer" } : {})}
                />
              }
            >
              <SocialIcon src={link.icon} />
            </TooltipTrigger>
            <TooltipContent side="left" sideOffset={10}>
              {link.label}
            </TooltipContent>
          </Tooltip>
        )
      })}
    </nav>
  )
}
