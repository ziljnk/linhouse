"use client"

import { useMemo } from "react"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox"
import {
  countriesForLocale,
  countryDisplayName,
  countryFlagUrl,
  DEFAULT_COUNTRY_ISO,
  findCountryDialCode,
  type CountryDialCode,
} from "@/lib/country-dial-codes"
import { cn } from "@/lib/utils"

export type CountryOption = CountryDialCode & {
  name: string
}

function toOption(country: CountryDialCode, locale: string): CountryOption {
  return {
    ...country,
    name: countryDisplayName(country.iso, locale),
  }
}

function CountryFlag({ iso, className }: { iso: string; className?: string }) {
  return (
    <img
      src={countryFlagUrl(iso, 40)}
      srcSet={`${countryFlagUrl(iso, 80)} 2x`}
      alt=""
      width={20}
      height={15}
      className={cn("h-[15px] w-5 shrink-0 object-cover", className)}
      loading="lazy"
      decoding="async"
    />
  )
}

export function CountryCodeSelect({
  locale,
  value,
  onChange,
  name = "countryCode",
  searchPlaceholder,
  emptyText,
  ariaLabel,
}: {
  locale: string
  value: string
  onChange: (iso: string) => void
  name?: string
  searchPlaceholder: string
  emptyText: string
  ariaLabel: string
}) {
  const items = useMemo(
    () => countriesForLocale(locale).map((country) => toOption(country, locale)),
    [locale]
  )
  const selected =
    items.find((item) => item.iso === value) ??
    toOption(
      findCountryDialCode(DEFAULT_COUNTRY_ISO) ?? items[0] ?? { iso: "VN", dial: "84" },
      locale
    )

  return (
    <>
      <input type="hidden" name={name} value={selected.iso} />
      <Combobox
        items={items}
        value={selected}
        onValueChange={(next) => {
          if (next) onChange(next.iso)
        }}
        itemToStringLabel={(item) =>
          `${item.name} ${item.iso} +${item.dial}`
        }
        itemToStringValue={(item) => item.iso}
        isItemEqualToValue={(a, b) => a.iso === b.iso}
        autoHighlight
      >
        <ComboboxTrigger
          type="button"
          aria-label={ariaLabel}
          className="inline-flex h-full min-w-[5.75rem] shrink-0 items-center gap-1.5 border-0 bg-transparent px-2.5 text-sm text-charcoal outline-none hover:bg-ivory"
        >
          <CountryFlag iso={selected.iso} />
          <span className="font-medium tabular-nums">+{selected.dial}</span>
        </ComboboxTrigger>
        <ComboboxContent
          side="bottom"
          align="start"
          className="w-72 min-w-72"
        >
          <ComboboxInput
            placeholder={searchPlaceholder}
            showTrigger={false}
            className="w-auto"
          />
          <ComboboxEmpty>{emptyText}</ComboboxEmpty>
          <ComboboxList>
            {(item: CountryOption) => (
              <ComboboxItem key={item.iso} value={item}>
                <CountryFlag iso={item.iso} />
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  +{item.dial}
                </span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </>
  )
}
