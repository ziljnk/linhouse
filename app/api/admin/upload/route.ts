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

export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session || needsPasswordChange(session.user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
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

  const validation = await validateImageFile(file, {
    maxSize: MAX_IMAGE_FILE_SIZE,
  })
  if (!validation.ok) {
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
