import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { put } from "@vercel/blob"

// Product photos. The back office shrinks them in the browser first (1200 px WebP, about
// 300 KB), so this cap only stops oversized uploads slipping through.
export const MAX_UPLOAD_BYTES = 600 * 1024

export const IMAGE_TYPES = ["image/webp", "image/jpeg", "image/png"] as const
export type ImageType = (typeof IMAGE_TYPES)[number]

const extensions: Record<ImageType, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" }

export interface ImageStore {
  // Saves the photo and returns the public URL to put on the product.
  save(data: Buffer, type: ImageType): Promise<string>
}

// Trust the bytes, not the Content-Type header.
export function detectImageType(data: Buffer): ImageType | null {
  if (data.length >= 12 && data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp"
  }
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return "image/jpeg"
  if (data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png"
  }
  return null
}

function newKey(type: ImageType) {
  return `products/${crypto.randomUUID()}.${extensions[type]}`
}

// Production: Vercel Blob (public URLs on *.public.blob.vercel-storage.com). Without a token,
// @vercel/blob authenticates with Vercel's OIDC token and BLOB_STORE_ID.
export class VercelBlobImageStore implements ImageStore {
  constructor(private readonly token?: string) {}

  async save(data: Buffer, type: ImageType) {
    const blob = await put(newKey(type), data, {
      access: "public",
      contentType: type,
      ...(this.token ? { token: this.token } : {}),
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    })
    return blob.url
  }
}

// Local development: files under LOCAL_UPLOADS_DIR, served by the API at /uploads.
export class LocalImageStore implements ImageStore {
  constructor(
    readonly dir: string,
    private readonly publicBaseUrl: string
  ) {}

  async save(data: Buffer, type: ImageType) {
    const key = newKey(type)
    const file = path.join(this.dir, key)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, data)
    return `${this.publicBaseUrl}/uploads/${key}`
  }
}
