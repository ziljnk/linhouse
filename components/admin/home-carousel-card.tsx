"use client"

import { useId, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { saveHomeCarouselAction } from "@/app/admin/(dashboard)/collections/home-carousel-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toastError, toastSuccess } from "@/lib/admin-toast"
import {
  HOME_CAROUSEL_GENERIC_ERROR,
  HOME_CAROUSEL_LIMIT,
  HOME_CAROUSEL_LIMIT_HINT,
  formatHomeCarouselDay,
  isHomeCarouselVisible,
  orderedHomeSelections,
  type HomeCarouselEditorData,
  type HomeCarouselEditorItem,
} from "@/lib/home-carousel"
import { cn } from "@/lib/utils"

export function HomeCarouselLimitNotice({
  blocked,
  className,
  children,
}: {
  blocked: boolean
  className?: string
  children: ReactNode
}) {
  if (!blocked) return children
  return (
    <Tooltip>
      <TooltipTrigger
        delay={0}
        closeDelay={0}
        render={
          <span className={cn("inline-flex", className)} tabIndex={0} />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent className="max-w-64">{HOME_CAROUSEL_LIMIT_HINT}</TooltipContent>
    </Tooltip>
  )
}

function itemBadges(item: HomeCarouselEditorItem) {
  const badges: string[] = []
  if (item.appearance === "draft") badges.push("Bản nháp – chưa hiện")
  if (item.appearance === "scheduled" && item.publishedAt) {
    badges.push(`Hẹn lịch ${formatHomeCarouselDay(item.publishedAt)}`)
  }
  if (!item.coverUrl.trim()) badges.push("Thiếu ảnh bìa")
  return badges
}

function SortableCarouselRow({
  item,
  index,
  total,
  onMove,
  onRemove,
}: {
  item: HomeCarouselEditorItem
  index: number
  total: number
  onMove: (index: number, direction: -1 | 1) => void
  onRemove: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background px-2 py-2",
        isDragging && "z-10 opacity-80 shadow-md"
      )}
    >
      <button
        type="button"
        className="inline-flex size-8 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-muted active:cursor-grabbing"
        aria-label={`Kéo để đổi vị trí ${item.name}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="flex min-w-40 flex-1 flex-wrap items-center gap-2">
        <span className="font-medium">{item.name}</span>
        {itemBadges(item).map((badge) => (
          <Badge key={badge} variant="outline">
            {badge}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="xs"
          disabled={index === 0}
          onClick={() => onMove(index, -1)}
        >
          Đưa lên
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xs"
          disabled={index === total - 1}
          onClick={() => onMove(index, 1)}
        >
          Đưa xuống
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => onRemove(item.id)}
        >
          Bỏ khỏi carousel
        </Button>
      </div>
    </div>
  )
}

export function HomeCarouselCard({ editor }: { editor: HomeCarouselEditorData }) {
  const router = useRouter()
  const dndId = useId()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const [selected, setSelected] = useState(() => orderedHomeSelections(editor.items))
  const [comboValue, setComboValue] = useState<HomeCarouselEditorItem | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const visibleCount = selected.filter(isHomeCarouselVisible).length
  const atLimit = selected.length >= HOME_CAROUSEL_LIMIT
  const options = editor.items.filter(
    (item) =>
      (item.appearance === "published" || item.appearance === "scheduled") &&
      !selected.some((picked) => picked.id === item.id)
  )

  const move = (index: number, direction: -1 | 1) => {
    setSelected((current) => {
      const next = index + direction
      if (next < 0 || next >= current.length) return current
      return arrayMove(current, index, next)
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setSelected((current) => {
      const oldIndex = current.findIndex((item) => item.id === active.id)
      const newIndex = current.findIndex((item) => item.id === over.id)
      if (oldIndex < 0 || newIndex < 0) return current
      return arrayMove(current, oldIndex, newIndex)
    })
  }

  const save = async () => {
    setPending(true)
    setError(null)
    try {
      const result = await saveHomeCarouselAction({
        ids: selected.map((item) => item.id),
        version: editor.version,
      })
      if (!result.ok) {
        setError(result.error)
        toastError(result.error)
        return
      }
      toastSuccess("Đã lưu carousel trang chủ.")
      router.refresh()
    } catch {
      setError(HOME_CAROUSEL_GENERIC_ERROR)
      toastError(HOME_CAROUSEL_GENERIC_ERROR)
    } finally {
      setPending(false)
    }
  }

  return (
    <Card
      data-home-carousel=""
      onKeyDown={(event) => {
        if (event.key !== "Enter") return
        const target = event.target
        if (
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement
        ) {
          event.preventDefault()
        }
      }}
    >
      <CardHeader>
        <CardTitle>Carousel bộ sưu tập trang chủ</CardTitle>
        <CardDescription>
          Chọn và sắp xếp bộ sưu tập hiện ở carousel trang chủ. Menu đầu trang vẫn hiện tất cả bộ sưu tập đã đăng.
        </CardDescription>
      </CardHeader>
      <CardContent className="gap-4">
        <p className="text-sm font-medium tabular-nums">
          Đã chọn {selected.length}/{HOME_CAROUSEL_LIMIT} · {visibleCount} đang hiện
        </p>
        {visibleCount === 0 ? (
          <p className="text-sm text-muted-foreground">
            Trang chủ đang tự hiện tất cả bộ sưu tập đã đăng.
          </p>
        ) : null}
        {selected.length > 0 && visibleCount < 4 ? (
          <p className="text-sm text-amber-800">
            Nên chọn ít nhất 4 bộ sưu tập để carousel lấp đầy một hàng trên máy tính.
          </p>
        ) : null}
        {selected.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-3 py-4">
            <p className="text-sm font-medium">Chưa chọn bộ sưu tập nào</p>
          </div>
        ) : (
          <DndContext
            id={dndId}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={selected.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2">
                {selected.map((item, index) => (
                  <SortableCarouselRow
                    key={item.id}
                    item={item}
                    index={index}
                    total={selected.length}
                    onMove={move}
                    onRemove={(id) =>
                      setSelected((current) => current.filter((picked) => picked.id !== id))
                    }
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
        <HomeCarouselLimitNotice blocked={atLimit} className="w-full">
          <Combobox
            items={options}
            value={comboValue}
            onValueChange={(next) => {
              if (!next || atLimit) {
                setComboValue(null)
                return
              }
              setSelected((current) => {
                if (current.length >= HOME_CAROUSEL_LIMIT) return current
                if (current.some((picked) => picked.id === next.id)) return current
                return [...current, { ...next, showOnHome: true }]
              })
              setComboValue(null)
            }}
            itemToStringLabel={(item) => item.name}
            itemToStringValue={(item) => item.id}
            isItemEqualToValue={(a, b) => a.id === b.id}
            disabled={atLimit || pending}
            autoHighlight
          >
            <ComboboxInput
              placeholder="Thêm bộ sưu tập…"
              disabled={atLimit || pending}
              className="w-full"
              aria-label="Thêm bộ sưu tập…"
            />
            <ComboboxContent>
              <ComboboxEmpty>Không tìm thấy bộ sưu tập đã đăng.</ComboboxEmpty>
              <ComboboxList>
                {(item: HomeCarouselEditorItem) => (
                  <ComboboxItem key={item.id} value={item}>
                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                    {item.appearance === "scheduled" && item.publishedAt ? (
                      <Badge variant="secondary">
                        Hẹn lịch {formatHomeCarouselDay(item.publishedAt)}
                      </Badge>
                    ) : null}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </HomeCarouselLimitNotice>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="justify-end border-t">
        <Button type="button" onClick={() => void save()} disabled={pending}>
          {pending ? "Đang lưu..." : "Lưu carousel"}
        </Button>
      </CardFooter>
    </Card>
  )
}
