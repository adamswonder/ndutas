import "server-only"

import { makeRecordStkResult } from "@/core/application/record-stk-result"
import {
  makeConfirmManualPayment,
  makeGetOrder,
  makeRejectManualPayment,
  makeRetryPayment,
} from "@/core/application/manage-order"
import { makePlaceOrder } from "@/core/application/place-order"
import type { Clock, IdGenerator, PaymentGateway } from "@/core/application/ports"
import type { Order } from "@/core/domain/order"
import { StaticCatalog } from "@/infrastructure/catalog/static-catalog"
import { meals } from "@/infrastructure/catalog/meals-data"
import { InMemoryOrderRepository } from "@/infrastructure/orders/in-memory-order-repository"
import { ManualMpesaGateway } from "@/infrastructure/payments/manual-mpesa-gateway"
import { MockStkGateway } from "@/infrastructure/payments/mock-stk-gateway"

// Composition root: the only place that knows which adapters back each port.
function build() {
  const catalog = new StaticCatalog(meals)
  const orders = new InMemoryOrderRepository(store())
  const clock: Clock = { now: () => new Date() }
  const ids: IdGenerator = {
    orderId: () => crypto.randomUUID(),
    orderReference: () => `NDT-${crypto.randomUUID().slice(0, 5).toUpperCase()}`,
  }

  const recordStkResult = makeRecordStkResult({ orders, clock })

  // Pochi la Biashara by default, since there is no Till/Paybill yet. Set PAYMENT_METHOD=stk
  // once one exists; checkout then sends an M-Pesa prompt instead of showing the Pochi steps.
  // Phase 2: replace MockStkGateway with the Daraja adapter.
  const gateway: PaymentGateway =
    process.env.PAYMENT_METHOD === "stk"
      ? new MockStkGateway(recordStkResult)
      : new ManualMpesaGateway(
          process.env.MPESA_PAY_TO ?? "0796929502",
          process.env.MPESA_PAY_TO_NAME ?? "Ndutas Kitchen"
        )

  const deps = { catalog, orders, gateway, ids, clock }
  return {
    catalog,
    paymentSetup: gateway.describe(),
    placeOrder: makePlaceOrder(deps),
    getOrder: makeGetOrder(deps),
    retryPayment: makeRetryPayment(deps),
    recordStkResult,
    // For the back office (not built yet).
    confirmManualPayment: makeConfirmManualPayment(deps),
    rejectManualPayment: makeRejectManualPayment(deps),
  }
}

// Only the order data lives on globalThis, so dev hot reloads and separate route bundles
// share one in-memory store. The wiring above is rebuilt whenever this module loads, so code
// changes take effect without a restart (caching the whole container served stale shapes).
const shared = globalThis as { __ndutasOrders?: Map<string, Order> }

function store() {
  shared.__ndutasOrders ??= new Map()
  return shared.__ndutasOrders
}

let instance: ReturnType<typeof build> | undefined

export function container() {
  instance ??= build()
  return instance
}
