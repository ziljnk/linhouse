import { NextResponse } from "next/server"
import {
  getAdminSession,
  needsPasswordChange,
} from "@/lib/admin-session"
import { saveCmsImageVariants } from "@/lib/cms-image-storage"
import { getImageUrl, isCmsImageType } from "@/lib/cms-image"
import {
  MAX_IMAGE_FILE_SIZE,
  validateImageFile,
} from "@/lib/image-file"
import {
  promotionImageErrorMessage,
  validatePromotionImageFile,
} from "@/lib/promotion-popup"

export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session || needsPasswordChange(session.user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Thiếu file ảnh." }, { status: 400 })
  }
  const file = formData.get("file")
  const type = String(formData.get("type") ?? "")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Thiếu file ảnh." }, { status: 400 })
  }

  if (!isCmsImageType(type)) {
    return NextResponse.json(
      { error: "Loại ảnh không hợp lệ." },
      { status: 400 }
    )
  }

  const promotionUpload = type === "promotions"
  const validation = promotionUpload
    ? await validatePromotionImageFile(file)
    : await validateImageFile(file, {
        maxSize: MAX_IMAGE_FILE_SIZE,
      })
  if (!validation.ok) {
    if (promotionUpload) {
      return NextResponse.json(
        { error: promotionImageErrorMessage(validation.reason) },
        { status: 400 }
      )
    }
    if (validation.reason === "size") {
      return NextResponse.json(
        { error: "Ảnh vượt quá 10MB." },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Định dạng ảnh không hỗ trợ." },
      { status: 400 }
    )
  }

  try {
    // The browser already resized and compressed the file. Variant writes
    // only build the srcset the storefront already serves, and skip a
    // re-encode when the upload is an oriented WebP that would not shrink.
    const saved = await saveCmsImageVariants(
      Buffer.from(await file.arrayBuffer()),
      type
    )
    return NextResponse.json({
      id: saved.id,
      storageKey: saved.storageKey,
      width: saved.width,
      height: saved.height,
      format: saved.format,
      url: getImageUrl(saved.storageKey),
    })
  } catch (error) {
    console.error("CMS image upload failed", error)
    return NextResponse.json(
      { error: "Không xử lý được ảnh." },
      { status: 500 }
    )
  }
}
