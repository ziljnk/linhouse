import { createStore, del, get, keys, setMany } from "idb-keyval"

export const ADMIN_DRAFT_ENTITIES = ["blog", "product", "collection"] as const

export type AdminDraftEntity = (typeof ADMIN_DRAFT_ENTITIES)[number]

export const ADMIN_DRAFT_ENTITY_LABELS: Record<AdminDraftEntity, string> = {
  blog: "Bài viết",
  product: "Sản phẩm",
  collection: "Bộ sưu tập",
}

export const DRAFT_IMAGE_MISSING_MESSAGE =
  "Ảnh bìa chưa được lưu nháp – vui lòng chọn lại khi khôi phục."

export const SESSION_EXPIRED_MESSAGE =
  "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để lưu – nội dung của bạn vẫn được giữ."

const DB_NAME = "linhouse-admin-drafts"
const STORE_NAME = "drafts"

const store = createStore(DB_NAME, STORE_NAME)

const listeners = new Set<() => void>()
let channel: BroadcastChannel | null = null

export type StoredDraftImage = {
  name: string
  remoteUrl: string | null
  blob: Blob | null
  mime: string | null
  missing: boolean
}

export type AdminDraftMeta<T = Record<string, unknown>> = {
  userId: string
  entity: AdminDraftEntity
  recordId: string
  openPath: string
  title: string
  savedAt: string
  baselineUpdatedAt: string | null
  fields: T
  imageMissing: boolean
}

export type AdminDraft<T = Record<string, unknown>> = AdminDraftMeta<T> & {
  images: Record<string, StoredDraftImage[]>
}

type SaveAdminDraftInput<T> = {
  userId: string
  entity: AdminDraftEntity
  recordId: string
  openPath: string
  title: string
  baselineUpdatedAt: string | null
  fields: T
  images: Record<string, StoredDraftImage[]>
}

function canUseIdb() {
  return typeof indexedDB !== "undefined"
}

function scopeKey(userId: string, entity: AdminDraftEntity, recordId: string) {
  return `${userId}:${entity}:${recordId}`
}

function metaKey(scope: string) {
  return `meta:${scope}`
}

function imageKey(scope: string) {
  return `img:${scope}`
}

function isQuotaError(error: unknown) {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  )
}

function withoutBlobs(images: Record<string, StoredDraftImage[]>) {
  const next: Record<string, StoredDraftImage[]> = {}
  for (const [slot, list] of Object.entries(images)) {
    next[slot] = list.map((item) =>
      item.blob ? { ...item, blob: null, missing: true } : item
    )
  }
  return next
}

function ensureChannel() {
  if (channel || typeof BroadcastChannel === "undefined") return
  channel = new BroadcastChannel("linhouse-admin-drafts")
  channel.onmessage = () => {
    for (const listener of listeners) listener()
  }
}

function emitDraftsChanged() {
  for (const listener of listeners) listener()
  ensureChannel()
  channel?.postMessage("changed")
}

export function subscribeDrafts(listener: () => void) {
  listeners.add(listener)
  ensureChannel()
  return () => {
    listeners.delete(listener)
  }
}

export function formatDraftStamp(iso: string, withDate = true) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  if (!withDate) return `${hours}:${minutes}`
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  return `${hours}:${minutes}, ${day}/${month}`
}

export function draftOpenHref(draft: Pick<AdminDraftMeta, "openPath">) {
  const path = draft.openPath
  return path.includes("?") ? `${path}&restore=1` : `${path}?restore=1`
}

export function newerThanDraft(
  recordUpdatedAt: string | null | undefined,
  draftUpdatedAt: string | null | undefined
) {
  if (!recordUpdatedAt || !draftUpdatedAt) return false
  const current = new Date(recordUpdatedAt).getTime()
  const stored = new Date(draftUpdatedAt).getTime()
  if (Number.isNaN(current) || Number.isNaN(stored)) return false
  return current > stored
}

export async function readAdminDraft<T = Record<string, unknown>>(
  userId: string,
  entity: AdminDraftEntity,
  recordId: string
): Promise<AdminDraft<T> | null> {
  if (!canUseIdb()) return null
  const scope = scopeKey(userId, entity, recordId)
  const meta = await get<AdminDraftMeta<T>>(metaKey(scope), store)
  if (!meta) return null
  const images =
    (await get<Record<string, StoredDraftImage[]>>(imageKey(scope), store)) ??
    {}
  return { ...meta, images }
}

export async function listUserDraftMetas(
  userId: string
): Promise<AdminDraftMeta[]> {
  if (!canUseIdb()) return []
  const prefix = `meta:${userId}:`
  const allKeys = await keys(store)
  const metaKeys = allKeys.filter(
    (key): key is string => typeof key === "string" && key.startsWith(prefix)
  )
  if (metaKeys.length === 0) return []
  const rows = await Promise.all(
    metaKeys.map((key) => get<AdminDraftMeta>(key, store))
  )
  return rows
    .filter((row): row is AdminDraftMeta => Boolean(row))
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
}

export async function saveAdminDraft<T>(
  input: SaveAdminDraftInput<T>
): Promise<{ imageMissing: boolean }> {
  if (!canUseIdb()) return { imageMissing: false }
  const scope = scopeKey(input.userId, input.entity, input.recordId)
  const savedAt = new Date().toISOString()
  const base: AdminDraftMeta<T> = {
    userId: input.userId,
    entity: input.entity,
    recordId: input.recordId,
    openPath: input.openPath,
    title: input.title,
    savedAt,
    baselineUpdatedAt: input.baselineUpdatedAt,
    fields: input.fields,
    imageMissing: false,
  }

  try {
    await setMany(
      [
        [imageKey(scope), input.images],
        [metaKey(scope), base],
      ],
      store
    )
    emitDraftsChanged()
    return { imageMissing: false }
  } catch (error) {
    if (!isQuotaError(error)) throw error
    const stripped = withoutBlobs(input.images)
    const meta: AdminDraftMeta<T> = { ...base, imageMissing: true }
    try {
      await setMany(
        [
          [imageKey(scope), stripped],
          [metaKey(scope), meta],
        ],
        store
      )
    } catch {
      await setMany([[metaKey(scope), meta]], store)
      await del(imageKey(scope), store)
    }
    emitDraftsChanged()
    return { imageMissing: true }
  }
}

export async function deleteAdminDraft(
  userId: string,
  entity: AdminDraftEntity,
  recordId: string
) {
  if (!canUseIdb()) return
  const scope = scopeKey(userId, entity, recordId)
  await del(metaKey(scope), store)
  await del(imageKey(scope), store)
  emitDraftsChanged()
}

export async function clearUserDrafts(userId: string) {
  const metas = await listUserDraftMetas(userId)
  await Promise.all(
    metas.map((meta) => deleteAdminDraft(userId, meta.entity, meta.recordId))
  )
}
