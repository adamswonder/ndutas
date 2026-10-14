import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import { SiteHeader } from "@/components/landing/site-header"
import { OrderStatus } from "@/components/orders/order-status"
import { SpinnerCustom } from "@/components/spinner-custom"
import { getOrder } from "@/server/api"

export const metadata: Metadata = { title: "Your order · Ndutas Kitchen" }

export default function OrderPage({ params }: PageProps<"/orders/[id]">) {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl px-4 py-10 md:px-6 md:py-14">
        <Suspense
          fallback={
            <div className="flex h-80 items-center justify-center rounded-2xl border border-border bg-card">
              <SpinnerCustom className="size-6 text-primary" />
            </div>
          }
        >
          <Order params={params} />
        </Suspense>
      </main>
    </div>
  )
}

async function Order({ params }: { params: PageProps<"/orders/[id]">["params"] }) {
  // Always fresh: an order changes when the owner confirms it.
  await connection()
  const { id } = await params
  const order = await getOrder(id)
  if (!order) notFound()
  return <OrderStatus order={order} />
}
