export const BLOG_STATUSES = ["published", "scheduled", "draft"] as const

export type BlogStatus = (typeof BLOG_STATUSES)[number]

export type AdminBlogListItem = {
  id: string
  slug: string
  title: string
  thumbnail: string
  category: string
  status: BlogStatus
  scheduledAt: string | null
}

export const BLOG_STATUS_LABELS: Record<BlogStatus, string> = {
  published: "Đã đăng",
  scheduled: "Đã lên lịch",
  draft: "Draft",
}

export const BLOG_CATEGORIES = [
  { value: "Xu hướng", label: "Xu hướng" },
  { value: "Kinh nghiệm", label: "Kinh nghiệm" },
  { value: "Phụ kiện", label: "Phụ kiện" },
  { value: "Behind the scenes", label: "Behind the scenes" },
] as const

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

type SourceBlogPost = {
  slug: string
  title: string
  image: string
}

const SITE_POST_CATEGORIES: Record<string, string> = {
  "short-midi-wedding-dresses-2026": "Xu hướng",
  "wedding-dress-trends-2026": "Xu hướng",
}

const EXTRA_POSTS: AdminBlogListItem[] = [
  {
    id: "bridal-accessories-2026",
    slug: "bridal-accessories-2026",
    title: "Phụ kiện cô dâu 2026: Voan, trang sức và điểm nhấn cho ngày lễ",
    thumbnail:
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
    category: "Phụ kiện",
    status: "scheduled",
    scheduledAt: "2026-09-18T02:00:00.000Z",
  },
  {
    id: "fitting-day-checklist",
    slug: "fitting-day-checklist",
    title: "Checklist buổi fitting: Những điều cô dâu nên chuẩn bị",
    thumbnail:
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    category: "Kinh nghiệm",
    status: "draft",
    scheduledAt: null,
  },
  {
    id: "behind-atelier-linhouse",
    slug: "behind-atelier-linhouse",
    title: "Behind the scenes: Một ngày tại atelier LINHouse",
    thumbnail:
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80",
    category: "Behind the scenes",
    status: "published",
    scheduledAt: null,
  },
  {
    id: "garden-wedding-lookbook",
    slug: "garden-wedding-lookbook",
    title: "Lookbook tiệc cưới sân vườn: Dáng váy và chất liệu nên chọn",
    thumbnail:
      "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1200&q=80",
    category: "Xu hướng",
    status: "scheduled",
    scheduledAt: "2026-09-24T04:30:00.000Z",
  },
  {
    id: "ao-dai-cuoi-hien-dai",
    slug: "ao-dai-cuoi-hien-dai",
    title: "Áo dài cưới hiện đại: Giữ nét truyền thống, mặc cho ngày mới",
    thumbnail:
      "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1200&q=80",
    category: "Kinh nghiệm",
    status: "draft",
    scheduledAt: null,
  },
]

export function toAdminBlogListItems(posts: SourceBlogPost[]): AdminBlogListItem[] {
  const fromSite = posts.map((post) => ({
    id: post.slug,
    slug: post.slug,
    title: post.title,
    thumbnail: post.image,
    category: SITE_POST_CATEGORIES[post.slug] ?? "Xu hướng",
    status: "published" as const,
    scheduledAt: null,
  }))

  const existingSlugs = new Set(fromSite.map((post) => post.slug))

  return [
    ...fromSite,
    ...EXTRA_POSTS.filter((post) => !existingSlugs.has(post.slug)),
  ]
}

export function findAdminBlogPost(
  posts: AdminBlogListItem[],
  slug: string
): AdminBlogListItem | undefined {
  return posts.find((post) => post.slug === slug)
}

export function formatScheduledAt(iso: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(iso))
}
