"use client"

import { useId, useState } from "react"
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
import { saveSuggestionRailAction } from "@/app/admin/(dashboard)/content/product-suggestion-actions"
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
import { OptimizedImage } from "@/components/ui/optimized-image"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toastError, toastSuccess } from "@/lib/admin-toast"
import {
  formatHomeProductCarouselDay,
  isHomeProductCarouselVisible,
  type HomeProductCarouselProduct,
} from "@/lib/home-product-carousels"
import {
  SUGGESTION_RAIL_GENERIC_ERROR,
  SUGGESTION_RAIL_HINTS,
  SUGGESTION_RAIL_LABELS,
  SUGGESTION_RAIL_LIMIT,
  SUGGESTION_RAIL_LIMIT_HINT,
  SUGGESTION_RAIL_MINIMUM,
  SUGGESTION_RAIL_MINIMUM_ERROR,
  type SuggestionRailEditor,
} from "@/lib/product-suggestion-rails"
import { cn } from "@/lib/utils"

function ProductThumb({ item }: { item: HomeProductCarouselProduct }) {
  return (
    <span className="relative h-12 w-9 shrink-0 overflow-hidden rounded-sm bg-muted">
      {item.imageUrl.trim() ? (
        <OptimizedImage
          src={item.imageUrl}
          alt=""
          fill
          sizes="36px"
          srcWidth={400}
          className="object-cover"
        />
      ) : null}
    </span>
  )
}

function itemBadges(item: HomeProductCarouselProduct) {
  const badges: string[] = []
  if (item.appearance === "draft") badges.push("Bản nháp – chưa hiện")
  if (item.appearance === "scheduled" && item.publishedAt) {
    badges.push(`Hẹn lịch ${formatHomeProductCarouselDay(item.publishedAt)}`)
  }
  if (!item.imageUrl.trim()) badges.push("Thiếu ảnh")
  return badges
}

function SortableProductRow({
  item,
  index,
  total,
  onMove,
  onRemove,
}: {
  item: HomeProductCarouselProduct
  index: number
  total: number
  onMove: (index: number, direction: -1 | 1) => void
  onRemove: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
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
      <ProductThumb item={item} />
      <div className="flex min-w-40 flex-1 flex-wrap items-center gap-2">
        <span className="font-medium">{item.name}</span>
        {item.code ? (
          <span className="text-sm text-muted-foreground">{item.code}</span>
        ) : null}
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
        <Button type="button" variant="ghost" size="xs" onClick={() => onRemove(item.id)}>
          Bỏ khỏi carousel
        </Button>
      </div>
    </div>
  )
}

