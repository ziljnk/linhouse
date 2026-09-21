export type AppointmentMailInput = {
  name: string
  phone: string
  email: string
  store: string
  preferredDate: string
  preferredTime: string
  message: string
  locale: string
  product?: {
    slug: string
    name: string
    code: string
    url: string
  } | null
}

const BRAND = {
  name: "LINHouse",
  tagline: "Bigsize Bridal",
  site: "linhouse.com.vn",
  burgundy: "#59060f",
  burgundyMid: "#7a1020",
  gold: "#b08d57",
  ivory: "#fbf7f2",
  charcoal: "#2b2420",
  muted: "#8a7d74",
  line: "#eadfd3",
  page: "#f3eee8",
} as const

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function escapeHtmlMultiline(value: string) {
  return escapeHtml(value).replaceAll("\n", "<br>")
}

function localeLabel(locale: string) {
  return locale === "en" ? "English" : "Tiếng Việt"
}

function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`
}

function formatPreferredDateTime(date: string, time: string) {
  const [year, month, day] = date.split("-")
  if (!year || !month || !day) return [date, time].filter(Boolean).join(" ")

  const parsed = new Date(Number(year), Number(month) - 1, Number(day))
  if (Number.isNaN(parsed.getTime())) {
    return time ? `${day}/${month}/${year} ${time}` : `${day}/${month}/${year}`
  }

  const weekday = new Intl.DateTimeFormat("vi-VN", { weekday: "long" }).format(
    parsed
  )
  const labeled = `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${day}/${month}/${year}`
  return time ? `${labeled} · ${time}` : labeled
}

function headerSafe(value: string) {
  return value.replace(/[\u0000-\u001F\u007F]/g, "").trim()
}

function appointmentSubject(appointment: AppointmentMailInput) {
  const [year, month, day] = appointment.preferredDate.split("-")
  const dateShort =
    day && month ? `${day}/${month}` : appointment.preferredDate
  const when = appointment.preferredTime
    ? `${dateShort} ${appointment.preferredTime}`
    : dateShort
  const productName = headerSafe(appointment.product?.name ?? "")
  if (productName) {
    return `${BRAND.name} · Tư vấn: ${productName} — ${headerSafe(appointment.name)} — ${when}`
  }
  return `${BRAND.name} · Lịch hẹn mới: ${headerSafe(appointment.name)} — ${when}`
}

function detailRow(label: string, valueHtml: string, last = false) {
  const border = last ? "none" : `1px solid ${BRAND.line}`
  return `<tr>
    <td style="padding:14px 0;border-bottom:${border};width:148px;vertical-align:top;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.04em;color:${BRAND.muted};">${label}</td>
    <td style="padding:14px 0;border-bottom:${border};font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.5;color:${BRAND.charcoal};">${valueHtml}</td>
  </tr>`
}

export function buildAppointmentEmail(appointment: AppointmentMailInput) {
  const when = formatPreferredDateTime(
    appointment.preferredDate,
    appointment.preferredTime
  )
  const hasMessage = Boolean(appointment.message.trim())
  const message = hasMessage
    ? appointment.message.trim()
    : "Không có lời nhắn."
  const language = localeLabel(appointment.locale)
  const name = escapeHtml(appointment.name)
  const store = escapeHtml(appointment.store)
  const phone = escapeHtml(appointment.phone)
  const email = escapeHtml(appointment.email)
  const product = appointment.product
  const productName = product ? escapeHtml(product.name) : ""
  const productCode = product?.code ? escapeHtml(product.code) : ""
  const productUrl = product?.url ? escapeHtml(product.url) : ""
  const preheader = product
    ? `${appointment.name} hỏi tư vấn ${product.name} — hẹn ${when}.`
    : `${appointment.name} đặt lịch ${when} tại ${appointment.store}.`

  const text = [
    `${BRAND.name.toUpperCase()} — LỊCH HẸN MỚI`,
    "—".repeat(36),
    "Có khách vừa đặt lịch từ website. Vui lòng xác nhận và liên hệ lại.",
    "",
    `Thời gian hẹn: ${when}`,
    `Cửa hàng:      ${appointment.store}`,
    ...(product
      ? [
          "",
          "Sản phẩm quan tâm:",
          `  Tên:  ${product.name}`,
          ...(product.code ? [`  Mã:   ${product.code}`] : []),
          `  Link: ${product.url}`,
        ]
      : []),
    "",
    `Họ và tên:     ${appointment.name}`,
    `Điện thoại:    ${appointment.phone}`,
    `Email:         ${appointment.email}`,
    `Ngôn ngữ:      ${language}`,
    "",
    "Lời nhắn:",
    message,
    "",
    "—".repeat(36),
    "Trả lời email này để gửi thư trực tiếp tới khách hàng.",
    `${BRAND.name} ${BRAND.tagline} · ${BRAND.site}`,
  ].join("\n")

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <title>${escapeHtml(appointmentSubject(appointment))}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.page};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${escapeHtml(preheader)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.page};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background-color:#ffffff;">
          <tr>
            <td style="background-color:${BRAND.burgundy};padding:32px 40px;text-align:center;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:${BRAND.gold};">Atelier váy cưới</p>
              <p style="margin:10px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.2;color:${BRAND.ivory};">${BRAND.name}</p>
            </td>
          </tr>
          <tr>
            <td style="height:3px;line-height:3px;font-size:0;background-color:${BRAND.gold};">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:36px 40px 8px;font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${BRAND.gold};">Lịch hẹn mới</p>
              <h1 style="margin:10px 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.3;font-weight:normal;color:${BRAND.burgundy};">Có khách đặt lịch từ website</h1>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:${BRAND.charcoal};">
                <strong>${name}</strong> vừa gửi yêu cầu ${product ? "tư vấn sản phẩm" : "đặt lịch hẹn"}. Vui lòng xác nhận khung giờ và liên hệ lại khách hàng.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.ivory};border:1px solid ${BRAND.line};">
                <tr>
                  <td style="padding:22px 24px;">
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND.gold};">Thời gian hẹn</p>
                    <p style="margin:8px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:1.35;color:${BRAND.burgundy};">${escapeHtml(when)}</p>
                    <p style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:${BRAND.charcoal};">${store}</p>
                  </td>
                </tr>
              </table>
              ${
                product
                  ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;background-color:${BRAND.ivory};border:1px solid ${BRAND.line};">
                <tr>
                  <td style="padding:22px 24px;">
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND.gold};">Sản phẩm quan tâm</p>
                    <p style="margin:8px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.4;color:${BRAND.burgundy};">${productName}</p>
                    ${productCode ? `<p style="margin:6px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.muted};">${productCode}</p>` : ""}
                    <p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;">
                      <a href="${productUrl}" style="color:${BRAND.burgundyMid};text-decoration:none;">Xem sản phẩm trên website →</a>
                    </p>
                  </td>
                </tr>
              </table>`
                  : ""
              }
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;border-collapse:collapse;">
                ${detailRow("Họ và tên", name)}
                ${detailRow(
                  "Điện thoại",
                  `<a href="${telHref(appointment.phone)}" style="color:${BRAND.burgundyMid};text-decoration:none;">${phone}</a>`
                )}
                ${detailRow(
                  "Email",
                  `<a href="mailto:${email}" style="color:${BRAND.burgundyMid};text-decoration:none;">${email}</a>`
                )}
                ${detailRow("Ngôn ngữ", escapeHtml(language), true)}
              </table>
              <p style="margin:28px 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND.gold};">Lời nhắn</p>
              <p style="margin:0;padding:16px 18px;background-color:${BRAND.ivory};border-left:3px solid ${BRAND.gold};font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.65;color:${hasMessage ? BRAND.charcoal : BRAND.muted};font-style:${hasMessage ? "normal" : "italic"};">${escapeHtmlMultiline(message)}</p>
              <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:${BRAND.muted};">
                Trả lời email này để gửi thư trực tiếp tới khách hàng.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 40px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.burgundy};">
                <tr>
                  <td style="padding:20px 24px;text-align:center;">
                    <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:14px;letter-spacing:0.08em;color:${BRAND.ivory};">${BRAND.name} ${BRAND.tagline}</p>
                    <p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#d4c4b8;">Email thông báo tự động từ ${BRAND.site}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject: appointmentSubject(appointment), text, html }
}
