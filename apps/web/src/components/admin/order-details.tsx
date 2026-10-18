"use client"

import { CircleCheckIcon, CircleXIcon, PhoneIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"
import { formatPrice } from "@/lib/format"
import { ConfirmOrderDialog, RejectOrderDialog } from "./order-decisions"
import { formatOrderDate, localPhone, paymentLabel } from "./order-format"
import { OrderStatusDot } from "./orders-columns"
import { useOrdersStore } from "./orders-store"

// One order in full: from the right on desktop, from the bottom on phones. It reads the
// order from the store by id, so a live update (or a confirm) shows straight away.
export function OrderDetails({ orderId, onClose }: { orderId: string | null; onClose: () => void }) {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const order = useOrdersStore((state) => (orderId ? state.byId[orderId] : undefined))

  return (
    <Drawer open={!!order} onOpenChange={(open) => !open && onClose()} direction={isDesktop ? "right" : "bottom"}>
      <DrawerContent className="data-[vaul-drawer-direction=right]:sm:max-w-md">
        {order && (
          <>
            <DrawerHeader className="border-b border-border text-left">
              <div className="flex items-center justify-between gap-3">
                <DrawerTitle className="font-price text-xl tabular-nums">{order.reference}</DrawerTitle>
                <OrderStatusDot status={order.status} />
              </div>
              <DrawerDescription>{formatOrderDate(order.createdAt)}</DrawerDescription>
            </DrawerHeader>

            <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-4 text-sm">
              <section className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Customer</p>
                  <p className="mt-1 font-medium">{order.customerName}</p>
                </div>
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <a href={`tel:+${order.customerPhone}`}>
                    <PhoneIcon data-icon="inline-start" />
                    <span className="font-price tabular-nums">{localPhone(order.customerPhone)}</span>
                  </a>
                </Button>
              </section>

              <section>
                <p className="text-xs font-medium text-muted-foreground uppercase">Items</p>
                <ul className="mt-2 divide-y divide-dashed divide-border">
                  {order.lines.map((line) => (
                    <li key={line.productId} className="flex justify-between gap-4 py-2">
                      <span>
                        <span className="font-price tabular-nums">{line.quantity} ×</span> {line.name}
                      </span>
                      <span className="shrink-0 font-price tabular-nums">{formatPrice(line.lineTotal)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-1 flex justify-between border-t border-border pt-3">
                  <span className="font-medium">Total</span>
                  <span className="font-price text-lg font-semibold tabular-nums">{formatPrice(order.total)}</span>
                </div>
              </section>

              <section>
                <p className="text-xs font-medium text-muted-foreground uppercase">Payment</p>
                <p className="mt-1">{paymentLabel[order.method]}</p>
                {order.mpesaReceipt && (
                  <p className="text-muted-foreground">
                    M-Pesa code{" "}
                    <span className="font-price font-medium tracking-wider text-foreground">{order.mpesaReceipt}</span>
                  </p>
                )}
                {order.failureReason && <p className="mt-1 text-destructive">{order.failureReason}</p>}
              </section>
            </div>

            <DrawerFooter className="border-t border-border">
              {order.status === "awaiting_verification" && (
                <div className="grid grid-cols-2 gap-2">
                  <RejectOrderDialog
                    order={order}
                    trigger={
                      <Button
                        variant="outline"
                        className="cursor-pointer rounded-full hover:border-destructive hover:text-destructive"
                      >
                        <CircleXIcon data-icon="inline-start" />
                        Reject
                      </Button>
                    }
                  />
                  <ConfirmOrderDialog
                    order={order}
                    trigger={
                      <Button className="cursor-pointer rounded-full">
                        <CircleCheckIcon data-icon="inline-start" />
                        Confirm
                      </Button>
                    }
                  />
                </div>
              )}
              <DrawerClose asChild>
                <Button variant="ghost" className="cursor-pointer rounded-full">
                  Close
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}
