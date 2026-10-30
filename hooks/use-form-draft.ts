"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { authClient } from "@/lib/auth-client"
import {
  deleteAdminDraft,
  listUserDraftMetas,
  readAdminDraft,
  saveAdminDraft,
  subscribeDrafts,
  type AdminDraft,
  type AdminDraftEntity,
  type AdminDraftMeta,
  type StoredDraftImage,
} from "@/lib/admin-drafts"
import {
  createUploadedImageFromUrl,
  type UploadedImage,
} from "@/components/admin/image-uploader"

export type DraftImageMap = Record<string, UploadedImage[]>

export type RestoredFormDraft<T> = {
  fields: T
  images: DraftImageMap
  imageMissing: boolean
}

type UseFormDraftOptions<T extends Record<string, unknown>> = {
  entity: AdminDraftEntity
  recordId?: string | null
  openPath: string
  title: string
  baselineUpdatedAt?: string | null
  fields: T
  images: DraftImageMap
  onRestore?: (draft: RestoredFormDraft<T>) => void
}

function imageSignature(images: DraftImageMap) {
  return JSON.stringify(
    Object.entries(images).map(([slot, list]) => [
      slot,
      list.map((image) => ({
        name: image.name,
        remote: image.file || image.url.startsWith("blob:") ? null : image.url,
        size: image.file?.size ?? null,
        modified: image.file?.lastModified ?? null,
      })),
    ])
  )
}

function toStoredImages(images: UploadedImage[]): StoredDraftImage[] {
  return images.map((image) => ({
    name: image.name,
    remoteUrl:
      image.file || image.url.startsWith("blob:") ? null : image.url || null,
    blob: image.file,
    mime: image.file?.type ?? null,
    missing: false,
  }))
}

function toUploadedImages(images: StoredDraftImage[]) {
  const restored: UploadedImage[] = []
  for (const image of images) {
    if (image.blob && !image.missing) {
      const file =
        image.blob instanceof File
          ? image.blob
          : new File([image.blob], image.name || "image", {
              type: image.mime || image.blob.type || "image/jpeg",
            })
      restored.push({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
        name: file.name,
      })
      continue
    }
    if (image.remoteUrl) {
      restored.push(
        createUploadedImageFromUrl(image.remoteUrl, image.name || "image")
      )
    }
  }
  return restored
}

function materialize<T>(draft: AdminDraft<T>): RestoredFormDraft<T> {
  const images: DraftImageMap = {}
  for (const [slot, list] of Object.entries(draft.images)) {
    images[slot] = toUploadedImages(list)
  }
  return {
    fields: draft.fields,
    images,
    imageMissing: draft.imageMissing,
  }
}

export function revokeUploadedImages(images: UploadedImage[]) {
  for (const image of images) {
    if (image.url.startsWith("blob:")) URL.revokeObjectURL(image.url)
  }
}

