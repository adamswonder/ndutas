import {
  InMemoryOrderRepository,
  InMemoryOwnerRepository,
  makeConfirmManualPayment,
  makeCreateOwner,
  makeGetOrder,
  makeListOrders,
  makeLogIn,
  makePlaceOrder,
  makeRecordStkResult,
  makeRejectManualPayment,
  makeRetryPayment,
  meals,
  StaticCatalog,
  type Clock,
  type IdGenerator,
  type OrderEvents,
  type OrderRepository,
  type OwnerRepository,
  type PaymentGateway,
} from "@ndutas/core"
import { waitUntil } from "@vercel/functions"
import { bcryptHasher, createAuth } from "./auth.js"
import type { Config } from "./config.js"
import { createDb } from "./db/client.js"
import { DrizzleOrderRepository } from "./db/order-repository.js"
import { DrizzleOwnerRepository } from "./db/owner-repository.js"
import { ManualMpesaGateway } from "./payments/manual-mpesa-gateway.js"
import { MockStkGateway } from "./payments/mock-stk-gateway.js"
import { InProcessOrderBus, type OrderFeed } from "./realtime/feed.js"
import { PgListenFeed, PgNotifyEvents } from "./realtime/postgres.js"

// Composition root: the only place that decides which adapters back each port.
// With DATABASE_URL: Neon for storage and LISTEN/NOTIFY for live events across instances.
// Without it (local development, tests): in-memory storage and an in-process event bus.
export function buildContainer(config: Config) {
  let orders: OrderRepository
  let owners: OwnerRepository
  let events: OrderEvents
  let feed: OrderFeed

  if (config.databaseUrl) {
    const db = createDb(config.databaseUrl)
    orders = new DrizzleOrderRepository(db)
    owners = new DrizzleOwnerRepository(db)
    events = new PgNotifyEvents(db)
    feed = new PgListenFeed(config.databaseUrlUnpooled ?? config.databaseUrl)
  } else {
    orders = new InMemoryOrderRepository()
    owners = new InMemoryOwnerRepository()
    const bus = new InProcessOrderBus()
    events = bus
    feed = bus
  }

  const clock: Clock = { now: () => new Date() }
  const ids: IdGenerator & { ownerId(): string } = {
    orderId: () => crypto.randomUUID(),
    orderReference: () => `NDT-${crypto.randomUUID().slice(0, 5).toUpperCase()}`,
    ownerId: () => crypto.randomUUID(),
  }

  const recordStkResult = makeRecordStkResult({ orders, clock, events })
  // Phase 2 (Till/Paybill): replace MockStkGateway with the Daraja adapter.
  const gateway: PaymentGateway =
    config.payment.method === "stk"
      ? new MockStkGateway(recordStkResult, (task) => (process.env.VERCEL ? waitUntil(task) : undefined))
      : new ManualMpesaGateway(config.payment.payTo, config.payment.payToName)

  const deps = { catalog: new StaticCatalog(meals), orders, gateway, ids, clock, events }
  const ownerDeps = { owners, passwords: bcryptHasher, ids, clock }

  return {
    orders,
    owners,
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
    logIn: makeLogIn(ownerDeps),
    createOwner: makeCreateOwner(ownerDeps),
  }
}

export type Container = ReturnType<typeof buildContainer>

// Local development without a database: create the DEV_OWNER_* login on startup.
export async function seedDevOwner(container: Container, config: Config) {
  if (config.databaseUrl || !config.devOwner) return
  if (await container.owners.findByEmail(config.devOwner.email.toLowerCase())) return
  await container.createOwner(config.devOwner)
  console.log(`Dev owner ready: ${config.devOwner.email}`)
}
