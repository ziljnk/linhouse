"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { AdminFilterSelect } from "@/components/admin/admin-filter-select"
import { AdminPagination } from "@/components/admin/admin-pagination"
import {
  useAdminListParams,
  useAdminSearchQuery,
} from "@/components/admin/use-admin-list-params"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTIONS,
  AUDIT_AREA_LABELS,
  AUDIT_AREAS,
  auditChangeImageSources,
  type AuditAction,
  type AuditArea,
  type AuditChange,
} from "@/lib/admin-audit-shared"

type AuditLogRow = {
  id: string
  createdAt: string
  actorName: string
  actorEmail: string
  action: AuditAction
  area: AuditArea
  entityLabel: string
  summary: string
  changes: AuditChange[]
}

const AREA_OPTIONS = [
  { value: "all", label: "Tất cả khu vực" },
  ...AUDIT_AREAS.map((area) => ({ value: area, label: AUDIT_AREA_LABELS[area] })),
]

const ACTION_OPTIONS = [
  { value: "all", label: "Tất cả thao tác" },
  ...AUDIT_ACTIONS.map((action) => ({
    value: action,
    label: AUDIT_ACTION_LABELS[action],
  })),
]

export function AuditLogTable({
  items,
  page,
  pageCount,
  total,
  pageSize,
  query,
  area,
  action,
}: {
  items: AuditLogRow[]
  page: number
  pageCount: number
  total: number
  pageSize: number
  query: string
  area: string
  action: string
}) {
  const { setParam, clearParams } = useAdminListParams()
  const search = useAdminSearchQuery(query)
  const [selected, setSelected] = useState<AuditLogRow | null>(null)
  const hasFilters = Boolean(query || (area && area !== "all") || (action && action !== "all"))

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search.value}
              onChange={(event) => search.onChange(event.target.value)}
              onFocus={search.onFocus}
              onBlur={search.onBlur}
              placeholder="Tìm người hoặc nội dung đã đổi"
              aria-label="Tìm lịch sử"
              className="pl-8"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <AdminFilterSelect
              id="filter-audit-area"
              aria-label="Lọc khu vực"
              value={area}
              onValueChange={(value) => setParam("area", value)}
              items={AREA_OPTIONS}
            />
            <AdminFilterSelect
              id="filter-audit-action"
              aria-label="Lọc thao tác"
              value={action}
              onValueChange={(value) => setParam("action", value)}
              items={ACTION_OPTIONS}
            />
          </div>
        </div>
        {hasFilters ? (
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => clearParams(["q", "area", "action"])}
            >
              Xóa bộ lọc
            </Button>
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[14%]">Thời gian</TableHead>
              <TableHead className="w-[18%]">Người</TableHead>
              <TableHead className="w-[12%]">Khu vực</TableHead>
              <TableHead className="w-[10%]">Thao tác</TableHead>
              <TableHead className="w-[36%]">Nội dung</TableHead>
              <TableHead className="w-[10%]">
                <span className="sr-only">Chi tiết</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Chưa có lịch sử thao tác.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-nowrap">{item.createdAt}</TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="font-medium wrap-anywhere">{item.actorName || "Không rõ"}</div>
                    <div className="text-xs text-muted-foreground wrap-anywhere">{item.actorEmail}</div>
                  </TableCell>
                  <TableCell>{AUDIT_AREA_LABELS[item.area]}</TableCell>
                  <TableCell>
                    <Badge variant={actionVariant(item.action)}>
                      {AUDIT_ACTION_LABELS[item.action]}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="wrap-anywhere">{item.summary}</div>
                    {item.entityLabel !== item.summary ? (
                      <div className="text-xs text-muted-foreground wrap-anywhere">
                        {item.entityLabel}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelected(item)}
                    >
                      Chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AdminPagination
        page={page}
        pageCount={pageCount}
        total={total}
        pageSize={pageSize}
        noun="dòng"
      />

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-x-hidden overflow-y-auto sm:max-w-2xl">
          <DialogHeader className="min-w-0 pr-8">
            <DialogTitle className="wrap-anywhere">{selected?.summary}</DialogTitle>
            <DialogDescription className="wrap-anywhere">
              {selected
                ? `${selected.createdAt} · ${selected.actorName || selected.actorEmail} · ${AUDIT_AREA_LABELS[selected.area]}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <ChangeList changes={selected?.changes ?? []} />
        </DialogContent>
      </Dialog>
    </>
  )
}

function ChangeList({ changes }: { changes: AuditChange[] }) {
  if (!changes.length) {
    return <p className="text-sm text-muted-foreground">Không có trường nào đổi.</p>
  }

  return (
    <dl className="flex min-w-0 flex-col gap-4">
      {changes.map((change) => (
        <div key={`${change.label}-${change.before}-${change.after}`} className="grid min-w-0 gap-1">
          <dt className="text-sm font-medium wrap-anywhere">{change.label}</dt>
          <dd className="grid min-w-0 gap-2 text-sm sm:grid-cols-2">
            <ChangeValue side="Trước" value={change.before} images={change.images} />
            <ChangeValue side="Sau" value={change.after} images={change.images} />
          </dd>
        </div>
      ))}
    </dl>
  )
}

function ChangeValue({
  side,
  value,
  images,
}: {
  side: string
  value: string
  images?: boolean
}) {
  const sources = auditChangeImageSources(value, images)

  return (
    <div className="min-w-0 rounded-md border bg-muted/40 p-2">
      <span className="mb-1 block text-xs text-muted-foreground">{side}</span>
      {sources ? (
        <div className="flex flex-col gap-2">
          {sources.map((src, index) => (
            // Stored media paths are not known to the image optimizer.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${src}-${index}`}
              src={src}
              alt=""
              className="aspect-4/3 w-full rounded-md object-cover"
            />
          ))}
        </div>
      ) : (
        <p className="wrap-anywhere whitespace-pre-wrap">{value || "—"}</p>
      )}
    </div>
  )
}

function actionVariant(action: AuditAction): "default" | "secondary" | "outline" {
  if (action === "delete") return "outline"
  if (action === "create") return "default"
  return "secondary"
}
