// Shrinks a photo in the browser before it is uploaded, so Vercel Blob only ever stores
// small files: at most 1200 px on the long side, WebP (JPEG where WebP can't be encoded),
// stepping the quality down until it is under 300 KB.
export const MAX_PHOTO_SIDE = 1200
export const TARGET_PHOTO_BYTES = 300 * 1024
// Phones take big photos; anything larger than this is very likely not a photo.
export const MAX_ORIGINAL_BYTES = 20 * 1024 * 1024

export class PhotoError extends Error {}

export async function shrinkImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new PhotoError("Choose a photo (JPEG, PNG or WebP).")
  if (file.size > MAX_ORIGINAL_BYTES) throw new PhotoError("That photo is over 20 MB. Choose a smaller one.")

  let bitmap: ImageBitmap
  try {
    // "from-image" respects the camera's rotation, so phone photos aren't sideways.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
  } catch {
    throw new PhotoError("This browser can't read that photo. Try a JPEG or PNG.")
  }

  const scale = Math.min(1, MAX_PHOTO_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const context = canvas.getContext("2d")
  if (!context) throw new PhotoError("Couldn't prepare the photo. Please try again.")
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const encode = (type: string, quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))

  // Browsers that can't encode WebP hand back a PNG instead; use JPEG for those.
  const probe = await encode("image/webp", 0.8)
  const type = probe?.type === "image/webp" ? "image/webp" : "image/jpeg"

  let best: Blob | null = null
  for (const quality of [0.82, 0.74, 0.66, 0.58, 0.5]) {
    best = await encode(type, quality)
    if (best && best.size <= TARGET_PHOTO_BYTES) break
  }
  if (!best) throw new PhotoError("Couldn't prepare the photo. Please try again.")
  return best
}

export function formatBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
