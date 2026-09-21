"use client"

import { useState, useTransition, type FormEvent, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { saveSiteSettingsAction } from "@/app/admin/(dashboard)/settings/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  validateSiteSettings,
  type SiteSettings,
} from "@/lib/site-settings"
import { toastError, toastSuccess } from "@/lib/admin-toast"

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-xs">
      <div className="mb-5">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export function SettingsForm({
  defaultValues,
}: {
  defaultValues: SiteSettings
}) {
  const router = useRouter()
  const [values, setValues] = useState(defaultValues)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const result = validateSiteSettings(values)
    if (!result.ok) {
      toastError(result.error)
      return
    }

    setValues(result.data)

    startTransition(async () => {
      const response = await saveSiteSettingsAction(result.data)
      if (!response.ok) {
        toastError(response.error)
        return
      }

      toastSuccess(
        "Đã lưu cài đặt.",
        "Thông tin mới sẽ hiện trên website."
      )
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-8">
      <SettingsSection
        title="Liên hệ"
        description="Hotline, email, Zalo, Facebook và Instagram dùng cho footer và thanh liên hệ nổi bên phải."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="settings-hotline"
            label="Hotline"
            hint="Hiện trên footer và nút gọi điện."
          >
            <Input
              id="settings-hotline"
              name="hotline"
              type="tel"
              value={values.contact.hotline}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  contact: { ...current.contact, hotline: event.target.value },
                }))
              }
              placeholder="0902 678 114"
              required
            />
          </Field>

          <Field
            id="settings-email"
            label="Email"
            hint="Hiện trên footer và nút Gmail."
          >
            <Input
              id="settings-email"
              name="email"
              type="email"
              value={values.contact.email}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  contact: { ...current.contact, email: event.target.value },
                }))
              }
              placeholder="info@linhouse.com.vn"
              required
            />
          </Field>

          <Field
            id="settings-zalo"
            label="Zalo"
            hint="Số điện thoại hoặc link https://zalo.me/.... Để trống sẽ dùng hotline."
          >
            <Input
              id="settings-zalo"
              name="zalo"
              value={values.contact.zalo}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  contact: { ...current.contact, zalo: event.target.value },
                }))
              }
              placeholder="0902678114"
            />
          </Field>

          <Field
            id="settings-facebook"
            label="Facebook"
            hint="Nút Facebook trên thanh liên hệ nổi. Để trống để ẩn nút."
          >
            <Input
              id="settings-facebook"
              name="facebookUrl"
              type="url"
              value={values.social.facebookUrl}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  social: { ...current.social, facebookUrl: event.target.value },
                }))
              }
              placeholder="https://www.facebook.com/linhousebigsize"
            />
          </Field>

          <Field
            id="settings-instagram"
            label="Instagram"
            hint="Nút Instagram trên thanh liên hệ nổi. Để trống để ẩn nút."
          >
            <Input
              id="settings-instagram"
              name="instagramUrl"
              type="url"
              value={values.social.instagramUrl}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  social: { ...current.social, instagramUrl: event.target.value },
                }))
              }
              placeholder="https://www.instagram.com/linhouse.bridal"
            />
          </Field>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Địa chỉ"
        description="Địa chỉ showroom và vị trí Google Map ở cuối trang."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="settings-address-vi" label="Địa chỉ (Tiếng Việt)">
            <Textarea
              id="settings-address-vi"
              name="addressVi"
              value={values.address.vi}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  address: { ...current.address, vi: event.target.value },
                }))
              }
              placeholder="45 Nguyễn Trọng Tuyển, Phường 15, Phú Nhuận, Tp. Hồ Chí Minh"
              rows={3}
              required
            />
          </Field>

          <Field
            id="settings-address-en"
            label="Địa chỉ (English)"
            hint="Để trống sẽ dùng địa chỉ tiếng Việt trên bản tiếng Anh."
          >
            <Textarea
              id="settings-address-en"
              name="addressEn"
              value={values.address.en}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  address: { ...current.address, en: event.target.value },
                }))
              }
              placeholder="45 Nguyen Trong Tuyen, Ward 15, Phu Nhuan, Ho Chi Minh City"
              rows={3}
            />
          </Field>

          <Field
            id="settings-map-query"
            label="Vị trí Google Map"
            hint="Từ khóa tìm trên Google Maps. Để trống sẽ dùng địa chỉ tiếng Việt."
          >
            <Input
              id="settings-map-query"
              name="mapQuery"
              value={values.address.mapQuery}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  address: { ...current.address, mapQuery: event.target.value },
                }))
              }
              placeholder="45 Nguyễn Trọng Tuyển, Phú Nhuận, Hồ Chí Minh"
              className="sm:col-span-2"
            />
          </Field>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Thông tin doanh nghiệp"
        description="Tên thương hiệu và thông tin pháp lý hiển thị ở cột công ty trên footer."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="settings-brand-name" label="Tên thương hiệu">
            <Input
              id="settings-brand-name"
              name="brandName"
              value={values.business.brandName}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  business: { ...current.business, brandName: event.target.value },
                }))
              }
              placeholder="LINHouse"
              required
            />
          </Field>

          <Field id="settings-legal-name" label="Tên doanh nghiệp">
            <Input
              id="settings-legal-name"
              name="legalName"
              value={values.business.legalName}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  business: { ...current.business, legalName: event.target.value },
                }))
              }
              placeholder="Công ty TNHH ..."
            />
          </Field>

          <Field id="settings-tax-code" label="Mã số thuế">
            <Input
              id="settings-tax-code"
              name="taxCode"
              value={values.business.taxCode}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  business: { ...current.business, taxCode: event.target.value },
                }))
              }
              placeholder="0xxxxxxxxxx"
            />
          </Field>

          <Field id="settings-representative" label="Người đại diện">
            <Input
              id="settings-representative"
              name="representative"
              value={values.business.representative}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  business: {
                    ...current.business,
                    representative: event.target.value,
                  },
                }))
              }
              placeholder="Nguyễn Văn A"
            />
          </Field>

          <Field
            id="settings-license"
            label="Giấy phép kinh doanh"
            hint="Số giấy phép hoặc thông tin đăng ký kinh doanh."
          >
            <Input
              id="settings-license"
              name="licenseNumber"
              value={values.business.licenseNumber}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  business: {
                    ...current.business,
                    licenseNumber: event.target.value,
                  },
                }))
              }
              placeholder="Giấy phép số ..."
            />
          </Field>

          <Field id="settings-hours-vi" label="Giờ làm việc (Tiếng Việt)">
            <Input
              id="settings-hours-vi"
              name="workingHoursVi"
              value={values.business.workingHours.vi}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  business: {
                    ...current.business,
                    workingHours: {
                      ...current.business.workingHours,
                      vi: event.target.value,
                    },
                  },
                }))
              }
              placeholder="09:00 – 21:00 (Thứ 2 – Chủ nhật)"
            />
          </Field>

          <Field
            id="settings-hours-en"
            label="Giờ làm việc (English)"
            hint="Để trống sẽ dùng giờ tiếng Việt trên bản tiếng Anh."
          >
            <Input
              id="settings-hours-en"
              name="workingHoursEn"
              value={values.business.workingHours.en}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  business: {
                    ...current.business,
                    workingHours: {
                      ...current.business.workingHours,
                      en: event.target.value,
                    },
                  },
                }))
              }
              placeholder="09:00 – 21:00 (Monday – Sunday)"
            />
          </Field>
        </div>
      </SettingsSection>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Đang lưu..." : "Lưu cài đặt"}
        </Button>
      </div>
    </form>
  )
}
