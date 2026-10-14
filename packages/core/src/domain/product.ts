import type { Kes } from "./money"

export type MealCategory = "breakfast" | "lunch" | "dinner"

// Every product is pre-packaged with one fixed unit price: no sizes, weights or modifiers.
export type Product = {
  id: string
  name: string
  description: string
  price: Kes
  image: string
  category: MealCategory
}
