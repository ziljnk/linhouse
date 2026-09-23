export const MAX_ABOUT_MILESTONES = 12
export const MAX_ABOUT_FAQ_ITEMS = 20
export const ABOUT_MILESTONE_YEAR_MAX = 40
export const ABOUT_MILESTONE_TITLE_MAX = 400
export const ABOUT_MILESTONE_BODY_MAX = 2000
export const ABOUT_MILESTONE_ALT_MAX = 400
export const ABOUT_FAQ_QUESTION_MAX = 400
export const ABOUT_FAQ_ANSWER_MAX = 2000
export const DEFAULT_ABOUT_MILESTONE_IMAGE = "/hero/bridal.webp"

export type AboutContentPair = { vi: string; en: string }

export type AboutMilestoneDraft = {
  year: AboutContentPair
  title: AboutContentPair
  body: AboutContentPair
  imageAlt: AboutContentPair
  image: string
}

export type AboutFaqItemDraft = {
  question: AboutContentPair
  answer: AboutContentPair
}

const MILESTONE_KEY = /^about\.milestone\.(\d+)\.(year|title|body|imageAlt|image)$/
const FAQ_ITEM_KEY = /^about\.faq\.(\d+)\.(question|answer)$/

const emptyPair = (): AboutContentPair => ({ vi: "", en: "" })

export function aboutMilestoneKey(
  index: number,
  part: "year" | "title" | "body" | "imageAlt" | "image"
) {
  return `about.milestone.${index}.${part}`
}

export function aboutFaqItemKey(index: number, part: "question" | "answer") {
  return `about.faq.${index}.${part}`
}

function indexes(values: Record<string, AboutContentPair>, pattern: RegExp) {
  const found = new Set<number>()
  for (const key of Object.keys(values)) {
    const match = pattern.exec(key)
    if (!match) continue
    found.add(Number(match[1]))
  }
  return [...found].sort((left, right) => left - right)
}

export function aboutMilestonesFrom(values: Record<string, AboutContentPair>) {
  return indexes(values, MILESTONE_KEY).map((index) => {
    const image = values[aboutMilestoneKey(index, "image")]
    return {
      year: values[aboutMilestoneKey(index, "year")] ?? emptyPair(),
      title: values[aboutMilestoneKey(index, "title")] ?? emptyPair(),
      body: values[aboutMilestoneKey(index, "body")] ?? emptyPair(),
      imageAlt: values[aboutMilestoneKey(index, "imageAlt")] ?? emptyPair(),
      image: image?.vi.trim() || image?.en.trim() || DEFAULT_ABOUT_MILESTONE_IMAGE,
    }
  })
}

export function withAboutMilestones<T extends Record<string, AboutContentPair>>(
  values: T,
  milestones: AboutMilestoneDraft[]
): T {
  const next = Object.fromEntries(
    Object.entries(values).filter(([key]) => !key.startsWith("about.milestone."))
  ) as T

  milestones.forEach((milestone, index) => {
    next[aboutMilestoneKey(index, "year") as keyof T] = { ...milestone.year } as T[keyof T]
    next[aboutMilestoneKey(index, "title") as keyof T] = { ...milestone.title } as T[keyof T]
    next[aboutMilestoneKey(index, "body") as keyof T] = { ...milestone.body } as T[keyof T]
    next[aboutMilestoneKey(index, "imageAlt") as keyof T] = {
      ...milestone.imageAlt,
    } as T[keyof T]
    next[aboutMilestoneKey(index, "image") as keyof T] = {
      vi: milestone.image,
      en: milestone.image,
    } as T[keyof T]
  })

  return next
}

export function aboutFaqItemsFrom(values: Record<string, AboutContentPair>) {
  return indexes(values, FAQ_ITEM_KEY).map((index) => ({
    question: values[aboutFaqItemKey(index, "question")] ?? emptyPair(),
    answer: values[aboutFaqItemKey(index, "answer")] ?? emptyPair(),
  }))
}

export function withAboutFaqItems<T extends Record<string, AboutContentPair>>(
  values: T,
  items: AboutFaqItemDraft[]
): T {
  const next = Object.fromEntries(
    Object.entries(values).filter(([key]) => !FAQ_ITEM_KEY.test(key))
  ) as T

  items.forEach((item, index) => {
    next[aboutFaqItemKey(index, "question") as keyof T] = { ...item.question } as T[keyof T]
    next[aboutFaqItemKey(index, "answer") as keyof T] = { ...item.answer } as T[keyof T]
  })

  return next
}
