"use client"

import {
  useId,
  useState,
  useTransition,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
} from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { saveSiteSettingsAction } from "@/app/admin/(dashboard)/settings/actions"
import { Eye, EyeOff, GripVertical, Plus, Trash2 } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  DEFAULT_FLOAT_TOOLTIPS,
  DEFAULT_SITE_SETTINGS,
  MAX_CONTACT_METHODS,
  validateSiteSettings,
  type AddressFooterVisibility,
  type BusinessFooterVisibility,
  type FloatIconId,
  type SiteSettings,
} from "@/lib/site-settings"
import { toastError, toastSuccess } from "@/lib/admin-toast"
import { cn } from "@/lib/utils"

const FLOAT_CHANNELS: {
  id: FloatIconId
  icon: string
  name: string
  fieldLabel: string
  hint: string
}[] = [
  {
    id: "whatsapp",
    icon: "/socials/whatsapp.svg",
    name: "WhatsApp",
    fieldLabel: "Số điện thoại",
    hint: "Hiện ở chân trang. Nút WhatsApp cũng dùng số này.",
  },
  {
    id: "gmail",
    icon: "/socials/gmail.svg",
    name: "Email",
    fieldLabel: "Địa chỉ email",
    hint: "Hiện ở chân trang và dùng cho nút Email.",
  },
  {
    id: "zalo",
    icon: "/socials/zalo.svg",
    name: "Zalo",
    fieldLabel: "Số Zalo hoặc đường dẫn",
    hint: "Số điện thoại hoặc đường dẫn https://zalo.me/.... Để trống sẽ dùng số hotline.",
  },
  {
    id: "facebook",
    icon: "/socials/facebook.svg",
    name: "Facebook",
    fieldLabel: "Đường dẫn Facebook",
    hint: "Để trống để ẩn nút Facebook.",
  },
  {
    id: "instagram",
    icon: "/socials/instagram.svg",
    name: "Instagram",
    fieldLabel: "Đường dẫn Instagram",
    hint: "Để trống để ẩn nút Instagram.",
  },
]

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
  footerVisible,
  onFooterVisibleChange,
}: {
  id: string
  label: string
  hint?: string
  children: ReactNode
  footerVisible?: boolean
  onFooterVisibleChange?: (visible: boolean) => void
}) {
  const shown = footerVisible === true

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {onFooterVisibleChange ? (
        <Button
          type="button"
          variant={shown ? "secondary" : "outline"}
          size="xs"
          className="self-start"
          aria-pressed={shown}
          onClick={() => onFooterVisibleChange(!shown)}
        >
          {shown ? <Eye /> : <EyeOff />}
          {shown ? "Hiện trên footer" : "Ẩn trên footer"}
        </Button>
      ) : null}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function SortableContactRow({
  id,
  icon,
  name,
  children,
}: {
  id: FloatIconId
  icon: string
  name: string
  children: ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  return (
    <AccordionItem
      ref={setNodeRef}
      value={id}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "rounded-lg border border-border bg-background",
        isDragging && "z-10 opacity-80 shadow-md"
      )}
    >
      <div className="flex items-center gap-1 px-2 [&>h3]:min-w-0 [&>h3]:flex-1">
        <button
          type="button"
          className="inline-flex size-8 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-muted active:cursor-grabbing"
          aria-label={`Kéo để đổi vị trí ${name}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <AccordionTrigger className="w-full items-center py-2.5 hover:no-underline">
          <span className="flex min-w-0 items-center gap-3">
            <Image
              src={icon}
              alt=""
              width={20}
              height={20}
              className="size-8 shrink-0"
            />
            <span>{name}</span>
          </span>
        </AccordionTrigger>
      </div>
      <AccordionContent className="px-3 [&_a]:no-underline">
        {children}
      </AccordionContent>
    </AccordionItem>
  )
}

function FloatTooltipFields({
  id,
  values,
  setValues,
}: {
  id: FloatIconId
  values: SiteSettings
  setValues: Dispatch<SetStateAction<SiteSettings>>
}) {
  const tooltip = {
    ...DEFAULT_FLOAT_TOOLTIPS[id],
    ...values.social.tooltips?.[id],
  }

  const setTooltip = (locale: "vi" | "en", value: string) => {
    setValues((current) => ({
      ...current,
      social: {
        ...current.social,
        tooltips: {
          ...DEFAULT_FLOAT_TOOLTIPS,
          ...current.social.tooltips,
          [id]: {
            ...DEFAULT_FLOAT_TOOLTIPS[id],
            ...current.social.tooltips?.[id],
            [locale]: value,
          },
        },
      },
    }))
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field
        id={`settings-tooltip-vi-${id}`}
        label="Chữ khi rê chuột (Tiếng Việt)"
        hint="Khách thấy chữ này khi đưa chuột vào nút. Để trống sẽ dùng tên mặc định."
      >
        <Input
          id={`settings-tooltip-vi-${id}`}
          value={tooltip.vi}
          onChange={(event) => setTooltip("vi", event.target.value)}
          placeholder={DEFAULT_FLOAT_TOOLTIPS[id].vi}
        />
      </Field>
      <Field
        id={`settings-tooltip-en-${id}`}
        label="Chữ khi rê chuột (English)"
        hint="Để trống sẽ dùng chữ tiếng Việt."
      >
        <Input
          id={`settings-tooltip-en-${id}`}
          value={tooltip.en}
          onChange={(event) => setTooltip("en", event.target.value)}
          placeholder={DEFAULT_FLOAT_TOOLTIPS[id].en}
        />
      </Field>
    </div>
  )
}

function ContactChannelField({
  id,
  values,
  setValues,
}: {
  id: FloatIconId
  values: SiteSettings
  setValues: Dispatch<SetStateAction<SiteSettings>>
}) {
  const channel = FLOAT_CHANNELS.find((item) => item.id === id)
  if (!channel) return null

  const tooltipFields = (
    <FloatTooltipFields id={id} values={values} setValues={setValues} />
  )

  if (id === "whatsapp") {
    return (
      <div className="flex flex-col gap-3">
      <Field id="settings-hotline" label={channel.fieldLabel} hint={channel.hint}>
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
      {tooltipFields}
      </div>
    )
  }

  if (id === "gmail") {
    return (
      <div className="flex flex-col gap-3">
      <Field id="settings-email" label={channel.fieldLabel} hint={channel.hint}>
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
      {tooltipFields}
      </div>
    )
  }

  if (id === "zalo") {
    return (
      <div className="flex flex-col gap-3">
      <Field id="settings-zalo" label={channel.fieldLabel} hint={channel.hint}>
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
      {tooltipFields}
      </div>
    )
  }

  if (id === "facebook") {
    return (
      <div className="flex flex-col gap-3">
      <Field id="settings-facebook" label={channel.fieldLabel} hint={channel.hint}>
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
      {tooltipFields}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
    <Field id="settings-instagram" label={channel.fieldLabel} hint={channel.hint}>
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
    {tooltipFields}
    </div>
  )
}

export function SettingsForm({
  defaultValues,
}: {
  defaultValues: SiteSettings
}) {
  const router = useRouter()
  const [values, setValues] = useState(() =>
    defaultValues.contactMethods.length > 0
      ? defaultValues
      : {
          ...defaultValues,
          contactMethods: [{ id: "", label: { vi: "", en: "" } }],
        }
  )
  const [isPending, startTransition] = useTransition()
  const floatDndId = useId()
  const floatSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  const floatOrder =
    values.social.floatOrder.length > 0
      ? values.social.floatOrder
      : DEFAULT_SITE_SETTINGS.social.floatOrder

  const handleFloatDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setValues((current) => {
      const order =
        current.social.floatOrder.length > 0
          ? current.social.floatOrder
          : DEFAULT_SITE_SETTINGS.social.floatOrder
      const oldIndex = order.indexOf(active.id as FloatIconId)
      const newIndex = order.indexOf(over.id as FloatIconId)
      if (oldIndex < 0 || newIndex < 0) return current
      return {
        ...current,
        social: {
          ...current.social,
          floatOrder: arrayMove(order, oldIndex, newIndex),
        },
      }
    })
  }

  const footerVisible = {
    ...DEFAULT_SITE_SETTINGS.business.footerVisible,
    ...values.business.footerVisible,
  }

  const addressVisible = {
    ...DEFAULT_SITE_SETTINGS.address.footerVisible,
    ...values.address.footerVisible,
  }

  const setAddressVisible = (
    key: keyof AddressFooterVisibility,
    visible: boolean
  ) => {
    setValues((current) => ({
      ...current,
      address: {
        ...current.address,
        footerVisible: {
          ...DEFAULT_SITE_SETTINGS.address.footerVisible,
          ...current.address.footerVisible,
          [key]: visible,
        },
      },
    }))
  }

  const setFooterVisible = (
    key: keyof BusinessFooterVisibility,
    visible: boolean
  ) => {
    setValues((current) => ({
      ...current,
      business: {
        ...current.business,
        footerVisible: {
          ...DEFAULT_SITE_SETTINGS.business.footerVisible,
          ...current.business.footerVisible,
          [key]: visible,
        },
      },
    }))
  }

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
        description="Dùng cho chân trang và thanh nút nổi bên phải. Bấm vào từng mục để sửa số điện thoại, đường dẫn và chữ hiện khi rê chuột. Kéo tay cầm bên trái để đổi thứ tự."
      >
        <DndContext
          id={floatDndId}
          sensors={floatSensors}
          collisionDetection={closestCenter}
          onDragEnd={handleFloatDragEnd}
        >
          <SortableContext items={floatOrder} strategy={verticalListSortingStrategy}>
            <Accordion multiple defaultValue={[]} className="gap-3">
              {floatOrder.map((id) => {
                const channel = FLOAT_CHANNELS.find((item) => item.id === id)
                if (!channel) return null
                return (
                  <SortableContactRow
                    key={id}
                    id={id}
                    icon={channel.icon}
                    name={channel.name}
                  >
                    <ContactChannelField
                      id={id}
                      values={values}
                      setValues={setValues}
                    />
                  </SortableContactRow>
                )
              })}
            </Accordion>
          </SortableContext>
        </DndContext>
      </SettingsSection>

      <SettingsSection
        title="Phương thức liên lạc"
        description="Danh sách hiện trong form đặt lịch để khách chọn cách LINHouse liên hệ lại. Để trống sẽ ẩn ô chọn."
      >
        <div className="flex flex-col gap-3">
          {values.contactMethods.map((method, index) => (
            <div
              key={method.id || `method-${index}`}
              className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
            >
              <Field
                id={`settings-contact-method-vi-${index}`}
                label="Tên (Tiếng Việt)"
              >
                <Input
                  id={`settings-contact-method-vi-${index}`}
                  value={method.label.vi}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      contactMethods: current.contactMethods.map(
                        (item, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...item,
                                label: {
                                  ...item.label,
                                  vi: event.target.value,
                                },
                              }
                            : item
                      ),
                    }))
                  }
                  placeholder="Zalo"
                />
              </Field>
              <Field
                id={`settings-contact-method-en-${index}`}
                label="Tên (English)"
              >
                <Input
                  id={`settings-contact-method-en-${index}`}
                  value={method.label.en}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      contactMethods: current.contactMethods.map(
                        (item, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...item,
                                label: {
                                  ...item.label,
                                  en: event.target.value,
                                },
                              }
                            : item
                      ),
                    }))
                  }
                  placeholder="Zalo"
                />
              </Field>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                aria-label={`Xóa phương thức ${index + 1}`}
                disabled={
                  values.contactMethods.length === 1 &&
                  !method.label.vi &&
                  !method.label.en
                }
                onClick={() =>
                  setValues((current) => {
                    const next = current.contactMethods.filter(
                      (_, itemIndex) => itemIndex !== index
                    )
                    return {
                      ...current,
                      contactMethods:
                        next.length > 0
                          ? next
                          : [{ id: "", label: { vi: "", en: "" } }],
                    }
                  })
                }
              >
                <Trash2 />
              </Button>
            </div>
          ))}

          <div>
            <Button
              type="button"
              variant="outline"
              disabled={values.contactMethods.length >= MAX_CONTACT_METHODS}
              onClick={() => {
                if (values.contactMethods.length >= MAX_CONTACT_METHODS) return
                setValues((current) => ({
                  ...current,
                  contactMethods: [
                    ...current.contactMethods,
                    { id: "", label: { vi: "", en: "" } },
                  ],
                }))
              }}
            >
              <Plus />
              Thêm phương thức
            </Button>
            {values.contactMethods.length >= MAX_CONTACT_METHODS ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Tối đa {MAX_CONTACT_METHODS} phương thức liên lạc.
              </p>
            ) : null}
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Địa chỉ"
        description="Địa chỉ cửa hàng dùng cho đặt lịch. Địa chỉ công ty và bản đồ chỉ hiện trên footer khi bật Hiện trên footer và đã có nội dung."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="settings-address-vi"
            label="Địa chỉ cửa hàng (Tiếng Việt)"
            hint="Dùng cho đặt lịch. Nút này chỉ ẩn hoặc hiện dòng địa chỉ cửa hàng trên footer."
            footerVisible={addressVisible.store}
            onFooterVisibleChange={(visible) =>
              setAddressVisible("store", visible)
            }
          >
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
            label="Địa chỉ cửa hàng (English)"
            hint="Để trống sẽ dùng địa chỉ cửa hàng tiếng Việt trên bản tiếng Anh."
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
            id="settings-company-address-vi"
            label="Địa chỉ công ty (Tiếng Việt)"
            footerVisible={addressVisible.company}
            onFooterVisibleChange={(visible) =>
              setAddressVisible("company", visible)
            }
          >
            <Textarea
              id="settings-company-address-vi"
              name="companyAddressVi"
              value={values.address.company?.vi ?? ""}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  address: {
                    ...current.address,
                    company: {
                      vi: event.target.value,
                      en: current.address.company?.en ?? "",
                    },
                  },
                }))
              }
              placeholder="Địa chỉ đăng ký doanh nghiệp"
              rows={3}
            />
          </Field>

          <Field
            id="settings-company-address-en"
            label="Địa chỉ công ty (English)"
            hint="Để trống sẽ dùng địa chỉ công ty tiếng Việt trên bản tiếng Anh."
          >
            <Textarea
              id="settings-company-address-en"
              name="companyAddressEn"
              value={values.address.company?.en ?? ""}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  address: {
                    ...current.address,
                    company: {
                      vi: current.address.company?.vi ?? "",
                      en: event.target.value,
                    },
                  },
                }))
              }
              placeholder="Registered company address"
              rows={3}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field
              id="settings-map-query"
              label="Vị trí Google Map"
              hint="Từ khóa tìm trên Google Maps. Để trống sẽ dùng địa chỉ cửa hàng tiếng Việt. Nút này ẩn hoặc hiện khối bản đồ trên footer."
              footerVisible={addressVisible.map}
              onFooterVisibleChange={(visible) =>
                setAddressVisible("map", visible)
              }
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
              />
            </Field>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Thông tin doanh nghiệp"
        description="Tên thương hiệu luôn hiện trên footer. Các mục còn lại chỉ hiện khi bật Hiện trên footer và đã có nội dung."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="settings-brand-name"
            label="Tên thương hiệu"
            hint="Luôn hiển thị trên footer."
          >
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

          <Field
            id="settings-legal-name"
            label="Tên doanh nghiệp"
            footerVisible={footerVisible.legalName}
            onFooterVisibleChange={(visible) =>
              setFooterVisible("legalName", visible)
            }
          >
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

          <Field
            id="settings-tax-code"
            label="Mã số thuế"
            footerVisible={footerVisible.taxCode}
            onFooterVisibleChange={(visible) =>
              setFooterVisible("taxCode", visible)
            }
          >
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

          <Field
            id="settings-representative"
            label="Người đại diện"
            footerVisible={footerVisible.representative}
            onFooterVisibleChange={(visible) =>
              setFooterVisible("representative", visible)
            }
          >
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
            footerVisible={footerVisible.licenseNumber}
            onFooterVisibleChange={(visible) =>
              setFooterVisible("licenseNumber", visible)
            }
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

          <Field
            id="settings-hours-vi"
            label="Giờ làm việc (Tiếng Việt)"
            hint="Nút này điều khiển giờ làm việc trên cả bản tiếng Việt và tiếng Anh."
            footerVisible={footerVisible.workingHours}
            onFooterVisibleChange={(visible) =>
              setFooterVisible("workingHours", visible)
            }
          >
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
