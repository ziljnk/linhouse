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
import { cn } from "@/lib/utils"

const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_IMAGES = 24
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]

export type ProductImage = {
  id: string
  file: File
  url: string
}

type ProductImageUploaderProps = {
  images: ProductImage[]
  onChange: (images: ProductImage[]) => void
}

function isAcceptedImage(file: File) {
  return ACCEPTED_TYPES.includes(file.type) || file.type.startsWith("image/")
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function toProductImage(file: File): ProductImage {
  return {
    id: crypto.randomUUID(),
    file,
    url: URL.createObjectURL(file),
  }
}

function revokeImages(images: ProductImage[]) {
  for (const image of images) {
    URL.revokeObjectURL(image.url)
  }
}

export function ProductImageUploader({ images, onChange }: ProductImageUploaderProps) {
  const inputId = useId()
  const dragCountRef = useRef(0)
  const imagesRef = useRef(images)
  const [isDraggingFiles, setIsDraggingFiles] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

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
    (fileList: FileList | File[]) => {
      const incoming = Array.from(fileList)
      if (incoming.length === 0) return

      const accepted: File[] = []
      let invalidType = 0
      let tooLarge = 0

      for (const file of incoming) {
        if (!isAcceptedImage(file)) {
          invalidType += 1
          continue
        }
        if (file.size > MAX_FILE_SIZE) {
          tooLarge += 1
          continue
        }
        accepted.push(file)
      }

      const remaining = MAX_IMAGES - images.length
      const overflow = Math.max(0, accepted.length - remaining)
      const nextFiles = accepted.slice(0, remaining)

      if (nextFiles.length > 0) {
        onChange([...images, ...nextFiles.map(toProductImage)])
      }

      if (invalidType || tooLarge || overflow) {
        const parts: string[] = []
        if (invalidType) parts.push(`${invalidType} tệp không phải ảnh`)
        if (tooLarge) parts.push(`${tooLarge} tệp vượt quá 10MB`)
        if (overflow) parts.push(`chỉ còn chỗ cho ${remaining} ảnh`)
        setError(`Một số tệp bị bỏ qua: ${parts.join(", ")}.`)
      } else {
        setError(null)
      }
    },
    [images, onChange]
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
    if (removed) URL.revokeObjectURL(removed.url)
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

  return (
    <div className="flex flex-col gap-4">
      <input
        id={inputId}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        multiple
        className="sr-only"
        onChange={handleInputChange}
      />

      <label
        htmlFor={inputId}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
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
            Kéo thả nhiều ảnh vào đây, hoặc{" "}
            <span className="text-primary underline-offset-4 hover:underline">
              chọn tệp
            </span>
          </span>
          <span className="block text-xs text-muted-foreground">
            JPG, PNG, WEBP, GIF — tối đa {MAX_IMAGES} ảnh, mỗi ảnh 10MB.
          </span>
        </span>
      </label>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Xem trước</p>
          <p className="text-xs text-muted-foreground">
            Kéo thả để sắp xếp lại. Ảnh đầu tiên sẽ là ảnh bìa.
          </p>
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
                  onRemove={handleRemove}
                />
              ))}
            </ul>
          </SortableContext>
          <DragOverlay>
            {activeImage ? (
              <ImageTilePreview image={activeImage} isCover={images[0]?.id === activeImage.id} />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}

function SortableImageTile({
  image,
  index,
  onRemove,
}: {
  image: ProductImage
  index: number
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
        <ImageTilePreview image={image} isCover={index === 0} />
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
        aria-label={`Xóa ${image.file.name}`}
        onClick={() => onRemove(image.id)}
      >
        <X className="size-3.5" />
      </Button>
    </li>
  )
}

function ImageTilePreview({
  image,
  isCover,
}: {
  image: ProductImage
  isCover: boolean
}) {
  return (
    <div className="relative aspect-3/4 w-full">
      {/* Preview uses object URLs; next/image cannot optimize local blobs */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt={image.file.name}
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
          {formatFileSize(image.file.size)}
        </span>
      </div>
    </div>
  )
}
