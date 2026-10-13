import type { MealCategory } from "@/core/domain/product"

export const menuCategories: { id: MealCategory; label: string; title: string }[] = [
  { id: "breakfast", label: "Breakfast", title: "Breakfast Specials" },
  { id: "lunch", label: "Lunch", title: "Lunch Specials" },
  { id: "dinner", label: "Dinner", title: "Dinner Specials" },
]
