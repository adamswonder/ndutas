import "server-only"

import { makeRecordStkResult } from "@/core/application/record-stk-result"
import {
  makeGetOrder,
  makeRetryPayment,
  makeSubmitManualPayment,
} from "@/core/application/manage-order"
import { makePlaceOrder } from "@/core/application/place-order"
import type { Clock, IdGenerator, PaymentGateway } from "@/core/application/ports"
import { StaticCatalog } from "@/infrastructure/catalog/static-catalog"
import { meals } from "@/infrastructure/catalog/meals-data"
import { InMemoryOrderRepository } from "@/infrastructure/orders/in-memory-order-repository"
import { ManualMpesaGateway } from "@/infrastructure/payments/manual-mpesa-gateway"
import { MockStkGateway } from "@/infrastructure/payments/mock-stk-gateway"

// Composition root: the only place that knows which adapters back each port.
function build() {
  const catalog = new StaticCatalog(meals)
  const orders = new InMemoryOrderRepository()
  const clock: Clock = { now: () => new Date() }
  const ids: IdGenerator = {
    orderId: () => crypto.randomUUID(),
    orderReference: () => `NDT-${crypto.randomUUID().slice(0, 5).toUpperCase()}`,
  }

  const recordStkResult = makeRecordStkResult({ orders, clock })

  // PAYMENT_METHOD=manual for Send Money / Pochi; anything else is STK push.
  // Phase 2: replace MockStkGateway with the Daraja adapter.
  const gateway: PaymentGateway =
    process.env.PAYMENT_METHOD === "manual"
      ? new ManualMpesaGateway(
          process.env.MPESA_PAY_TO ?? "0700 000 000",
          process.env.MPESA_PAY_TO_NAME ?? "Ndutas Kitchen"
        )
      : new MockStkGateway(recordStkResult)

  const deps = { catalog, orders, gateway, ids, clock }
  return {
    catalog,
    placeOrder: makePlaceOrder(deps),
    getOrder: makeGetOrder(deps),
    submitManualPayment: makeSubmitManualPayment(deps),
    retryPayment: makeRetryPayment(deps),
    recordStkResult,
  }
}

// Kept on globalThis so dev hot reloads and separate route bundles share one in-memory store.
const globalForContainer = globalThis as { __ndutasContainer?: ReturnType<typeof build> }

export function container() {
  globalForContainer.__ndutasContainer ??= build()
  return globalForContainer.__ndutasContainer
}
