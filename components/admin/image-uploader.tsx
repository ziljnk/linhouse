"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, ImagePlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toastError } from "@/lib/admin-toast"
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_FILE_SIZE,
  validateImageFile,
} from "@/lib/image-file"
import { cmsImageDisplaySrc } from "@/lib/cms-image"
import { cn } from "@/lib/utils"

const DEFAULT_MAX_FILES = 24

export type UploadedImage = {
  id: string
  url: string
  file: File | null
  name: string
  height?: number
}

export type ProductImage = UploadedImage

type ImageUploaderProps = {
  images: UploadedImage[]
  onChange: (images: UploadedImage[]) => void
  maxFiles?: number
  aspect?: "portrait" | "landscape"
  sortHint?: string
  sizeHint?: string
  showCoverBadge?: boolean
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function revokeIfBlob(url: string) {
  if (url.startsWith("blob:")) URL.revokeObjectURL(url)
}

function revokeImages(images: UploadedImage[]) {
  for (const image of images) revokeIfBlob(image.url)
}

function toUploadedImage(file: File): UploadedImage {
  return {
    id: crypto.randomUUID(),
    file,
    url: URL.createObjectURL(file),
    name: file.name,
  }
}

export function createUploadedImageFromUrl(
  url: string,
  name = "cover",
  height?: number
): UploadedImage {
  return {
    id: crypto.randomUUID(),
    url,
    file: null,
    name,
    height,
  }
}

function aspectClass(aspect: "portrait" | "landscape") {
  return aspect === "landscape" ? "aspect-video" : "aspect-3/4"
}

export function ImageUploader({
  images,
  onChange,
  maxFiles = DEFAULT_MAX_FILES,
  aspect = "portrait",
  sortHint = "Kéo thả để sắp xếp lại. Ảnh đầu tiên sẽ là ảnh bìa.",
  sizeHint,
  showCoverBadge = true,
}: ImageUploaderProps) {
  const inputId = useId()
  const dndContextId = useId()
  const dragCountRef = useRef(0)
  const imagesRef = useRef(images)
  const [isDraggingFiles, setIsDraggingFiles] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const single = maxFiles === 1
  const current = images[0] ?? null

  useEffect(() => {
    imagesRef.current = images
  }, [images])

  useEffect(() => {
    return () => revokeImages(imagesRef.current)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const addFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const incoming = Array.from(fileList)
      if (incoming.length === 0) return

      const accepted: File[] = []
      let invalidType = 0
      let tooLarge = 0

      for (const file of incoming) {
        const validation = await validateImageFile(file, {
          maxSize: MAX_IMAGE_FILE_SIZE,
        })
        if (!validation.ok) {
          if (validation.reason === "size") tooLarge += 1
          else invalidType += 1
          continue
        }
        accepted.push(file)
      }

      const remaining = single ? 1 : Math.max(0, maxFiles - images.length)
      const overflow = Math.max(0, accepted.length - remaining)
      const nextFiles = accepted.slice(0, remaining)

      if (nextFiles.length > 0) {
        const nextImages = nextFiles.map(toUploadedImage)
        if (single) {
          revokeImages(images)
          onChange(nextImages)
        } else {
          onChange([...images, ...nextImages])
        }
      }

      if (invalidType || tooLarge || overflow) {
        const parts: string[] = []
        if (invalidType) {
          parts.push(
            single
              ? "tệp không phải ảnh hợp lệ"
              : `${invalidType} tệp không phải ảnh`
          )
        }
        if (tooLarge) {
          parts.push(
            single ? "ảnh vượt quá 10MB" : `${tooLarge} tệp vượt quá 10MB`
          )
        }
        if (overflow && !single) {
          parts.push(`chỉ còn chỗ cho ${remaining} ảnh`)
        }
        const message = single
          ? `${parts.join(". ")}.`
          : `Một số tệp bị bỏ qua: ${parts.join(", ")}.`
        setError(message)
        toastError(message)
      } else {
        setError(null)
      }
    },
    [images, maxFiles, onChange, single]
  )

  const hasFileDrag = (event: React.DragEvent) =>
    Array.from(event.dataTransfer.types).includes("Files")

  const handleDragEnter = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    if (!hasFileDrag(event)) return
    dragCountRef.current += 1
    setIsDraggingFiles(true)
  }

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    if (!hasFileDrag(event)) return
    event.dataTransfer.dropEffect = "copy"
  }

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    if (!hasFileDrag(event)) return
    dragCountRef.current -= 1
    if (dragCountRef.current <= 0) {
      dragCountRef.current = 0
      setIsDraggingFiles(false)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    dragCountRef.current = 0
    setIsDraggingFiles(false)
    addFiles(event.dataTransfer.files)
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(event.target.files ?? [])
    event.target.value = ""
  }

  const handleRemove = (id: string) => {
    const removed = images.find((image) => image.id === id)
    if (removed) revokeIfBlob(removed.url)
    onChange(images.filter((image) => image.id !== id))
    setError(null)
  }

  const handleClear = () => {
    revokeImages(images)
    onChange([])
    setError(null)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over || active.id === over.id) return

    const oldIndex = images.findIndex((image) => image.id === active.id)
    const newIndex = images.findIndex((image) => image.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    onChange(arrayMove(images, oldIndex, newIndex))
  }

  const activeImage = images.find((image) => image.id === activeId) ?? null
  const dropzone = (
    <Dropzone
      inputId={inputId}
      isDraggingFiles={isDraggingFiles}
      compact={single}
      maxFiles={maxFiles}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    />
  )

  return (
    <div className={cn("flex flex-col", single ? "gap-3" : "gap-4")}>
      <input
        id={inputId}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        multiple={!single}
        className="sr-only"
        onChange={handleInputChange}
      />

      {sizeHint ? (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          {sizeHint}
        </p>
      ) : null}

      {single && current ? (
        <SingleImagePreview
          image={current}
          inputId={inputId}
          aspect={aspect}
          onRemove={() => handleRemove(current.id)}
        />
      ) : (
        dropzone
      )}

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {single ? null : (
        <>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Xem trước</p>
              <p className="text-xs text-muted-foreground">{sortHint}</p>
            </div>
            {images.length > 0 ? (
              <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
                Xóa tất cả
              </Button>
            ) : null}
          </div>

          {images.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              Chưa có ảnh nào. Kéo thả hoặc chọn tệp ở trên.
            </div>
          ) : (
            <DndContext
              id={dndContextId}
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={() => setActiveId(null)}
            >
              <SortableContext
                items={images.map((image) => image.id)}
                strategy={rectSortingStrategy}
              >
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {images.map((image, index) => (
                    <SortableImageTile
                      key={image.id}
                      image={image}
                      index={index}
                      aspect={aspect}
                      showCoverBadge={showCoverBadge}
                      onRemove={handleRemove}
                    />
                  ))}
                </ul>
              </SortableContext>
              <DragOverlay>
                {activeImage ? (
                  <ImageTilePreview
                    image={activeImage}
                    aspect={aspect}
                    isCover={showCoverBadge && images[0]?.id === activeImage.id}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </>
      )}
    </div>
  )
}

function Dropzone({
  inputId,
  isDraggingFiles,
  compact,
  maxFiles,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  inputId: string
  isDraggingFiles: boolean
  compact: boolean
  maxFiles: number
  onDragEnter: (event: React.DragEvent<HTMLLabelElement>) => void
  onDragOver: (event: React.DragEvent<HTMLLabelElement>) => void
  onDragLeave: (event: React.DragEvent<HTMLLabelElement>) => void
  onDrop: (event: React.DragEvent<HTMLLabelElement>) => void
}) {
  return (
    <label
      htmlFor={inputId}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
        isDraggingFiles
          ? "border-primary bg-primary/5"
          : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/60"
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-background text-primary shadow-xs ring-1 ring-border">
        <ImagePlus className="size-5" />
      </span>
      <span className="space-y-1">
        <span className="block text-sm font-medium">
          {compact ? "Kéo thả ảnh bìa vào đây, hoặc " : "Kéo thả nhiều ảnh vào đây, hoặc "}
          <span className="text-primary underline-offset-4 hover:underline">
            chọn tệp
          </span>
        </span>
        <span className="block text-xs text-muted-foreground">
          {compact
            ? "JPG, PNG, WEBP, GIF, AVIF — tối đa 10MB."
            : `JPG, PNG, WEBP, GIF, AVIF — tối đa ${maxFiles} ảnh, mỗi ảnh 10MB.`}
        </span>
      </span>
    </label>
  )
}

function SingleImagePreview({
  image,
  inputId,
  aspect,
  onRemove,
}: {
  image: UploadedImage
  inputId: string
  aspect: "portrait" | "landscape"
  onRemove: () => void
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-muted">
      {/* Preview uses object URLs; next/image cannot optimize local blobs */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cmsImageDisplaySrc(image.url)}
        alt={image.name}
        className={cn("w-full object-cover", aspectClass(aspect))}
      />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-linear-to-t from-black/70 to-transparent px-3 pb-2 pt-10">
        <span className="truncate text-xs text-white/90">{image.name}</span>
        {image.file ? (
          <span className="shrink-0 text-[10px] text-white/80">
            {formatFileSize(image.file.size)}
          </span>
        ) : null}
      </div>
      <div className="absolute top-2 right-2 flex gap-1">
        <Button
          variant="secondary"
          size="sm"
          nativeButton={false}
          render={<label htmlFor={inputId} />}
        >
          Đổi ảnh
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon-xs"
          className="size-8 rounded-full bg-background/95 shadow-xs"
          aria-label={`Xóa ${image.name}`}
          onClick={onRemove}
        >
          <X className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

function SortableImageTile({
  image,
  index,
  aspect,
  showCoverBadge,
  onRemove,
}: {
  image: UploadedImage
  index: number
  aspect: "portrait" | "landscape"
  showCoverBadge: boolean
  onRemove: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id })

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn("relative", isDragging && "opacity-40")}
    >
      <div
        className="group relative cursor-grab overflow-hidden rounded-xl border border-border bg-muted touch-none active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <ImageTilePreview
          image={image}
          aspect={aspect}
          isCover={showCoverBadge && index === 0}
        />
        <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-background/90 px-1.5 py-0.5 text-[11px] font-medium text-foreground shadow-xs">
          <GripVertical className="size-3 text-muted-foreground" />
          {index + 1}
        </span>
      </div>
      <Button
        type="button"
        variant="secondary"
        size="icon-xs"
        className="absolute top-2 right-2 z-10 size-7 rounded-full bg-background/95 shadow-xs"
        aria-label={`Xóa ${image.name}`}
        onClick={() => onRemove(image.id)}
      >
        <X className="size-3.5" />
      </Button>
    </li>
  )
}

function ImageTilePreview({
  image,
  aspect,
  isCover,
}: {
  image: UploadedImage
  aspect: "portrait" | "landscape"
  isCover: boolean
}) {
  return (
    <div className={cn("relative w-full", aspectClass(aspect))}>
      {/* Preview uses object URLs; next/image cannot optimize local blobs */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cmsImageDisplaySrc(image.url)}
        alt={image.name}
        className="size-full object-cover"
        draggable={false}
      />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-linear-to-t from-black/70 to-transparent px-2 pb-2 pt-8">
        {isCover ? (
          <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-primary-foreground uppercase">
            Ảnh bìa
          </span>
        ) : (
          <span />
        )}
        <span className="truncate text-[10px] text-white/80">
          {image.file ? formatFileSize(image.file.size) : image.name}
        </span>
      </div>
    </div>
  )
}
