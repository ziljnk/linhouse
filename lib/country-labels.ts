import { countryDisplayName } from "@/lib/country-dial-codes"

const SPECIAL_LABELS_VI: Record<string, string> = {
  T1: "Tor",
  XX: "Không xác định",
}

const SPECIAL_HINTS_VI: Record<string, string> = {
  T1: "Người xem đang ẩn vị trí nên không biết họ ở nước nào.",
  XX: "Không có thông tin về quốc gia của người dùng.",
}

export function countryLabelVi(code: string) {
  const normalized = code.trim().toUpperCase()
  return SPECIAL_LABELS_VI[normalized] ?? countryDisplayName(normalized, "vi")
}

/** Tooltip for unknown location codes. Real countries return null. */
export function countryCodeHintVi(code: string) {
  const normalized = code.trim().toUpperCase()
  if (SPECIAL_HINTS_VI[normalized]) return SPECIAL_HINTS_VI[normalized]
  if (
    !/^[A-Z]{2}$/.test(normalized) ||
    countryDisplayName(normalized, "vi") === normalized
  ) {
    return "Đây không phải tên một quốc gia. Không xác định được người xem đang ở đâu."
  }
  return null
}
