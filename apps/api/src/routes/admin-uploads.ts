import type { UploadResponse } from "@ndutas/core"
import express, { Router } from "express"
import type { Container } from "../container.js"
import { HttpError } from "../errors.js"
import { detectImageType, IMAGE_TYPES, MAX_UPLOAD_BYTES } from "../uploads.js"
import { requireRole } from "./guards.js"

// /admin/uploads: the owner uploads a product photo as the raw request body
// (Content-Type image/webp, image/jpeg or image/png) and gets back its public URL.
export function adminUploadRoutes(container: Container) {
  const router = Router()

  router.post(
    "/product-image",
    requireRole("owner"),
    express.raw({ type: [...IMAGE_TYPES], limit: MAX_UPLOAD_BYTES }),
    async (req, res) => {
      if (!container.images) throw new HttpError(503, "Photo uploads aren't set up yet. Paste a photo link instead.")
      const data = req.body
      if (!Buffer.isBuffer(data) || data.length === 0) {
        throw new HttpError(400, "Choose a JPEG, PNG or WebP photo.")
      }
      const type = detectImageType(data)
      if (!type) throw new HttpError(400, "That file isn't a JPEG, PNG or WebP photo.")
      const url = await container.images.save(data, type)
      res.status(201).json({ url } satisfies UploadResponse)
    }
  )

  return router
}
