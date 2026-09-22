export type CountryDialCode = {
  iso: string
  dial: string
}

export const DEFAULT_COUNTRY_ISO = "VN"

/** ISO 3166-1 alpha-2 + international dialing prefix (without +). */
export const COUNTRY_DIAL_CODES: CountryDialCode[] = [
  { iso: "VN", dial: "84" },
  { iso: "US", dial: "1" },
  { iso: "AU", dial: "61" },
  { iso: "CA", dial: "1" },
  { iso: "GB", dial: "44" },
  { iso: "SG", dial: "65" },
  { iso: "KR", dial: "82" },
  { iso: "JP", dial: "81" },
  { iso: "CN", dial: "86" },
  { iso: "TW", dial: "886" },
  { iso: "HK", dial: "852" },
  { iso: "MO", dial: "853" },
  { iso: "TH", dial: "66" },
  { iso: "MY", dial: "60" },
  { iso: "ID", dial: "62" },
  { iso: "PH", dial: "63" },
  { iso: "LA", dial: "856" },
  { iso: "KH", dial: "855" },
  { iso: "MM", dial: "95" },
  { iso: "BN", dial: "673" },
  { iso: "IN", dial: "91" },
  { iso: "AE", dial: "971" },
  { iso: "FR", dial: "33" },
  { iso: "DE", dial: "49" },
  { iso: "IT", dial: "39" },
  { iso: "ES", dial: "34" },
  { iso: "NL", dial: "31" },
  { iso: "BE", dial: "32" },
  { iso: "CH", dial: "41" },
  { iso: "AT", dial: "43" },
  { iso: "SE", dial: "46" },
  { iso: "NO", dial: "47" },
  { iso: "DK", dial: "45" },
  { iso: "FI", dial: "358" },
  { iso: "IE", dial: "353" },
  { iso: "PT", dial: "351" },
  { iso: "PL", dial: "48" },
  { iso: "CZ", dial: "420" },
  { iso: "HU", dial: "36" },
  { iso: "RO", dial: "40" },
  { iso: "GR", dial: "30" },
  { iso: "TR", dial: "90" },
  { iso: "RU", dial: "7" },
  { iso: "UA", dial: "380" },
  { iso: "NZ", dial: "64" },
  { iso: "ZA", dial: "27" },
  { iso: "BR", dial: "55" },
  { iso: "MX", dial: "52" },
  { iso: "AR", dial: "54" },
  { iso: "CL", dial: "56" },
  { iso: "CO", dial: "57" },
  { iso: "PE", dial: "51" },
  { iso: "SA", dial: "966" },
  { iso: "QA", dial: "974" },
  { iso: "KW", dial: "965" },
  { iso: "BH", dial: "973" },
  { iso: "OM", dial: "968" },
  { iso: "IL", dial: "972" },
  { iso: "EG", dial: "20" },
  { iso: "NG", dial: "234" },
  { iso: "KE", dial: "254" },
  { iso: "PK", dial: "92" },
  { iso: "BD", dial: "880" },
  { iso: "LK", dial: "94" },
  { iso: "NP", dial: "977" },
  { iso: "AF", dial: "93" },
  { iso: "IR", dial: "98" },
  { iso: "IQ", dial: "964" },
  { iso: "JO", dial: "962" },
  { iso: "LB", dial: "961" },
  { iso: "SY", dial: "963" },
  { iso: "PS", dial: "970" },
  { iso: "MA", dial: "212" },
  { iso: "TN", dial: "216" },
  { iso: "DZ", dial: "213" },
  { iso: "LY", dial: "218" },
  { iso: "GH", dial: "233" },
  { iso: "ET", dial: "251" },
  { iso: "TZ", dial: "255" },
  { iso: "UG", dial: "256" },
  { iso: "AO", dial: "244" },
  { iso: "CM", dial: "237" },
  { iso: "SN", dial: "221" },
  { iso: "CI", dial: "225" },
  { iso: "MG", dial: "261" },
  { iso: "MU", dial: "230" },
  { iso: "MN", dial: "976" },
  { iso: "KZ", dial: "7" },
  { iso: "UZ", dial: "998" },
  { iso: "GE", dial: "995" },
  { iso: "AM", dial: "374" },
  { iso: "AZ", dial: "994" },
  { iso: "BY", dial: "375" },
  { iso: "MD", dial: "373" },
  { iso: "RS", dial: "381" },
  { iso: "HR", dial: "385" },
  { iso: "SI", dial: "386" },
  { iso: "SK", dial: "421" },
  { iso: "BG", dial: "359" },
  { iso: "LT", dial: "370" },
  { iso: "LV", dial: "371" },
  { iso: "EE", dial: "372" },
  { iso: "IS", dial: "354" },
  { iso: "LU", dial: "352" },
  { iso: "MT", dial: "356" },
  { iso: "CY", dial: "357" },
  { iso: "AL", dial: "355" },
  { iso: "MK", dial: "389" },
  { iso: "BA", dial: "387" },
  { iso: "ME", dial: "382" },
  { iso: "XK", dial: "383" },
  { iso: "AD", dial: "376" },
  { iso: "MC", dial: "377" },
  { iso: "LI", dial: "423" },
  { iso: "SM", dial: "378" },
  { iso: "VA", dial: "379" },
  { iso: "GL", dial: "299" },
  { iso: "FO", dial: "298" },
  { iso: "GI", dial: "350" },
  { iso: "PR", dial: "1" },
  { iso: "DO", dial: "1" },
  { iso: "GT", dial: "502" },
  { iso: "CR", dial: "506" },
  { iso: "PA", dial: "507" },
  { iso: "HN", dial: "504" },
  { iso: "SV", dial: "503" },
  { iso: "NI", dial: "505" },
  { iso: "CU", dial: "53" },
  { iso: "JM", dial: "1" },
  { iso: "TT", dial: "1" },
  { iso: "BS", dial: "1" },
  { iso: "BB", dial: "1" },
  { iso: "UY", dial: "598" },
  { iso: "PY", dial: "595" },
  { iso: "BO", dial: "591" },
  { iso: "EC", dial: "593" },
  { iso: "VE", dial: "58" },
  { iso: "GY", dial: "592" },
  { iso: "SR", dial: "597" },
  { iso: "FJ", dial: "679" },
  { iso: "PG", dial: "675" },
  { iso: "NC", dial: "687" },
  { iso: "PF", dial: "689" },
  { iso: "WS", dial: "685" },
  { iso: "TO", dial: "676" },
  { iso: "GU", dial: "1" },
  { iso: "MP", dial: "1" },
  { iso: "AS", dial: "1" },
  { iso: "MV", dial: "960" },
  { iso: "BT", dial: "975" },
  { iso: "TL", dial: "670" },
  { iso: "KP", dial: "850" },
]

