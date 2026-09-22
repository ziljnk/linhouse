"use client"

import { useState } from "react"
import type { Dictionary, Locale } from "@/app/[locale]/dictionaries"
import { BookAppointmentDialog } from "@/components/book-appointment-dialog"

export function ProductBookingCta({
  label,
  locale,
  brand,
  booking,
  storeAddress,
  contactMethods,
  product,
}: {
  label: string
  locale: Locale
  brand: Dictionary["brand"]
  booking: Dictionary["booking"]
  storeAddress: string
  contactMethods: { id: string; label: string }[]
  product: { slug: string; name: string }
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-12 items-center justify-center bg-burgundy px-8 text-[11px] tracking-[0.2em] text-ivory uppercase transition-colors hover:bg-burgundy-deep"
      >
        {label}
      </button>
      <BookAppointmentDialog
        open={open}
        onOpenChange={setOpen}
        locale={locale}
        brand={brand}
        booking={booking}
        storeAddress={storeAddress}
        contactMethods={contactMethods}
        product={product}
      />
    </>
  )
}
