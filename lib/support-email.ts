export type SupportMailInput = {
  name: string
  email: string
  message: string
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

function headerSafe(value: string) {
  return value.replace(/[\u0000-\u001F\u007F]/g, "").trim()
}

export function buildSupportEmail(input: SupportMailInput) {
  const name = escapeHtml(input.name)
  const email = escapeHtml(input.email)
  const message = input.message.trim()
  const subject = `${BRAND.name} · Hỗ trợ khách hàng: ${headerSafe(input.name)}`

  const text = [
    `${BRAND.name.toUpperCase()} — HỖ TRỢ KHÁCH HÀNG`,
    "—".repeat(36),
    "Có khách vừa gửi tin nhắn từ trang hỗ trợ trên website.",
    "",
    `Họ và tên: ${input.name}`,
    `Email:     ${input.email}`,
    "",
    "Nội dung:",
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
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.page};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${name} vừa gửi tin nhắn hỗ trợ.
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
              <p style="margin:0;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${BRAND.gold};">Hỗ trợ khách hàng</p>
              <h1 style="margin:10px 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.3;font-weight:normal;color:${BRAND.burgundy};">Có tin nhắn mới từ website</h1>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:${BRAND.charcoal};">
                <strong>${name}</strong> vừa gửi lời nhắn qua trang hỗ trợ khách hàng.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:14px 0;border-bottom:1px solid ${BRAND.line};width:148px;vertical-align:top;font-size:12px;letter-spacing:0.04em;color:${BRAND.muted};">Họ và tên</td>
                  <td style="padding:14px 0;border-bottom:1px solid ${BRAND.line};font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.5;color:${BRAND.charcoal};">${name}</td>
                </tr>
                <tr>
                  <td style="padding:14px 0;width:148px;vertical-align:top;font-size:12px;letter-spacing:0.04em;color:${BRAND.muted};">Email</td>
                  <td style="padding:14px 0;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.5;color:${BRAND.charcoal};">
                    <a href="mailto:${email}" style="color:${BRAND.burgundyMid};text-decoration:none;">${email}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:28px 0 8px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND.gold};">Nội dung</p>
              <p style="margin:0;padding:16px 18px;background-color:${BRAND.ivory};border-left:3px solid ${BRAND.gold};font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.65;color:${BRAND.charcoal};">${escapeHtmlMultiline(message)}</p>
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

  return { subject, text, html }
}
