import { DomainError } from "./errors"
import type { Kes } from "./money"

export const MEAL_CATEGORIES = ["breakfast", "lunch", "dinner"] as const
export type MealCategory = (typeof MEAL_CATEGORIES)[number]

// Every product is pre-packaged with one fixed unit price: no sizes, weights or modifiers.
// `available: false` keeps it on the menu as "Sold out" without it being orderable.
export type Product = {
  id: string
  name: string
  description: string
  price: Kes
  image: string
  category: MealCategory
  available: boolean
}

// What the owner edits in the back office.
export type ProductDetails = Pick<Product, "name" | "description" | "price" | "image" | "category">

export const MAX_PRODUCT_PRICE = 100_000

export function validateProductDetails(input: ProductDetails): ProductDetails {
  const fail = (message: string): never => {
    throw new DomainError("invalid_product", message)
  }
  const name = input.name.trim().replace(/\s+/g, " ")
  const description = input.description.trim().replace(/\s+/g, " ")
  const image = input.image.trim()
  if (name.length < 2 || name.length > 60) fail("Give the product a name (2 to 60 characters).")
  if (description.length > 160) fail("Keep the description under 160 characters.")
  if (!Number.isInteger(input.price) || input.price < 1 || input.price > MAX_PRODUCT_PRICE) {
    fail(`Enter a whole-shilling price between 1 and ${MAX_PRODUCT_PRICE.toLocaleString("en-KE")}.`)
  }
  if (!MEAL_CATEGORIES.includes(input.category)) fail("Choose breakfast, lunch or dinner.")
  if (!isPhotoLink(image)) fail("Use an image link that starts with https://.")
  return { name, description, price: input.price, image, category: input.category }
}

// https:// links, plus http://localhost for photos uploaded while developing locally.
export function isPhotoLink(url: string): boolean {
  return /^https:\/\/\S+$/.test(url) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/\S+$/.test(url)
}

// "Berry French Toast" → "berry-french-toast": readable ids that survive in saved carts.
export function productSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "product"
  )
}
