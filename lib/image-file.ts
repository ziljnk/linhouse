export const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const

export type AcceptedImageType = (typeof ACCEPTED_IMAGE_TYPES)[number]

export const IMAGE_EXTENSIONS: Record<AcceptedImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
}

const ACCEPTED_IMAGE_TYPE_SET = new Set<string>(ACCEPTED_IMAGE_TYPES)

const HEADER_BYTES = 64

function matches(bytes: Uint8Array, offset: number, signature: number[]) {
  if (bytes.length < offset + signature.length) return false
  return signature.every((value, index) => bytes[offset + index] === value)
}

function ascii(bytes: Uint8Array, offset: number, length: number) {
  if (bytes.length < offset + length) return ""
  return String.fromCharCode(...bytes.subarray(offset, offset + length))
}

function hasIsoBrand(bytes: Uint8Array, brands: string[]) {
  // ISO BMFF: size(4) + "ftyp"(4) + major_brand(4) + minor_version(4) + compatible_brands...
  if (ascii(bytes, 4, 4) !== "ftyp") return false
  const major = ascii(bytes, 8, 4)
  if (brands.includes(major)) return true

  for (let offset = 16; offset + 4 <= bytes.length; offset += 4) {
    if (brands.includes(ascii(bytes, offset, 4))) return true
  }
  return false
}

export function isAcceptedImageType(type: string): type is AcceptedImageType {
  return ACCEPTED_IMAGE_TYPE_SET.has(type)
}

export function detectImageTypeFromBytes(
  bytes: Uint8Array
): AcceptedImageType | null {
  if (matches(bytes, 0, [0xff, 0xd8, 0xff])) return "image/jpeg"
  if (matches(bytes, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png"
  }
  if (ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a") {
    return "image/gif"
  }
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") {
    return "image/webp"
  }
  if (hasIsoBrand(bytes, ["avif", "avis"])) return "image/avif"
  return null
}

export async function readFileHeader(
  file: Blob,
  length = HEADER_BYTES
): Promise<Uint8Array> {
  const slice = file.slice(0, length)
  return new Uint8Array(await slice.arrayBuffer())
}

export type ImageFileValidation =
  | { ok: true; mime: AcceptedImageType }
  | { ok: false; reason: "type" | "size" | "content" }

export async function validateImageFile(
  file: File,
  options?: { maxSize?: number }
): Promise<ImageFileValidation> {
  const maxSize = options?.maxSize ?? MAX_IMAGE_FILE_SIZE

  if (file.size <= 0 || file.size > maxSize) {
    return { ok: false, reason: "size" }
  }

  if (file.type && !isAcceptedImageType(file.type)) {
    return { ok: false, reason: "type" }
  }

  const header = await readFileHeader(file)
  const detected = detectImageTypeFromBytes(header)
  if (!detected) return { ok: false, reason: "content" }

  if (file.type && file.type !== detected) {
    return { ok: false, reason: "content" }
  }

  return { ok: true, mime: detected }
}
