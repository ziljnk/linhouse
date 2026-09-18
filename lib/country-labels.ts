export const COUNTRY_LABELS_VI: Record<string, string> = {
  VN: "Việt Nam",
  US: "Hoa Kỳ",
  AU: "Úc",
  SG: "Singapore",
  KR: "Hàn Quốc",
  JP: "Nhật Bản",
  TH: "Thái Lan",
  CN: "Trung Quốc",
  TW: "Đài Loan",
  HK: "Hồng Kông",
  GB: "Anh",
  FR: "Pháp",
  DE: "Đức",
  CA: "Canada",
  MY: "Malaysia",
  ID: "Indonesia",
  PH: "Philippines",
  IN: "Ấn Độ",
  AE: "UAE",
  T1: "Tor",
  XX: "Không xác định",
}

export function countryLabelVi(code: string) {
  const normalized = code.trim().toUpperCase()
  return COUNTRY_LABELS_VI[normalized] ?? normalized
}
