import type { LucideIcon } from "lucide-react"
import { CoffeeIcon, SaladIcon, SparklesIcon, UtensilsCrossedIcon } from "lucide-react"
import { MenuSection } from "@/components/landing/menu-section"
import { PhotoStrip } from "@/components/landing/photo-strip"
import { SiteFooter } from "@/components/landing/site-footer"
import { SiteHeader } from "@/components/landing/site-header"
import { Testimonials } from "@/components/landing/testimonials"
import type { MealCategory } from "@ndutas/core"
import { menuCategories } from "@/lib/categories"
import { unsplash } from "@/lib/site"
import { getProducts } from "@/server/api"

const categoryIcons: Record<MealCategory, LucideIcon> = {
  breakfast: CoffeeIcon,
  lunch: SaladIcon,
  dinner: UtensilsCrossedIcon,
}

const heroPhotos = [
  { src: unsplash("1565299624946-b28f40a0ae38"), alt: "Pizza" },
  { src: unsplash("1546069901-ba9599a7e63c"), alt: "Salmon poke bowl" },
  { src: unsplash("1563379926898-05f4575a45d8"), alt: "Shrimp spaghetti" },
  { src: unsplash("1555939594-58d7cb561ad1"), alt: "Mixed grill" },
  { src: unsplash("1484723091739-30a097e8f929"), alt: "Berry French toast" },
  { src: unsplash("1540189549336-e6e99c3679fe"), alt: "House salad" },
  { src: unsplash("1585937421612-70a008356fbe"), alt: "Curry trio" },
]

const kitchenPhotos = [
  { src: unsplash("1577219491135-ce391730fb2c"), alt: "A chef plating a meal" },
  { src: unsplash("1544025162-d76694265947"), alt: "BBQ ribs" },
  { src: unsplash("1556911220-bff31c812dba"), alt: "Our kitchen" },
  { src: unsplash("1556910103-1c02745aae4d"), alt: "Our cooks preparing meals" },
  { src: unsplash("1512621776951-a57141f2eefd"), alt: "A fresh bowl" },
  { src: unsplash("1588166524941-3bf61a9c41db"), alt: "Chicken curry and rice" },
  { src: unsplash("1504674900247-0877df9cc836"), alt: "A plated meal" },
]

export default async function Home() {
  const meals = await getProducts()

  return (
    <div id="top" className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="flex flex-col">
        <section aria-labelledby="hero-title" className="pt-12 md:pt-16">
          <h1
            id="hero-title"
            className="mx-auto max-w-3xl px-4 text-center font-heading text-5xl leading-tight tracking-tight text-balance md:text-7xl"
          >
            Dive Into Delicious Packaged Meals
          </h1>
          <p className="mx-auto mt-4 max-w-xl px-4 text-center text-muted-foreground md:text-lg">
            Freshly cooked, sealed and ready to order, from breakfast boxes to
            hearty dinners.
          </p>
          <div className="mt-12">
            <PhotoStrip photos={heroPhotos} preload shuffleEveryMs={4000} />
          </div>
        </section>

        <div className="relative my-16 border-t border-dashed border-foreground/30 md:my-24">
          <span className="absolute top-0 left-1/2 flex size-10 -translate-1/2 items-center justify-center rounded-full border border-foreground/15 bg-background text-primary">
            <SparklesIcon className="size-4" />
          </span>
        </div>

        <div id="menu" className="flex scroll-mt-8 flex-col gap-24 md:gap-32">
          {menuCategories.map((category) => (
            <MenuSection
              key={category.id}
              id={category.id}
              title={category.title}
              icon={categoryIcons[category.id]}
              meals={meals.filter((meal) => meal.category === category.id)}
            />
          ))}
        </div>

        <section aria-labelledby="kitchen-title" className="py-24 md:py-32">
          <h2
            id="kitchen-title"
            className="text-center font-heading text-4xl tracking-tight md:text-5xl"
          >
            From Our Kitchen
          </h2>
          <div className="mt-12">
            <PhotoStrip photos={kitchenPhotos} />
          </div>
        </section>

        <Testimonials />
      </main>

      <SiteFooter />
    </div>
  )
}
