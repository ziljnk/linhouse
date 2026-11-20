import {
  formatProductPriceVnd,
  salePercentLabel,
  type ActiveProductSale,
} from "@/lib/catalog"
import { cn } from "@/lib/utils"

export function SaleBadge({
  percent,
  size = "card",
}: {
  percent: number
  size?: "card" | "gallery"
}) {
  return (
    <span
      aria-label={`Giảm ${percent}%`}
      className={cn(
        "absolute z-[2] bg-[#762a40] leading-none font-medium whitespace-nowrap text-white",
        size === "gallery"
          ? "top-3 left-3 px-2.5 py-[7px] text-[11px] tracking-[0.08em] sm:top-4 sm:left-4 sm:px-3 sm:py-2 sm:text-[13px] sm:tracking-[0.1em]"
          : "top-2 left-2 px-2 py-1.5 text-[10px] tracking-[0.08em] sm:top-3 sm:left-3 sm:px-2.5 sm:py-[7px] sm:text-[11px]"
      )}
    >
      {salePercentLabel(percent)}
    </span>
  )
}

export function ProductSalePriceRow({
  sale,
  className,
}: {
  sale: ActiveProductSale
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-0.5 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-2.5",
        className
      )}
    >
      <span className="text-[10px] tracking-[0.08em] text-[#9a9088] line-through sm:text-xs sm:tracking-[0.1em]">
        {formatProductPriceVnd(sale.regularPriceVnd)}
      </span>
      <span className="text-[10px] font-medium tracking-[0.08em] text-[#762a40] sm:text-xs sm:tracking-[0.14em]">
        {formatProductPriceVnd(sale.salePriceVnd)}
      </span>
    </div>
  )
}
