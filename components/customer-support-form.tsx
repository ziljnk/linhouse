"use client"

import { useState, useTransition } from "react"
import type { Dictionary, Locale } from "@/app/[locale]/dictionaries"
import { submitSupportMessageAction } from "@/app/[locale]/support/actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const fieldClass =
  "rounded-none border-charcoal/20 bg-white shadow-none placeholder:text-muted-foreground/80 focus-visible:border-burgundy focus-visible:ring-0"

export function CustomerSupportForm({
  locale,
  copy,
}: {
  locale: Locale
  copy: Dictionary["customerSupport"]
}) {
  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (submitted) {
    return (
      <p
        role="status"
        className="border border-charcoal/15 bg-white px-5 py-8 text-center text-sm leading-relaxed font-light text-charcoal"
      >
        {copy.success}
      </p>
    )
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault()
        setError("")
        const formData = new FormData(event.currentTarget)
        startTransition(async () => {
          const result = await submitSupportMessageAction(formData)
          if (!result.ok) {
            setError(result.error || copy.error)
            return
          }
          setSubmitted(true)
        })
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <div className="space-y-2">
        <Label htmlFor="support-name" className="text-sm font-semibold text-charcoal">
          {copy.name}
        </Label>
        <Input
          id="support-name"
          required
          name="name"
          autoComplete="name"
          minLength={2}
          maxLength={120}
          className={`h-11 ${fieldClass}`}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="support-email" className="text-sm font-semibold text-charcoal">
          {copy.email}
        </Label>
        <Input
          id="support-email"
          required
          type="email"
          name="email"
          autoComplete="email"
          maxLength={254}
          className={`h-11 ${fieldClass}`}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="support-message" className="text-sm font-semibold text-charcoal">
          {copy.message}
        </Label>
        <Textarea
          id="support-message"
          required
          name="message"
          rows={6}
          minLength={2}
          maxLength={2000}
          className={`min-h-36 resize-y ${fieldClass}`}
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-burgundy">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full border border-burgundy-deep px-10 py-2.5 text-xs font-semibold tracking-[0.2em] text-burgundy-deep uppercase transition-colors hover:bg-burgundy-deep hover:text-ivory disabled:pointer-events-none disabled:opacity-60 sm:w-auto"
      >
        {isPending ? copy.sending : copy.submit}
      </button>
    </form>
  )
}
