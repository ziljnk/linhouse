import { AuditLogTable } from "@/components/admin/audit-log-table"
import { listAdminAuditLogs } from "@/lib/admin-audit-data"
import {
  parseAdminFilter,
  parseAdminPage,
  parseAdminQuery,
} from "@/lib/admin-pagination"
import { requireUsableAdminSession } from "@/lib/admin-session"

export const metadata = {
  title: "Lịch sử",
}

export default async function AdminAuditPage({
  searchParams,
}: PageProps<"/admin/audit">) {
  await requireUsableAdminSession()
  const params = await searchParams
  const q = parseAdminQuery(params.q)
  const area = parseAdminFilter(params.area)
  const action = parseAdminFilter(params.action)
  const result = await listAdminAuditLogs({
    q,
    page: parseAdminPage(params.page),
    area,
    action,
  })

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Lịch sử</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Các lần tạo, sửa hoặc xóa dữ liệu đã lưu. Tìm kiếm và phân trang không được ghi lại.
        </p>
      </div>
      <AuditLogTable
        items={result.items}
        page={result.page}
        pageCount={result.pageCount}
        total={result.total}
        pageSize={result.pageSize}
        query={q}
        area={area || "all"}
        action={action || "all"}
      />
    </div>
  )
}
