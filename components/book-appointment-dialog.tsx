"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import Image from "next/image"
import { X } from "lucide-react"
import type { Dictionary, Locale } from "@/app/[locale]/dictionaries"
import { submitAppointmentAction } from "@/app/[locale]/booking/actions"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DateTimePicker24h } from "@/components/ui/date-time-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"

const fieldClass =
  "h-11 rounded-none border-charcoal/20 bg-white shadow-none placeholder:text-muted-foreground/80 focus-visible:border-burgundy focus-visible:ring-0"

export function BookAppointmentDialog({
  open,
  onOpenChange,
  locale,
  brand,
  booking,
  storeAddress,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  locale: Locale
  brand: Dictionary["brand"]
  booking: Dictionary["booking"]
  storeAddress: string
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [datetime, setDatetime] = useState("")

  useEffect(() => {
    if (open) return
    formRef.current?.reset()
    setError("")
    setSubmitted(false)
    setDatetime("")
  }, [open])

  useEffect(() => {
    if (!submitted) return
    const timer = window.setTimeout(() => onOpenChange(false), 2500)
    return () => window.clearTimeout(timer)
  }, [submitted, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/50 backdrop-blur-none supports-backdrop-filter:backdrop-blur-none"
        className="top-0 left-0 h-dvh w-full max-w-none translate-none gap-0 overflow-hidden rounded-none bg-white p-0 ring-0 data-open:zoom-in-100 data-closed:zoom-out-100 sm:max-w-none lg:top-1/2 lg:left-1/2 lg:h-auto lg:max-h-[90vh] lg:w-[min(100%-2rem,64rem)] lg:max-w-5xl lg:-translate-x-1/2 lg:-translate-y-1/2 lg:data-open:zoom-in-95 lg:data-closed:zoom-out-95"
      >
        <div className="flex h-full min-h-0 flex-col lg:grid lg:max-h-[90vh] lg:min-h-128 lg:grid-cols-2">
          <div className="relative h-56 shrink-0 overflow-hidden bg-charcoal lg:h-full lg:min-h-full">
            <Image
              src="/hero/appointment.jpg"
              alt={booking.imageAlt}
              fill
              quality={90}
              sizes="(min-width: 1024px) 32rem, 100vw"
              className="object-cover object-[60%_center]"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent lg:from-black/45 lg:via-transparent" />

            <DialogHeader className="absolute inset-x-0 bottom-0 z-10 items-start px-5 pb-5 pr-12 text-left lg:hidden">
              <DialogTitle className="font-heading text-2xl leading-tight font-medium text-ivory">
                {booking.title}
              </DialogTitle>
              <DialogDescription className="mt-1 max-w-sm text-[13px] font-light text-ivory/80">
                {booking.subtitle}
              </DialogDescription>
            </DialogHeader>

            <p className="absolute bottom-6 left-6 hidden font-heading text-lg font-medium tracking-[0.22em] text-ivory uppercase lg:block">
              {brand.name}
            </p>

            <DialogClose
              nativeButton
              className="absolute top-3 right-3 z-10 inline-flex size-9 items-center justify-center text-ivory/80 transition-colors hover:text-ivory lg:hidden"
              aria-label={booking.close}
            >
              <X className="size-4" />
            </DialogClose>
          </div>

          <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto bg-white px-6 py-6 pb-[max(2rem,env(safe-area-inset-bottom))] lg:px-10 lg:py-9">
            <DialogClose
              nativeButton
              className="absolute top-4 right-4 z-10 hidden size-9 items-center justify-center text-charcoal/50 transition-colors hover:text-charcoal lg:inline-flex"
              aria-label={booking.close}
            >
              <X className="size-4" />
            </DialogClose>

            <DialogHeader className="hidden items-center pr-8 text-center lg:flex">
              <DialogTitle className="font-heading text-[2rem] leading-tight font-medium text-burgundy-deep">
                {booking.title}
              </DialogTitle>
              <DialogDescription className="max-w-sm text-[13px] font-light text-muted-foreground">
                {booking.subtitle}
              </DialogDescription>
            </DialogHeader>

            {submitted ? (
              <p
                role="status"
                className="mt-8 flex flex-1 items-center justify-center text-center text-sm font-light leading-relaxed text-charcoal"
              >
                {booking.success}
              </p>
            ) : (
              <form
                ref={formRef}
                className="flex flex-1 flex-col gap-3.5 lg:mt-8"
                onSubmit={(event) => {
                  event.preventDefault()
                  setError("")
                  const formData = new FormData(event.currentTarget)
                  startTransition(async () => {
                    const result = await submitAppointmentAction(formData)
                    if (!result.ok) {
                      setError(result.error || booking.error)
                      return
                    }
                    setSubmitted(true)
                  })
                }}
              >
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="storeAddress" value={storeAddress} />

                <Input
                  required
                  name="name"
                  autoComplete="name"
                  maxLength={120}
                  minLength={2}
                  placeholder={booking.fullName}
                  aria-label={booking.fullName}
                  className={fieldClass}
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    required
                    type="tel"
                    name="phone"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={40}
                    placeholder={booking.phone}
                    aria-label={booking.phone}
                    className={fieldClass}
                  />
                  <Input
                    required
                    type="email"
                    name="email"
                    autoComplete="email"
                    maxLength={254}
                    placeholder={booking.email}
                    aria-label={booking.email}
                    className={fieldClass}
                  />
                </div>

                <div className="mt-1 space-y-2.5">
                  <Label className="text-sm font-semibold text-charcoal">
                    {booking.selectStore}
                    <span className="text-burgundy"> *</span>
                  </Label>
                  <RadioGroup
                    required
                    name="store"
                    defaultValue={storeAddress}
                    className="gap-2"
                  >
                    <Label className="flex cursor-pointer items-start gap-2.5 font-normal text-charcoal">
                      <RadioGroupItem
                        value={storeAddress}
                        className="mt-0.5 border-burgundy/40 data-checked:border-burgundy data-checked:bg-burgundy"
                      />
                      <span className="text-sm leading-snug">{storeAddress}</span>
                    </Label>
                  </RadioGroup>
                </div>

                <DateTimePicker24h
                  required
                  name="datetime"
                  value={datetime}
                  onChange={setDatetime}
                  min={new Date()}
                  placeholder={booking.date}
                  aria-label={booking.date}
                  className={fieldClass}
                />

                <Textarea
                  name="message"
                  rows={4}
                  maxLength={2000}
                  placeholder={booking.message}
                  aria-label={booking.message}
                  className="min-h-24 resize-none rounded-none border-charcoal/20 bg-white shadow-none placeholder:text-muted-foreground/80 focus-visible:border-burgundy focus-visible:ring-0"
                />

                {error ? (
                  <p role="alert" className="text-sm text-burgundy">
                    {error}
                  </p>
                ) : null}

                <div className="mt-auto flex justify-center pt-2">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full border border-burgundy-deep px-10 py-2.5 text-xs font-semibold tracking-[0.2em] text-burgundy-deep uppercase transition-colors hover:bg-burgundy-deep hover:text-ivory disabled:pointer-events-none disabled:opacity-60 sm:w-auto"
                  >
                    {isPending ? booking.sending : booking.submit}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
