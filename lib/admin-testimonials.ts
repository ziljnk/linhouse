import type { Dictionary } from "@/app/[locale]/dictionaries"

export const TESTIMONIAL_STATUSES = ["published", "draft"] as const

export type TestimonialStatus = (typeof TESTIMONIAL_STATUSES)[number]

export type AdminTestimonial = {
  id: string
  slug: string
  name: string
  quoteVi: string
  quoteEn: string
  image: string
  imageAltVi: string
  imageAltEn: string
  gown: string
  year: string
  status: TestimonialStatus
}

export type TestimonialsSectionCopy = {
  labelVi: string
  labelEn: string
  titleVi: string
  titleEn: string
}

export const TESTIMONIAL_STATUS_LABELS: Record<TestimonialStatus, string> = {
  published: "Đã đăng",
  draft: "Draft",
}

type TestimonialItem = Dictionary["home"]["testimonials"]["items"][number]

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("đ", "d")
    .replaceAll("Đ", "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function metaValue(item: TestimonialItem, labels: string[]) {
  const match = item.meta.find((row) => labels.includes(row.label))
  return match?.value ?? ""
}

export function toTestimonialsSectionCopy(
  vi: Dictionary["home"]["testimonials"],
  en: Dictionary["home"]["testimonials"]
): TestimonialsSectionCopy {
  return {
    labelVi: vi.label,
    labelEn: en.label,
    titleVi: vi.title,
    titleEn: en.title,
  }
}

export function toAdminTestimonials(
  viItems: TestimonialItem[],
  enItems: TestimonialItem[]
): AdminTestimonial[] {
  return viItems.map((item, index) => {
    const english =
      enItems.find((entry) => entry.name === item.name) ?? enItems[index]

    return {
      id: slugify(item.name),
      slug: slugify(item.name),
      name: item.name,
      quoteVi: item.quote,
      quoteEn: english?.quote ?? "",
      image: item.image,
      imageAltVi: item.imageAlt,
      imageAltEn: english?.imageAlt ?? item.imageAlt,
      gown: metaValue(item, ["Váy", "Gown"]),
      year: metaValue(item, ["Năm", "Year"]),
      status: "published",
    }
  })
}

export function findAdminTestimonial(
  testimonials: AdminTestimonial[],
  slug: string
): AdminTestimonial | undefined {
  return testimonials.find((item) => item.slug === slug)
}
