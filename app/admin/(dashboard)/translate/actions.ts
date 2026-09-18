"use server"

import { createOpenAI } from "@ai-sdk/openai"
import { generateText } from "ai"
import {
  actionFail,
  actionOk,
  type ActionResult,
} from "@/lib/admin-actions"
import { requireUsableAdminSession } from "@/lib/admin-session"
import { sanitizePlainText } from "@/lib/sanitize-content"

const TRANSLATE_MODEL = "gpt-4o-mini"
const MAX_SOURCE_LENGTH = 4000
const OPENAI_KEY_URL = "https://platform.openai.com/api-keys"

function toTranslateError(error: unknown) {
  const message = error instanceof Error ? error.message : ""
  if (/incorrect api key|invalid api key|unauthorized|authentication/i.test(message)) {
    return `OpenAI từ chối khóa API. Tạo khóa mới tại ${OPENAI_KEY_URL} rồi thêm vào OPENAI_API_KEY và restart máy chủ dev.`
  }
  if (/insufficient_quota|exceeded your current quota|billing/i.test(message)) {
    return "Tài khoản OpenAI hết hạn mức. Kiểm tra billing tại https://platform.openai.com/account/billing rồi thử lại."
  }
  if (/rate limit/i.test(message)) {
    return "OpenAI đang giới hạn tốc độ. Vui lòng thử lại sau vài giây."
  }
  return "Không dịch được. Vui lòng thử lại sau."
}

export async function translateViToEnAction(
  text: string
): Promise<ActionResult<{ text: string }>> {
  await requireUsableAdminSession()

  const source = text.trim()
  if (!source) {
    return actionFail("Vui lòng nhập nội dung tiếng Việt trước.")
  }
  if (source.length > MAX_SOURCE_LENGTH) {
    return actionFail(
      `Nội dung quá dài để dịch tự động (tối đa ${MAX_SOURCE_LENGTH} ký tự).`
    )
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    return actionFail(
      `Chưa cấu hình OPENAI_API_KEY. Tạo khóa tại ${OPENAI_KEY_URL} rồi thêm vào .env.local và restart máy chủ.`
    )
  }

  try {
    const openai = createOpenAI({ apiKey })
    const { text: translated } = await generateText({
      model: openai(TRANSLATE_MODEL),
      instructions:
        "You translate Vietnamese wedding-atelier copy into natural English. Return only the translation with no quotes, labels, or commentary. Preserve tone and meaning.",
      prompt: source,
    })

    const result = sanitizePlainText(translated)
    if (!result) return actionFail("Không nhận được bản dịch.")
    return actionOk({ text: result })
  } catch (error) {
    console.error("translateViToEnAction failed", error)
    return actionFail(toTranslateError(error))
  }
}
