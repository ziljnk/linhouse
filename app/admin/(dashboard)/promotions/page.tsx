import { PromotionPopupForm } from "@/components/admin/promotion-popup-form"
import { requireUsableAdminSession } from "@/lib/admin-session"
import { getPromotionPopup } from "@/lib/promotion-popup-store"

export const metadata = {
  title: "Khuyến mãi",
}

export default async function AdminPromotionsPage() {
  await requireUsableAdminSession()
  const promotion = await getPromotionPopup()

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Khuyến mãi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Popup hiện trên trang chủ mỗi lần khách mở trang.
        </p>
      </div>
      <PromotionPopupForm initial={promotion} />
    </div>
  )
}
