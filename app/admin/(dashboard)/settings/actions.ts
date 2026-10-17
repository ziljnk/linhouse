"use server"

import { actionOk, revalidateAdmin } from "@/lib/admin-actions"
import { recordAudit } from "@/lib/admin-audit"
import { diffFields } from "@/lib/admin-audit-shared"
import { requireUsableAdminSession } from "@/lib/admin-session"
import {
  FLOAT_ICON_IDS,
  validateSiteSettings,
  type SiteSettings,
} from "@/lib/site-settings"
import { getSiteSettings, writeSiteSettings } from "@/lib/site-settings-store"

function shown(value: boolean) {
  return value ? "Hiện" : "Ẩn"
}

function settingsAuditFields(settings: SiteSettings) {
  const methods = settings.contactMethods
    .map((method) => method.label.vi || method.label.en)
    .filter(Boolean)
    .join(", ")

  return [
    { label: "Hotline", value: settings.contact.hotline },
    { label: "Email", value: settings.contact.email },
    { label: "Zalo", value: settings.contact.zalo },
    { label: "Phương thức liên hệ", value: methods },
    { label: "Địa chỉ cửa hàng (VI)", value: settings.address.vi },
    { label: "Địa chỉ cửa hàng (EN)", value: settings.address.en },
    { label: "Địa chỉ công ty (VI)", value: settings.address.company.vi },
    { label: "Địa chỉ công ty (EN)", value: settings.address.company.en },
    { label: "Vị trí Google Map", value: settings.address.mapQuery },
    {
      label: "Hiện địa chỉ cửa hàng trên footer",
      value: shown(settings.address.footerVisible.store),
    },
    {
      label: "Hiện địa chỉ công ty trên footer",
      value: shown(settings.address.footerVisible.company),
    },
    { label: "Hiện bản đồ trên footer", value: shown(settings.address.footerVisible.map) },
    { label: "Tên thương hiệu", value: settings.business.brandName },
    { label: "Tên doanh nghiệp", value: settings.business.legalName },
    { label: "Mã số thuế", value: settings.business.taxCode },
    { label: "Người đại diện", value: settings.business.representative },
    { label: "Giấy phép kinh doanh", value: settings.business.licenseNumber },
    { label: "Giờ làm việc (VI)", value: settings.business.workingHours.vi },
    { label: "Giờ làm việc (EN)", value: settings.business.workingHours.en },
    {
      label: "Hiện tên doanh nghiệp trên footer",
      value: shown(settings.business.footerVisible.legalName),
    },
    {
      label: "Hiện mã số thuế trên footer",
      value: shown(settings.business.footerVisible.taxCode),
    },
    {
      label: "Hiện người đại diện trên footer",
      value: shown(settings.business.footerVisible.representative),
    },
    {
      label: "Hiện giấy phép trên footer",
      value: shown(settings.business.footerVisible.licenseNumber),
    },
    {
      label: "Hiện giờ làm việc trên footer",
      value: shown(settings.business.footerVisible.workingHours),
    },
    { label: "Đường dẫn Facebook", value: settings.social.facebookUrl },
    { label: "Đường dẫn Instagram", value: settings.social.instagramUrl },
    { label: "Thứ tự nút liên hệ", value: settings.social.floatOrder.join(", ") },
    ...FLOAT_ICON_IDS.flatMap((id) => [
      { label: `Chữ khi rê chuột ${id} (VI)`, value: settings.social.tooltips[id].vi },
      { label: `Chữ khi rê chuột ${id} (EN)`, value: settings.social.tooltips[id].en },
    ]),
  ]
}

export async function saveSiteSettingsAction(input: SiteSettings) {
  const session = await requireUsableAdminSession()

  const result = validateSiteSettings(input)
  if (!result.ok) return result

  const current = await getSiteSettings()
  const next = {
    ...result.data,
    notifications: current.notifications,
  }
  const previousFields = settingsAuditFields(current)
  const nextFields = settingsAuditFields(next)
  await writeSiteSettings(next)
  await recordAudit(session, {
    action: "update",
    area: "settings",
    entityLabel: "Cài đặt chung",
    summary: "Cập nhật cài đặt chung",
    changes: diffFields(
      nextFields.map((field, index) => ({
        label: field.label,
        before: previousFields[index]?.value,
        after: field.value,
      }))
    ),
  })
  await revalidateAdmin(["/"])
  return actionOk()
}
