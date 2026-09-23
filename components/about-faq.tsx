"use client"

import { Plus, X } from "lucide-react"
import type { Dictionary } from "@/app/[locale]/dictionaries"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export function AboutFaq({ copy }: { copy: Dictionary["aboutPage"]["faq"] }) {
  return (
    <section
      id="faq"
      className="scroll-mt-28 py-16 pr-20 pl-6 sm:py-20 sm:pr-24 sm:pl-10 lg:px-16 lg:py-28"
    >
      <div className="mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-20 xl:gap-28">
        <div className="lg:sticky lg:top-32">
          <p className="text-sm text-charcoal/55">{copy.eyebrow}</p>
          <h2 className="mt-4 max-w-sm font-heading text-[clamp(2.35rem,4.8vw,4.15rem)] leading-[0.98] font-semibold tracking-[-0.04em] whitespace-pre-line text-charcoal">
            {copy.title}
          </h2>
        </div>

        <Accordion defaultValue={copy.items.length > 0 ? ["0"] : []} className="min-w-0">
          {copy.items.map((item, index) => (
            <AccordionItem
              key={`${item.question}-${index}`}
              value={String(index)}
              className="not-last:border-b-0"
            >
              <AccordionTrigger className="items-start gap-6 rounded-none py-7 hover:no-underline sm:py-8 **:data-[slot=accordion-trigger-icon]:hidden">
                <span className="font-heading text-lg leading-snug font-semibold tracking-tight text-charcoal sm:text-[1.35rem]">
                  {item.question}
                </span>
                <span className="grid size-11 shrink-0 place-items-center rounded-md bg-blush text-charcoal group-aria-expanded/accordion-trigger:bg-charcoal group-aria-expanded/accordion-trigger:text-ivory">
                  <Plus
                    className="size-5 group-aria-expanded/accordion-trigger:hidden"
                    aria-hidden
                  />
                  <X
                    className="hidden size-5 group-aria-expanded/accordion-trigger:block"
                    aria-hidden
                  />
                </span>
              </AccordionTrigger>
              <AccordionContent className="max-w-lg pr-16 pb-2 text-sm leading-relaxed font-light text-charcoal/65 sm:text-[15px]">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
