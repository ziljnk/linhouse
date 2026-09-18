import Link from "next/link"
import { Eye, Newspaper, Shirt } from "lucide-react"
import { AnalyticsRangeTabs } from "@/components/admin/analytics-range-tabs"
import { AnalyticsRefreshButton } from "@/components/admin/analytics-refresh-button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ANALYTICS_RANGE_PHRASES,
  formatAnalyticsCount,
  formatAnalyticsShare,
  type AnalyticsOverview,
  type AnalyticsRankItem,
} from "@/lib/admin-analytics"

function barWidth(views: number, maxViews: number) {
  if (maxViews <= 0) return 0
  return Math.max(6, Math.round((views / maxViews) * 100))
}

function RankingList({
  items,
  total,
  empty,
}: {
  items: AnalyticsRankItem[]
  total: number
  empty: string
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>
  }

  const maxViews = Math.max(...items.map((item) => item.views))

  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        const width = barWidth(item.views, maxViews)
        const title = (
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{item.label}</span>
            {item.description ? (
              <span className="truncate text-xs text-muted-foreground">
                {item.description}
              </span>
            ) : null}
          </span>
        )

        return (
          <li key={item.key} className="relative overflow-hidden rounded-md">
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 bg-foreground/8"
              style={{ width: `${width}%` }}
            />
            <div className="relative flex items-center justify-between gap-3 px-2.5 py-2">
              {item.href ? (
                <Link
                  href={item.href}
                  className="min-w-0 hover:underline"
                >
                  {title}
                </Link>
              ) : (
                <div className="min-w-0">{title}</div>
              )}
              <span className="shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                {formatAnalyticsCount(item.views)}
                <span className="ml-2 text-xs">
                  {formatAnalyticsShare(item.views, total)}
                </span>
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function KpiCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon: typeof Eye
}) {
  return (
    <Card>
      <CardContent className="flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
            {formatAnalyticsCount(value)}
          </p>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </span>
      </CardContent>
    </Card>
  )
}

export function AnalyticsOverviewDashboard({
  data,
}: {
  data: AnalyticsOverview
}) {
  const isEmpty = data.totalViews === 0

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Tổng quan</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Lượt xem website {ANALYTICS_RANGE_PHRASES[data.range]}. Số liệu theo UTC.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AnalyticsRangeTabs value={data.range} />
          <AnalyticsRefreshButton />
        </div>
      </div>

      {isEmpty ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Chưa có lượt xem trong khoảng này.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard label="Tổng lượt xem" value={data.totalViews} icon={Eye} />
            <KpiCard
              label="Lượt xem sản phẩm"
              value={data.productViews}
              icon={Shirt}
            />
            <KpiCard
              label="Lượt xem bài viết"
              value={data.postViews}
              icon={Newspaper}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card size="sm">
              <CardHeader>
                <CardTitle>Sản phẩm được xem nhiều</CardTitle>
                <CardDescription>Top trang sản phẩm</CardDescription>
              </CardHeader>
              <CardContent>
                <RankingList
                  items={data.products}
                  total={data.productViews}
                  empty="Chưa có lượt xem sản phẩm."
                />
              </CardContent>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle>Bài viết được xem nhiều</CardTitle>
                <CardDescription>Top trang blog</CardDescription>
              </CardHeader>
              <CardContent>
                <RankingList
                  items={data.posts}
                  total={data.postViews}
                  empty="Chưa có lượt xem bài viết."
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Card size="sm">
              <CardHeader>
                <CardTitle>Quốc gia</CardTitle>
                <CardDescription>Nơi người xem truy cập</CardDescription>
              </CardHeader>
              <CardContent>
                <RankingList
                  items={data.countries}
                  total={data.totalViews}
                  empty="Chưa có dữ liệu quốc gia."
                />
              </CardContent>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle>Nguồn truy cập</CardTitle>
                <CardDescription>Referrer dẫn tới website</CardDescription>
              </CardHeader>
              <CardContent>
                <RankingList
                  items={data.referrers}
                  total={data.totalViews}
                  empty="Chưa có dữ liệu nguồn truy cập."
                />
              </CardContent>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle>Thiết bị</CardTitle>
                <CardDescription>Loại máy người xem dùng</CardDescription>
              </CardHeader>
              <CardContent>
                <RankingList
                  items={data.devices}
                  total={data.totalViews}
                  empty="Chưa có dữ liệu thiết bị."
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
