import { DomainError } from "../domain/errors"
import { priceCart, setQuantity, type CartLine } from "../domain/cart"
import { createCustomer, createOrder, type Order } from "../domain/order"
import { publishSafely } from "./events"
import type {
  Clock,
  IdGenerator,
  OrderEvents,
  OrderRepository,
  PaymentGateway,
  ProductCatalog,
} from "./ports"
import { startPayment } from "./start-payment"

export type PlaceOrderInput = {
  name: string
  phone: string
  // Only ids and quantities come from the client; prices always come from the catalog.
  items: { productId: string; quantity: number }[]
}

export type PlaceOrderDeps = {
  catalog: ProductCatalog
  orders: OrderRepository
  gateway: PaymentGateway
  ids: IdGenerator
  clock: Clock
  events?: OrderEvents
}

export function makePlaceOrder(deps: PlaceOrderDeps) {
  return async function placeOrder(input: PlaceOrderInput): Promise<Order> {
    const customer = createCustomer(input.name, input.phone)

    let lines: CartLine[] = []
    for (const item of input.items) {
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        throw new DomainError("invalid_quantity", `Invalid quantity for ${item.productId}.`)
      }
      lines = setQuantity(lines, item.productId, item.quantity)
    }

    const products = await deps.catalog.findByIds(lines.map((line) => line.productId))
    const missing = lines.find((line) => !products.some((p) => p.id === line.productId))
    if (missing) {
      throw new DomainError(
        "unknown_product",
        "Some items in your cart are no longer available. Please review your cart."
      )
    }

    const order = createOrder({
      id: deps.ids.orderId(),
      reference: deps.ids.orderReference(),
      customer,
      cart: priceCart(lines, products),
      method: deps.gateway.method,
      now: deps.clock.now(),
    })
    await deps.orders.save(order)

    const started = await startPayment(deps, order)
    await publishSafely(deps.events, { type: "order.placed", order: started })
    return started
  }
}