function RailPicker({
  options,
  value,
  blocked,
  pending,
  onPick,
}: {
  options: HomeProductCarouselProduct[]
  value: HomeProductCarouselProduct | null
  blocked: boolean
  pending: boolean
  onPick: (item: HomeProductCarouselProduct | null) => void
}) {
  const picker = (
    <Combobox
      items={options}
      value={value}
      onValueChange={onPick}
      itemToStringLabel={(item) => item.name}
      itemToStringValue={(item) => item.id}
      isItemEqualToValue={(a, b) => a.id === b.id}
      disabled={blocked || pending}
      autoHighlight
    >
      <ComboboxInput
        placeholder="Thêm sản phẩm…"
        disabled={blocked || pending}
        className="w-full"
        aria-label="Thêm sản phẩm…"
      />
      <ComboboxContent>
        <ComboboxEmpty>Không tìm thấy sản phẩm đã đăng.</ComboboxEmpty>
        <ComboboxList>
          {(item: HomeProductCarouselProduct) => (
            <ComboboxItem key={item.id} value={item} className="py-1">
              <ProductThumb item={item} />
              <span className="min-w-0 flex-1 truncate">{item.name}</span>
              {item.code ? (
                <span className="shrink-0 text-muted-foreground">{item.code}</span>
              ) : null}
              {item.appearance === "scheduled" && item.publishedAt ? (
                <Badge variant="secondary">
                  Hẹn lịch {formatHomeProductCarouselDay(item.publishedAt)}
                </Badge>
              ) : null}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )

  if (!blocked) return picker

  return (
    <Tooltip>
      <TooltipTrigger
        delay={0}
        closeDelay={0}
        render={<span className="inline-flex w-full" tabIndex={0} />}
      >
        {picker}
      </TooltipTrigger>
      <TooltipContent className="max-w-64">{SUGGESTION_RAIL_LIMIT_HINT}</TooltipContent>
    </Tooltip>
  )
}

export function ProductSuggestionRailCard({
  rail,
  products,
}: {
  rail: SuggestionRailEditor
  products: HomeProductCarouselProduct[]
}) {
  const router = useRouter()
  const dndId = useId()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const catalog = new Map(products.map((item) => [item.id, item]))
  const [selected, setSelected] = useState(() =>
    rail.productIds.flatMap((id) => {
      const item = catalog.get(id)
      return item ? [item] : []
    })
  )
  const [comboValue, setComboValue] = useState<HomeProductCarouselProduct | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const visibleCount = selected.filter(isHomeProductCarouselVisible).length
  const atLimit = selected.length >= SUGGESTION_RAIL_LIMIT
  const belowMinimum = selected.length > 0 && selected.length < SUGGESTION_RAIL_MINIMUM
  const options = products.filter(
    (item) =>
      (item.appearance === "published" || item.appearance === "scheduled") &&
      !selected.some((picked) => picked.id === item.id)
  )
  const label = SUGGESTION_RAIL_LABELS[rail.rail]

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
    if (selected.length > 0 && selected.length < SUGGESTION_RAIL_MINIMUM) {
      setError(SUGGESTION_RAIL_MINIMUM_ERROR)
      toastError(SUGGESTION_RAIL_MINIMUM_ERROR)
      return
    }
    setPending(true)
    setError(null)
    try {
      const result = await saveSuggestionRailAction({
        rail: rail.rail,
        ids: selected.map((item) => item.id),
        version: rail.version,
      })
      if (!result.ok) {
        setError(result.error)
        toastError(result.error)
        return
      }
      toastSuccess(`Đã lưu carousel ${label.toLowerCase()}.`)
      router.refresh()
    } catch {
      setError(SUGGESTION_RAIL_GENERIC_ERROR)
      toastError(SUGGESTION_RAIL_GENERIC_ERROR)
    } finally {
      setPending(false)
    }
  }

  return (
    <Card
      data-suggestion-rail={rail.rail}
      onKeyDown={(event) => {
        if (event.key !== "Enter") return
        const target = event.target
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
          event.preventDefault()
        }
      }}
    >
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <CardDescription>{SUGGESTION_RAIL_HINTS[rail.rail]}</CardDescription>
      </CardHeader>
      <CardContent className="gap-4">
        <p className="text-sm font-medium tabular-nums">
          Đã chọn {selected.length}/{SUGGESTION_RAIL_LIMIT} · {visibleCount} đang hiện
        </p>
        {selected.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-3 py-4">
            <p className="text-sm font-medium">Chưa chọn sản phẩm nào</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Trang sản phẩm sẽ tự lấy ngẫu nhiên.
            </p>
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
                  <SortableProductRow
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
        <RailPicker
          options={options}
          value={comboValue}
          blocked={atLimit}
          pending={pending}
          onPick={(next) => {
            if (!next || atLimit) {
              setComboValue(null)
              return
            }
            setSelected((current) => {
              if (current.length >= SUGGESTION_RAIL_LIMIT) return current
              if (current.some((picked) => picked.id === next.id)) return current
              return [...current, next]
            })
            setComboValue(null)
          }}
        />
        {belowMinimum ? (
          <p className="text-sm text-muted-foreground">
            Chọn tối thiểu {SUGGESTION_RAIL_MINIMUM} sản phẩm, hoặc bỏ hết để dùng danh sách ngẫu nhiên.
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="justify-end border-t">
        <Button type="button" onClick={() => void save()} disabled={pending || belowMinimum}>
          {pending ? "Đang lưu..." : "Lưu carousel"}
        </Button>
      </CardFooter>
    </Card>
  )
}
