"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ADMIN_DRAFT_ENTITY_LABELS,
  deleteAdminDraft,
  draftOpenHref,
  formatDraftStamp,
} from "@/lib/admin-drafts"
import { useUserDraftMetas } from "@/hooks/use-form-draft"

export function UnsavedDraftsPanel() {
  const drafts = useUserDraftMetas()

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Bản nháp được lưu trên trình duyệt này.
      </p>
      {drafts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Không có nháp chưa lưu trên trình duyệt này.
        </p>
      ) : (
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loại</TableHead>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Lưu lúc</TableHead>
                <TableHead className="w-36">
                  <span className="sr-only">Thao tác</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drafts.map((draft) => (
                <TableRow key={`${draft.entity}:${draft.recordId}`}>
                  <TableCell>{ADMIN_DRAFT_ENTITY_LABELS[draft.entity]}</TableCell>
                  <TableCell className="whitespace-normal font-medium">
                    {draft.title || "Chưa có tiêu đề"}
                  </TableCell>
                  <TableCell>
                    {draft.recordId === "new" ? "Tạo mới" : "Đang sửa"}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatDraftStamp(draft.savedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        nativeButton={false}
                        size="sm"
                        variant="outline"
                        render={<Link href={draftOpenHref(draft)} />}
                      >
                        Mở
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          void deleteAdminDraft(
                            draft.userId,
                            draft.entity,
                            draft.recordId
                          )
                        }}
                      >
                        Xóa
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
