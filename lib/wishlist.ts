"use client"

import { useSyncExternalStore } from "react"

export type WishlistItem = {
  slug: string
  name: string
  image: string
  addedAt: number
}

const STORAGE_KEY = "linhouse.wishlist:v1"
const EMPTY: WishlistItem[] = []

let memory: WishlistItem[] | null = null
let storageBound = false
const listeners = new Set<() => void>()

function canUseStorage() {
  return typeof window !== "undefined"
}

function isWishlistItem(value: unknown): value is WishlistItem {
  if (!value || typeof value !== "object") return false

  const item = value as Record<string, unknown>
  return (
    typeof item.slug === "string" &&
    item.slug.length > 0 &&
    typeof item.name === "string" &&
    typeof item.image === "string" &&
    typeof item.addedAt === "number"
  )
}

function parse(raw: string | null): WishlistItem[] {
  if (!raw) return EMPTY

  try {
    const data = JSON.parse(raw)
    if (!Array.isArray(data)) return EMPTY
    const items = data.filter(isWishlistItem)
    return items.length === 0 ? EMPTY : items
  } catch {
    return EMPTY
  }
}

function readFromStorage(): WishlistItem[] {
  if (!canUseStorage()) return EMPTY

  try {
    return parse(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    return EMPTY
  }
}

function notify() {
  listeners.forEach((listener) => listener())
}

function onStorage(event: StorageEvent) {
  if (event.key && event.key !== STORAGE_KEY) return
  memory = readFromStorage()
  notify()
}

function bindStorageListener() {
  if (storageBound || !canUseStorage()) return
  storageBound = true
  window.addEventListener("storage", onStorage)
}

function getSnapshot() {
  if (memory === null) memory = readFromStorage()
  return memory
}

function getServerSnapshot() {
  return EMPTY
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  bindStorageListener()

  return () => {
    listeners.delete(listener)
  }
}

function write(items: WishlistItem[]) {
  memory = items.length === 0 ? EMPTY : items

  if (canUseStorage()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memory))
    } catch {
      // Private browsing, quota exceeded, or storage disabled.
    }
  }

  notify()
}

export function useWishlist() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function isInWishlist(slug: string, items = getSnapshot()) {
  return items.some((item) => item.slug === slug)
}

export function toggleWishlistItem(item: Omit<WishlistItem, "addedAt">) {
  const current = getSnapshot()
  if (isInWishlist(item.slug, current)) {
    write(current.filter((entry) => entry.slug !== item.slug))
    return false
  }

  write([{ ...item, addedAt: Date.now() }, ...current])
  return true
}

export function removeWishlistItem(slug: string) {
  write(getSnapshot().filter((item) => item.slug !== slug))
}
