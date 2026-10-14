"use client"

import { WalletIcon } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { formatPrice } from "@/lib/format"
import { PochiSteps } from "./pochi-steps"

export function PochiDialog({
  open,
  onOpenChange,
  payTo,
  payToName,
  amount,
  payFrom,
  onProceed,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  payTo: string
  payToName: string
  amount: number
  payFrom: string
  onProceed: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-h-[90dvh] overflow-y-auto data-[size=default]:max-w-[calc(100%-2rem)] data-[size=default]:sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-primary/10 text-primary dark:bg-primary/20">
            <WalletIcon />
          </AlertDialogMedia>
          <AlertDialogTitle className="text-lg">Pay with Pochi la Biashara</AlertDialogTitle>
          <AlertDialogDescription>
            Send <span className="font-price tabular-nums">{formatPrice(amount)}</span> to{" "}
            {payToName}, then tap Proceed to Order. We&apos;ll confirm your order as soon as
            we see your payment.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <PochiSteps payTo={payTo} payToName={payToName} amount={amount} payFrom={payFrom} />

        <AlertDialogFooter>
          <AlertDialogCancel variant="outline" className="cursor-pointer rounded-full">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction className="cursor-pointer rounded-full" onClick={onProceed}>
            Proceed to Order
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