const COUNTRY_BY_ISO = new Map(
  COUNTRY_DIAL_CODES.map((country) => [country.iso, country])
)

export function findCountryDialCode(iso: string) {
  return COUNTRY_BY_ISO.get(iso.trim().toUpperCase()) ?? null
}

export function countryFlagUrl(iso: string, width = 40) {
  return `https://flagcdn.com/w${width}/${iso.trim().toLowerCase()}.png`
}

const displayNames = new Map<string, Intl.DisplayNames>()

export function countryDisplayName(iso: string, locale: string) {
  const language = locale.startsWith("en") ? "en" : "vi"
  let names = displayNames.get(language)
  if (!names) {
    names = new Intl.DisplayNames([language], { type: "region" })
    displayNames.set(language, names)
  }
  return names.of(iso.trim().toUpperCase()) ?? iso.trim().toUpperCase()
}

function collatorFor(locale: string) {
  return new Intl.Collator(locale.startsWith("en") ? "en" : "vi", {
    sensitivity: "base",
  })
}

export function countriesForLocale(locale: string) {
  const compare = collatorFor(locale)
  const rest = COUNTRY_DIAL_CODES.filter(
    (country) => country.iso !== DEFAULT_COUNTRY_ISO
  ).sort((a, b) =>
    compare.compare(
      countryDisplayName(a.iso, locale),
      countryDisplayName(b.iso, locale)
    )
  )
  const vietnam = findCountryDialCode(DEFAULT_COUNTRY_ISO)
  return vietnam ? [vietnam, ...rest] : rest
}

export function formatInternationalPhone(dial: string, local: string) {
  const compact = local.replace(/[^\d+]/g, "")
  if (!compact) return ""
  if (compact.startsWith("+")) return compact

  const dialDigits = dial.replace(/\D/g, "")
  const localDigits = compact.replace(/^0+/, "")
  if (!localDigits) return ""
  if (dialDigits && localDigits.startsWith(dialDigits)) {
    return `+${localDigits}`
  }
  return dialDigits ? `+${dialDigits}${localDigits}` : localDigits
}
