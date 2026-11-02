const MAX_REFERRER_LENGTH = 500
const MAX_SOURCE_LENGTH = 40

const SOURCE_PATTERN = /^[a-z0-9._-]+$/

/** Inbound utm_source tokens, including short aliases, mapped to one stored value. */
const UTM_SOURCE_ALIASES = {
  facebook: "facebook",
  fb: "facebook",
  instagram: "instagram",
  ig: "instagram",
  tiktok: "tiktok",
  zalo: "zalo",
  youtube: "youtube",
  yt: "youtube",
  messenger: "messenger",
  threads: "threads",
  pinterest: "pinterest",
} as const

export type TrackedUtmSource = (typeof UTM_SOURCE_ALIASES)[keyof typeof UTM_SOURCE_ALIASES]

/** Host stored in referrerHost so tagged visits merge with real referrer rows. */
export const TRACKED_SOURCE_HOSTS: Record<TrackedUtmSource, string> = {
  facebook: "facebook.com",
  instagram: "instagram.com",
  tiktok: "tiktok.com",
  zalo: "zalo.me",
  youtube: "youtube.com",
  messenger: "messenger.com",
  threads: "threads.net",
  pinterest: "pinterest.com",
}

const REFERRER_HOST_ALIASES: Record<string, string> = {
  "l.facebook.com": "facebook.com",
  "m.facebook.com": "facebook.com",
  "lm.facebook.com": "facebook.com",
  "l.instagram.com": "instagram.com",
  "vm.tiktok.com": "tiktok.com",
  "m.tiktok.com": "tiktok.com",
  "l.messenger.com": "messenger.com",
  "m.me": "messenger.com",
  "l.threads.net": "threads.net",
  "threads.com": "threads.net",
  "pin.it": "pinterest.com",
}

export function normalizeUtmSource(value: unknown): TrackedUtmSource | null {
  if (typeof value !== "string") return null
  const cleaned = value.trim().toLowerCase()
  if (!cleaned || cleaned.length > MAX_SOURCE_LENGTH) return null
  if (!SOURCE_PATTERN.test(cleaned)) return null
  return UTM_SOURCE_ALIASES[cleaned as keyof typeof UTM_SOURCE_ALIASES] ?? null
}

export function referrerHostForSource(source: unknown) {
  const token = normalizeUtmSource(source)
  return token ? TRACKED_SOURCE_HOSTS[token] : null
}

/** Keep the first valid tagged source. Later tags in the same visit do not replace it. */
export function firstTouchUtmSource(
  stored: string | null,
  fromUrl: string | null
): TrackedUtmSource | null {
  return normalizeUtmSource(stored) ?? normalizeUtmSource(fromUrl)
}

export function normalizeReferrerHost(hostname: string) {
  const bare = hostname.replace(/^www\./i, "").toLowerCase()
  if (bare === "pinterest.com" || bare.endsWith(".pinterest.com")) {
    return "pinterest.com"
  }
  return REFERRER_HOST_ALIASES[bare] ?? bare
}

export function referrerHostFrom(referrer: string, siteHost: string) {
  const value = referrer.trim().slice(0, MAX_REFERRER_LENGTH)
  if (!value) return "(direct)"

  try {
    const url = new URL(value)
    const incoming = normalizeReferrerHost(url.hostname)
    const site = siteHost.replace(/^www\./i, "").toLowerCase().split(":")[0]
    if (!incoming || incoming === site) return "(direct)"
    return incoming.slice(0, 120)
  } catch {
    return "(direct)"
  }
}

export function resolvePageviewReferrerHost(input: {
  source?: unknown
  referrer?: string
  siteHost: string
}) {
  return (
    referrerHostForSource(input.source) ??
    referrerHostFrom(input.referrer ?? "", input.siteHost)
  )
}
