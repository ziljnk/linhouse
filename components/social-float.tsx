import Image from "next/image"
import type { Dictionary } from "@/app/[locale]/dictionaries"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const iconButtonClass =
  "flex size-11 items-center justify-center rounded-xl border border-charcoal/15 bg-ivory/90 text-charcoal shadow-lg backdrop-blur-xl"

function SocialIcon({ src }: { src: string }) {
  return <Image src={src} alt="" width={20} height={20} className="size-5" />
}

export function SocialFloat({
  social,
  email,
  phone,
}: {
  social: Dictionary["social"]
  email: string
  phone: string
}) {
  const phoneHref = `tel:${phone.replaceAll(" ", "")}`
  const zaloHref = `https://zalo.me/${phone.replaceAll(" ", "")}`

  const links = [
    { key: "gmail", href: `mailto:${email}`, label: social.gmail, icon: "/socials/gmail.svg" },
    { key: "zalo", href: zaloHref, label: social.zalo, icon: "/socials/zalo.svg" },
    { key: "instagram", href: social.instagramUrl, label: social.instagram, icon: "/socials/instagram.svg" },
    { key: "facebook", href: social.facebookUrl, label: social.facebook, icon: "/socials/facebook.svg" },
    { key: "phone", href: phoneHref, label: social.phone, icon: "/socials/phone.svg" },
  ]

  return (
    <nav
      aria-label={social.label}
      className="fixed right-5 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-50 flex flex-col gap-2.5 sm:right-6"
    >
      {links.map((link) => {
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
