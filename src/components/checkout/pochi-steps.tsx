import { formatPrice } from "@/lib/format"

// How to pay a Pochi la Biashara, per Safaricom's FAQ. Shown in the checkout dialog
// and again on the order page in case the customer hasn't paid yet.
export function PochiSteps({
  payTo,
  payToName,
  amount,
  payFrom,
}: {
  payTo: string
  payToName: string
  amount: number
  // The number the customer gave at checkout, so the owner can match the payment.
  payFrom: string
}) {
  const price = <span className="font-price font-medium text-foreground tabular-nums">{formatPrice(amount)}</span>
  const number = (
    <span className="font-price font-medium whitespace-nowrap text-foreground tabular-nums">{payTo}</span>
  )

  return (
    <div className="flex flex-col gap-4 text-left text-sm text-muted-foreground">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-xl bg-muted/60 p-4">
        <dt>Pochi number</dt>
        <dd className="text-right">{number}</dd>
        <dt>Name</dt>
        <dd className="text-right font-medium text-foreground">{payToName}</dd>
        <dt>Amount</dt>
        <dd className="text-right">{price}</dd>
      </dl>

      <div>
        <p className="font-medium text-foreground">On your phone&apos;s M-PESA menu</p>
        <ol className="mt-1.5 flex list-decimal flex-col gap-1 pl-5">
          <li>
            Go to <strong className="text-foreground">M-PESA</strong> →{" "}
            <strong className="text-foreground">Lipa na M-PESA</strong> →{" "}
            <strong className="text-foreground">Pochi la Biashara</strong>.
          </li>
          <li>Enter the number {number}.</li>
          <li>Enter the amount {price}.</li>
          <li>
            Check the name shows <strong className="text-foreground">{payToName}</strong>, then
            enter your M-PESA PIN.
          </li>
        </ol>
        <p className="mt-2">
          In the M-PESA app: <strong className="text-foreground">Pay</strong> →{" "}
          <strong className="text-foreground">Pochi la Biashara</strong>, then the same details.
        </p>
      </div>

      <p>
        Pay from{" "}
        <span className="font-price font-medium whitespace-nowrap text-foreground tabular-nums">{payFrom}</span>{" "}
        so we can match your payment to this order.
      </p>
    </div>
  )
}
