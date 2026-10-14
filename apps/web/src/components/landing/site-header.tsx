import Link from "next/link"
import { MenuIcon, UtensilsIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { HeaderCartAction } from "@/components/cart/cart-button"
import { site } from "@/lib/site"

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <UtensilsIcon className="size-4" />
      </span>
      <span className="font-heading text-lg font-semibold whitespace-nowrap max-[359px]:sr-only">
        {site.name}
      </span>
    </Link>
  )
}

export function SiteHeader() {
  return (
    <header className="mx-auto w-full max-w-6xl px-4 md:px-6">
      <div className="flex h-18 items-center justify-between border-b border-foreground/10">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
          {site.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <HeaderCartAction />

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-lg" className="md:hidden">
                <MenuIcon />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-6">
              <SheetTitle className="font-heading text-lg">{site.name}</SheetTitle>
              <nav className="flex flex-col gap-1">
                {site.nav.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      className="rounded-md py-2 text-base font-medium hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
