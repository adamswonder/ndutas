import {
  makeConfirmManualPayment,
  makeCreateStaff,
  makeGetOrder,
  makeListOrders,
  makeLogIn,
  makePlaceOrder,
  makeRecordStkResult,
  makeRejectManualPayment,
  makeRetryPayment,
  makeArchiveProduct,
  makeCreateProduct,
  makeReorderProducts,
  makeSetProductAvailability,
  makeUpdateProduct,
  type Clock,
  type IdGenerator,
  type PaymentGateway,
} from "@ndutas/core"
import { waitUntil } from "@vercel/functions"
import { bcryptHasher, createAuth } from "./auth.js"
import type { Config } from "./config.js"
import type { Database } from "./db/connect.js"
import { DrizzleOrderRepository } from "./db/order-repository.js"
import { DrizzleProductRepository } from "./db/product-repository.js"
import { DrizzleStaffRepository } from "./db/staff-repository.js"
import { ManualMpesaGateway } from "./payments/manual-mpesa-gateway.js"
import { MockStkGateway } from "./payments/mock-stk-gateway.js"
import { createMenuRevalidator } from "./menu-revalidation.js"
import { LocalImageStore, VercelBlobImageStore, type ImageStore } from "./uploads.js"

// Composition root: the only place that decides which adapters back each port.
// The database (Neon or local PGlite) and its event transport come from connectDatabase().
export function buildContainer(config: Config, { db, events, feed }: Database) {
  const orders = new DrizzleOrderRepository(db)
  const staff = new DrizzleStaffRepository(db)
  const products = new DrizzleProductRepository(db)

  const clock: Clock = { now: () => new Date() }
  const ids: IdGenerator & { staffId(): string } = {
    orderId: () => crypto.randomUUID(),
    orderReference: () => `NDT-${crypto.randomUUID().slice(0, 5).toUpperCase()}`,
    staffId: () => crypto.randomUUID(),
  }

  const recordStkResult = makeRecordStkResult({ orders, clock, events })
  // Phase 2 (Till/Paybill): replace MockStkGateway with the Daraja adapter.
  const gateway: PaymentGateway =
    config.payment.method === "stk"
      ? new MockStkGateway(recordStkResult, (task) => (process.env.VERCEL ? waitUntil(task) : undefined))
      : new ManualMpesaGateway(config.payment.payTo, config.payment.payToName)

  // Vercel Blob in production: with a read-write token, or with BLOB_STORE_ID, where @vercel/blob
  // signs in with the function's OIDC token (only available on Vercel). Locally, a folder the API
  // serves at /uploads. On Vercel with neither there is no store (the file system is read-only),
  // so uploads answer 503.
  const blobReady = !!config.blobToken || (!!process.env.VERCEL && !!config.blobStoreId)
  const images: ImageStore | null = blobReady
    ? new VercelBlobImageStore(config.blobToken)
    : process.env.VERCEL
      ? null
      : new LocalImageStore(config.localUploadsDir, config.publicUrl)

  const deps = { catalog: products, orders, gateway, ids, clock, events }
  const productDeps = { products, clock }
  const staffDeps = { staff, passwords: bcryptHasher, ids, clock }

  return {
    orders,
    staff,
    products,
    images,
    menuChanged: createMenuRevalidator(config),
    createProduct: makeCreateProduct(productDeps),
    updateProduct: makeUpdateProduct(productDeps),
    setProductAvailability: makeSetProductAvailability(productDeps),
    archiveProduct: makeArchiveProduct(productDeps),
    reorderProducts: makeReorderProducts(productDeps),
    feed,
    auth: createAuth(config.jwtSecret),
    paymentSetup: gateway.describe(),
    placeOrder: makePlaceOrder(deps),
    getOrder: makeGetOrder(deps),
    retryPayment: makeRetryPayment(deps),
    recordStkResult,
    listOrders: makeListOrders(deps),
    confirmManualPayment: makeConfirmManualPayment(deps),
    rejectManualPayment: makeRejectManualPayment(deps),
    logIn: makeLogIn(staffDeps),
    createStaff: makeCreateStaff(staffDeps),
  }
}

export type Container = ReturnType<typeof buildContainer>

// Local development on PGlite: create the DEV_OWNER_* owner login on first start.
export async function seedDevOwner(container: Container, config: Config) {
  if (config.databaseUrl || !config.devOwner) return
  if (await container.staff.findByEmail(config.devOwner.email.toLowerCase())) return
  await container.createStaff({ ...config.devOwner, role: "owner" })
  console.log(`Dev owner ready: ${config.devOwner.email}`)
}
