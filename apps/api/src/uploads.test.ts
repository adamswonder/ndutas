import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import { createApiServer } from "./http-server.js"
import { createTestContainer } from "./test-support.js"
import { detectImageType, MAX_UPLOAD_BYTES } from "./uploads.js"

const { config, container } = await createTestContainer()
const server = createApiServer(container, config)
const tokens: Record<string, string> = {}

// A real 1×1 PNG.
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64"
)

beforeAll(async () => {
  for (const role of ["owner", "staff"] as const) {
    const member = { email: `${role}@example.com`, name: role, password: "correct horse battery", role }
    await container.createStaff(member)
    tokens[role] = `Bearer ${(await request(server).post("/admin/login").send(member)).body.token}`
  }
})

describe("product photo uploads", () => {
  it("recognises images by their bytes", () => {
    expect(detectImageType(png)).toBe("image/png")
    expect(detectImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg")
    expect(detectImageType(Buffer.from("RIFF0000WEBPVP8 ", "ascii"))).toBe("image/webp")
    expect(detectImageType(Buffer.from("<svg></svg>"))).toBeNull()
  })

  it("lets only the owner upload", async () => {
    await request(server)
      .post("/admin/uploads/product-image")
      .set("authorization", tokens.staff)
      .set("content-type", "image/png")
      .send(png)
      .expect(403)
  })

  it("stores the photo and serves it back", async () => {
    const res = await request(server)
      .post("/admin/uploads/product-image")
      .set("authorization", tokens.owner)
      .set("content-type", "image/png")
      .send(png)
      .expect(201)
    expect(res.body.url).toMatch(/^http:\/\/localhost:4000\/uploads\/products\/[0-9a-f-]+\.png$/)
    const served = await request(server).get(new URL(res.body.url).pathname).expect(200)
    expect(served.headers["content-type"]).toBe("image/png")
    expect(Buffer.from(served.body).equals(png)).toBe(true)
  })

  it("refuses files that only pretend to be images, and oversized ones", async () => {
    await request(server)
      .post("/admin/uploads/product-image")
      .set("authorization", tokens.owner)
      .set("content-type", "image/png")
      .send(Buffer.from("<script>alert(1)</script>"))
      .expect(400)
    const big = Buffer.concat([png, Buffer.alloc(MAX_UPLOAD_BYTES)])
    const res = await request(server)
      .post("/admin/uploads/product-image")
      .set("authorization", tokens.owner)
      .set("content-type", "image/png")
      .send(big)
      .expect(413)
    expect(res.body.error).toMatch(/600 KB/)
  })
})
