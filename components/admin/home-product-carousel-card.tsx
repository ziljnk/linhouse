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
import { saveHomeProductCarouselAction } from "@/app/admin/(dashboard)/content/home-product-carousel-actions"
import { Badge } from "@/components/ui/badge"
import { OptimizedImage } from "@/components/ui/optimized-image"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toastError, toastSuccess } from "@/lib/admin-toast"
import {
  HOME_PRODUCT_CAROUSEL_GENERIC_ERROR,
  HOME_PRODUCT_CAROUSEL_LABELS,
  HOME_PRODUCT_CAROUSEL_LIMIT,
  HOME_PRODUCT_CAROUSEL_LIMIT_HINT,
  HOME_PRODUCT_CAROUSEL_TITLE_MAX,
  formatHomeProductCarouselDay,
  isHomeProductCarouselVisible,
  type HomeProductCarouselEditor,
  type HomeProductCarouselProduct,
} from "@/lib/home-product-carousels"
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

export function HomeProductCarouselCard({
  carousel,
  products,
}: {
  carousel: HomeProductCarouselEditor
  products: HomeProductCarouselProduct[]
}) {
  const router = useRouter()
  const dndId = useId()
  const titleViId = useId()
  const titleEnId = useId()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const catalog = new Map(products.map((item) => [item.id, item]))
  const [selected, setSelected] = useState(() =>
    carousel.productIds.flatMap((id) => {
      const item = catalog.get(id)
      return item ? [item] : []
    })
  )
  const [titleVi, setTitleVi] = useState(carousel.titleVi)
  const [titleEn, setTitleEn] = useState(carousel.titleEn)
  const [comboValue, setComboValue] = useState<HomeProductCarouselProduct | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const visibleCount = selected.filter(isHomeProductCarouselVisible).length
  const atLimit = selected.length >= HOME_PRODUCT_CAROUSEL_LIMIT
  const options = products.filter(
    (item) =>
      (item.appearance === "published" || item.appearance === "scheduled") &&
      !selected.some((picked) => picked.id === item.id)
  )
  const position = carousel.slot === 1 ? "phía trên" : "phía dưới"

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
      const result = await saveHomeProductCarouselAction({
        slot: carousel.slot,
        titleVi,
        titleEn,
        ids: selected.map((item) => item.id),
        version: carousel.version,
      })
      if (!result.ok) {
        setError(result.error)
        toastError(result.error)
        return
      }
      toastSuccess(`Đã lưu ${HOME_PRODUCT_CAROUSEL_LABELS[carousel.slot].toLowerCase()}.`)
      router.refresh()
    } catch {
      setError(HOME_PRODUCT_CAROUSEL_GENERIC_ERROR)
      toastError(HOME_PRODUCT_CAROUSEL_GENERIC_ERROR)
    } finally {
      setPending(false)
    }
  }

  return (
    <Card
      data-home-product-carousel=""
      onKeyDown={(event) => {
        if (event.key !== "Enter") return
        const target = event.target
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
          event.preventDefault()
        }
      }}
    >
      <CardHeader>
        <CardTitle>{HOME_PRODUCT_CAROUSEL_LABELS[carousel.slot]}</CardTitle>
        <CardDescription>
          Hiện {position}, giữa phần bốn bước đặt hàng và Kinh nghiệm cưới. Tiêu đề và sản phẩm được lưu bằng nút ở cuối thẻ này.
        </CardDescription>
      </CardHeader>
      <CardContent className="gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor={titleViId}>Tiêu đề tiếng Việt</Label>
            <Input
              id={titleViId}
              value={titleVi}
              maxLength={HOME_PRODUCT_CAROUSEL_TITLE_MAX}
              placeholder="Ví dụ: Váy cưới"
              disabled={pending}
              onChange={(event) => setTitleVi(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={titleEnId}>Tiêu đề tiếng Anh</Label>
            <Input
              id={titleEnId}
              value={titleEn}
              maxLength={HOME_PRODUCT_CAROUSEL_TITLE_MAX}
              placeholder="Ví dụ: Bridal gowns"
              disabled={pending}
              onChange={(event) => setTitleEn(event.target.value)}
            />
          </div>
        </div>
        <p className="text-sm font-medium tabular-nums">
          Đã chọn {selected.length}/{HOME_PRODUCT_CAROUSEL_LIMIT} · {visibleCount} đang hiện
        </p>
        {selected.length > 0 && visibleCount < 5 ? (
          <p className="text-sm text-amber-800">
            Nên chọn ít nhất 5 sản phẩm đang hiện để carousel tự chạy trên máy tính.
          </p>
        ) : null}
        {selected.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-3 py-4">
            <p className="text-sm font-medium">Chưa chọn sản phẩm nào</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Trang chủ sẽ ẩn carousel này.
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
        <ProductPicker
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
              if (current.length >= HOME_PRODUCT_CAROUSEL_LIMIT) return current
              if (current.some((picked) => picked.id === next.id)) return current
              return [...current, next]
            })
            setComboValue(null)
          }}
        />
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

function ProductPicker({
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
      <TooltipTrigger delay={0} closeDelay={0} render={<span className="inline-flex w-full" tabIndex={0} />}>
        {picker}
      </TooltipTrigger>
      <TooltipContent className="max-w-64">{HOME_PRODUCT_CAROUSEL_LIMIT_HINT}</TooltipContent>
    </Tooltip>
  )
}
