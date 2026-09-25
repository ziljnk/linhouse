import { SiteContentForm } from "@/components/admin/site-content-form"
import { requireUsableAdminSession } from "@/lib/admin-session"
import { listAdminAttributeGroups } from "@/lib/admin-storefront"
import { getSiteContentForm, type ContentSection } from "@/lib/site-content"

export const metadata = {
  title: "Nội dung",
}

function withNameTokens(
  sections: ContentSection[],
  groups: Awaited<ReturnType<typeof listAdminAttributeGroups>>
) {
  const tokensFor = (kind: "gown" | "ao-dai") => {
    const matched = groups.filter((group) => group.kind === kind)
    return {
      vi: [
        { label: "Tên", token: "[tên]" },
        ...matched.map((group) => ({
          label: group.labelVi || group.label,
          token: `[${group.labelVi || group.label}]`,
        })),
      ],
      en: [
        { label: "Name", token: "[name]" },
        ...matched.map((group) => ({
          label: group.labelEn || group.label,
          token: `[${group.labelEn || group.label}]`,
        })),
      ],
    }
  }

  return sections.map((section) => {
    if (section.id !== "product") return section
    return {
      ...section,
      fields: section.fields.map((item) => {
        if (item.key === "product.nameFormat") {
          return { ...item, nameTokens: tokensFor("gown") }
        }
        if (item.key === "product.nameFormatAoDai") {
          return { ...item, nameTokens: tokensFor("ao-dai") }
        }
        return item
      }),
    }
  })
}

export default async function AdminContentPage() {
  const [, content, groups] = await Promise.all([
    requireUsableAdminSession(),
    getSiteContentForm(),
    listAdminAttributeGroups(),
  ])

  return (
    <div className="flex w-full flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nội dung</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sửa chữ cố định trên website: trang giới thiệu, chính sách giao hàng, hỗ trợ khách hàng, điều khoản sử dụng, chính sách bảo mật, tiêu đề section và các đoạn mô tả dùng chung.
        </p>
      </div>
      <SiteContentForm
        sections={withNameTokens(content.sections, groups)}
        defaultValues={content.values}
        defaults={content.defaults}
      />
    </div>
  )
}