export function useFormDraft<T extends Record<string, unknown>>({
  entity,
  recordId,
  openPath,
  title,
  baselineUpdatedAt = null,
  fields,
  images,
  onRestore,
}: UseFormDraftOptions<T>) {
  const recordKey = recordId?.trim() ? recordId : "new"
  const { data: session } = authClient.useSession()
  const sessionUserId = session?.user?.id ?? null
  const [userId, setUserId] = useState<string | null>(sessionUserId)
  if (sessionUserId && userId !== sessionUserId) setUserId(sessionUserId)
  const [ready, setReady] = useState(false)
  const [offer, setOffer] = useState<AdminDraft<T> | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [imageMissing, setImageMissing] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)

  const fieldsJson = JSON.stringify(fields)
  const imagesJson = imageSignature(images)
  const signature = `${fieldsJson}\n${imagesJson}`

  const baselineRef = useRef<string | null>(null)
  const userIdRef = useRef<string | null>(userId)
  const signatureRef = useRef(signature)
  const imagesRef = useRef(images)
  const fieldsRef = useRef(fields)
  const titleRef = useRef(title)
  const openPathRef = useRef(openPath)
  const baselineUpdatedAtRef = useRef(baselineUpdatedAt)
  const entityRef = useRef(entity)
  const recordKeyRef = useRef(recordKey)
  const readyRef = useRef(ready)
  const holdRef = useRef(false)
  const retiredRef = useRef(false)
  const offerRef = useRef(offer)
  const onRestoreRef = useRef(onRestore)
  const lastImagesJsonRef = useRef<string | null>(null)
  const didAutoRestore = useRef(false)

  const saveNow = useCallback(async () => {
    const currentUserId = userIdRef.current
    if (!currentUserId || retiredRef.current || holdRef.current) return
    if (signatureRef.current === baselineRef.current) return
    try {
      const storedImages: Record<string, StoredDraftImage[]> = {}
      for (const [slot, list] of Object.entries(imagesRef.current)) {
        storedImages[slot] = toStoredImages(list)
      }
      const result = await saveAdminDraft({
        userId: currentUserId,
        entity: entityRef.current,
        recordId: recordKeyRef.current,
        openPath: openPathRef.current,
        title: titleRef.current.trim() || "Chưa có tiêu đề",
        baselineUpdatedAt: baselineUpdatedAtRef.current,
        fields: fieldsRef.current,
        images: storedImages,
      })
      if (retiredRef.current) return
      setSavedAt(new Date().toISOString())
      setImageMissing(result.imageMissing)
    } catch (error) {
      console.error("Could not save admin draft", error)
    }
  }, [])

  const saveNowRef = useRef(saveNow)

  useEffect(() => {
    if (baselineRef.current === null) baselineRef.current = signature
    userIdRef.current = userId
    signatureRef.current = signature
    imagesRef.current = images
    fieldsRef.current = fields
    titleRef.current = title
    openPathRef.current = openPath
    baselineUpdatedAtRef.current = baselineUpdatedAt
    entityRef.current = entity
    recordKeyRef.current = recordKey
    readyRef.current = ready
    offerRef.current = offer
    onRestoreRef.current = onRestore
    saveNowRef.current = saveNow
  })

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    const shouldAutoRestore =
      new URLSearchParams(window.location.search).get("restore") === "1"
    void readAdminDraft<T>(userId, entity, recordKey).then((draft) => {
      if (cancelled || retiredRef.current) return
      if (draft && shouldAutoRestore && !didAutoRestore.current) {
        didAutoRestore.current = true
        holdRef.current = false
        onRestoreRef.current?.(materialize(draft))
        setSavedAt(draft.savedAt)
        setImageMissing(draft.imageMissing)
      } else if (draft) {
        holdRef.current = true
        setOffer(draft)
        setImageMissing(draft.imageMissing)
      }
      setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [userId, entity, recordKey])

  useEffect(() => {
    if (!ready) return
    if (lastImagesJsonRef.current === null) {
      lastImagesJsonRef.current = imagesJson
    }
    if (signature === baselineRef.current || holdRef.current) {
      lastImagesJsonRef.current = imagesJson
      return
    }
    const imagesChanged = imagesJson !== lastImagesJsonRef.current
    lastImagesJsonRef.current = imagesJson
    const pickedFile = Object.values(imagesRef.current).some((list) =>
      list.some((image) => image.file)
    )
    if (imagesChanged && pickedFile) {
      void saveNowRef.current()
      return
    }
    const timer = window.setTimeout(() => {
      void saveNowRef.current()
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [ready, signature, imagesJson])

  useEffect(() => {
    const persist = () => {
      if (!readyRef.current || retiredRef.current || holdRef.current) return
      if (signatureRef.current === baselineRef.current) return
      void saveNowRef.current()
    }
    const onVisibility = () => {
      if (document.visibilityState === "hidden") persist()
    }
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("pagehide", persist)
    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("pagehide", persist)
    }
  }, [])

  const flush = useCallback(async () => {
    if (retiredRef.current) return
    if (signatureRef.current === baselineRef.current) return
    holdRef.current = false
    await saveNowRef.current()
    if (!retiredRef.current) setOffer(null)
  }, [])

  const discard = useCallback(async () => {
    holdRef.current = false
    setOffer(null)
    const currentUserId = userIdRef.current
    if (!currentUserId) return
    await deleteAdminDraft(currentUserId, entityRef.current, recordKeyRef.current)
    if (!retiredRef.current && signatureRef.current !== baselineRef.current) {
      await saveNowRef.current()
    }
  }, [])

  const clear = useCallback(async () => {
    retiredRef.current = true
    holdRef.current = false
    setOffer(null)
    setSavedAt(null)
    setImageMissing(false)
    const currentUserId = userIdRef.current
    if (currentUserId) {
      await deleteAdminDraft(currentUserId, entityRef.current, recordKeyRef.current)
    }
    baselineRef.current = signatureRef.current
    retiredRef.current = false
  }, [])

  const restore = useCallback(() => {
    const current = offerRef.current
    if (!current) return null
    holdRef.current = false
    setOffer(null)
    setSavedAt(current.savedAt)
    setImageMissing(current.imageMissing)
    return materialize(current)
  }, [])

  return {
    offer,
    savedAt,
    imageMissing: offer ? offer.imageMissing : imageMissing,
    sessionExpired,
    markSessionExpired: () => setSessionExpired(true),
    restore,
    discard,
    flush,
    clear,
  }
}

export function useUserDraftMetas() {
  const { data } = authClient.useSession()
  const userId = data?.user?.id ?? null
  const [drafts, setDrafts] = useState<AdminDraftMeta[]>([])

  useEffect(() => {
    if (!userId) return
    let active = true
    const load = () => {
      void listUserDraftMetas(userId).then((rows) => {
        if (active) setDrafts(rows)
      })
    }
    load()
    const unsubscribe = subscribeDrafts(load)
    return () => {
      active = false
      unsubscribe()
    }
  }, [userId])

  return userId ? drafts : []
}
