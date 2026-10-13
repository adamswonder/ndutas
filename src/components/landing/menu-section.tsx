import Image from "next/image"
import type { LucideIcon } from "lucide-react"
import type { Product } from "@/core/domain/product"
import { formatPrice } from "@/lib/format"
import { AddToCart } from "@/components/cart/add-to-cart"

export function MenuSection({
  id,
  title,
  icon: Icon,
  meals,
}: {
  id: string
  title: string
  icon: LucideIcon
  meals: Product[]
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="mx-auto w-full max-w-5xl scroll-mt-8 px-4 md:px-6"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <Icon className="size-8 text-primary" strokeWidth={1.5} />
        <h2
          id={`${id}-title`}
          className="font-heading text-4xl tracking-tight md:text-5xl"
        >
          {title}
        </h2>
      </div>

      <ul className="mt-10 grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
        {meals.map((meal) => (
          <MenuItem key={meal.id} meal={meal} />
        ))}
      </ul>
    </section>
  )
}

function MenuItem({ meal }: { meal: Product }) {
  return (
    <li className="flex items-center gap-4 border-b border-dashed border-foreground/40 pb-5">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg">
        <Image
          src={meal.image}
          alt={meal.name}
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-heading font-semibold">{meal.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{meal.description}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <p className="font-price text-lg font-medium tabular-nums">
          {formatPrice(meal.price)}
        </p>
        <AddToCart productId={meal.id} name={meal.name} />
      </div>
    </li>
  )
}
