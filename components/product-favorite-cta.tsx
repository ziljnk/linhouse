"use client"

import { isInWishlist, toggleWishlistItem, useWishlist } from "@/lib/wishlist"

export function ProductFavoriteCta({
  slug,
  name,
  image,
  addLabel,
  removeLabel,
}: {
  slug: string
  name: string
  image: string
  addLabel: string
  removeLabel: string
}) {
  const items = useWishlist()
  const saved = isInWishlist(slug, items)

  return (
    <button
      type="button"
      aria-pressed={saved}
      onClick={() => toggleWishlistItem({ slug, name, image })}
      className="inline-flex h-12 items-center justify-center border border-charcoal/80 px-8 text-[11px] tracking-[0.2em] text-charcoal uppercase transition-colors hover:bg-charcoal hover:text-ivory"
    >
      {saved ? removeLabel : addLabel}
    </button>
  )
}
