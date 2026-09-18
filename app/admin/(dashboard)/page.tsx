import { AnalyticsOverviewDashboard } from "@/components/admin/analytics-overview"
import { parseAnalyticsRange } from "@/lib/admin-analytics"
import { getAnalyticsOverview } from "@/lib/admin-analytics-data"
import { requireUsableAdminSession } from "@/lib/admin-session"

export const metadata = {
  title: "Tổng quan",
}

export default async function AdminPage({
  searchParams,
}: PageProps<"/admin">) {
  await requireUsableAdminSession()
  const params = await searchParams
  const range = parseAnalyticsRange(params.range)
  const data = await getAnalyticsOverview(range)

  return <AnalyticsOverviewDashboard data={data} />
}
