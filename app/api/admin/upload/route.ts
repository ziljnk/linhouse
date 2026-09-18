import { randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { NextResponse } from "next/server"
import {
  getAdminSession,
  needsPasswordChange,
} from "@/lib/admin-session"
import {
  IMAGE_EXTENSIONS,
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

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Thiếu file ảnh." }, { status: 400 })
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

  const extension = IMAGE_EXTENSIONS[validation.mime]
  const filename = `${Date.now()}-${randomUUID()}.${extension}`
  const directory = path.join(process.cwd(), "public", "uploads")
  await mkdir(directory, { recursive: true })
  await writeFile(
    path.join(directory, filename),
    Buffer.from(await file.arrayBuffer())
  )

  return NextResponse.json({ url: `/uploads/${filename}` })
}
