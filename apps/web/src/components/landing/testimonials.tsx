import Image from "next/image"
import { QuoteIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { unsplash, unsplashAvatar } from "@/lib/site"

// Placeholder testimonials until the client supplies real ones.
const testimonials = [
  {
    quote:
      "Ndutas Kitchen has made weeknights so much easier. I grab a few packs on Sunday and dinner is sorted. It tastes home-made, every single time.",
    name: "Tamzin E.",
    role: "Software Engineer",
    avatar: unsplashAvatar("1438761681033-6461ffad8d80"),
  },
  {
    quote:
      "The portions are generous and the prices are honest. The curry trio is my go-to for lunch at the office.",
    name: "Daniel M.",
    role: "SWE - Little Pay",
    avatar: unsplashAvatar("1758443293334-b83931c5ce8b"),
  },
  {
    quote:
      "I order breakfast boxes for my whole team. Everything arrives fresh, sealed and on time.",
    name: "Karani E.",
    role: "Team Lead",
    avatar: unsplashAvatar("1633379335896-c2a6813cb9e5"),
  },
]

const stack = [
  { src: unsplash("1556911220-bff31c812dba"), alt: "Our kitchen", className: "left-0 h-52 w-24 md:h-64 md:w-32" },
  { src: unsplash("1556910103-1c02745aae4d"), alt: "Our cooks preparing meals", className: "left-10 z-10 h-64 w-36 md:left-14 md:h-80 md:w-44" },
  { src: unsplash("1577219491135-ce391730fb2c"), alt: "A chef plating a meal", className: "left-1/2 z-20 h-72 w-48 -translate-x-1/2 md:h-96 md:w-60" },
  { src: unsplash("1504674900247-0877df9cc836"), alt: "A plated meal", className: "right-10 z-10 h-64 w-36 md:right-14 md:h-80 md:w-44" },
  { src: unsplash("1512621776951-a57141f2eefd"), alt: "A fresh bowl", className: "right-0 h-52 w-24 md:h-64 md:w-32" },
]

export function Testimonials() {
  return (
    <section
      id="about"
      aria-label="What our customers say"
      className="scroll-mt-8 bg-primary text-primary-foreground"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-16 md:grid-cols-2 md:px-6 md:py-24">
        <Carousel opts={{ loop: true }} className="mx-auto w-full max-w-lg">
          <CarouselContent>
            {testimonials.map((t) => (
              <CarouselItem key={t.name} className="text-center">
                <QuoteIcon className="mx-auto mb-4 size-6 opacity-60" />
                <blockquote className="font-heading text-xl leading-relaxed md:text-2xl">
                  {t.quote}
                </blockquote>
                <div className="mt-6 border-t border-dashed border-primary-foreground/50 pt-6">
                  <div className="flex items-center justify-center gap-3">
                    <Avatar className="size-11">
                      <AvatarImage src={t.avatar} alt="" />
                      <AvatarFallback className="text-foreground">
                        {t.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="font-semibold">{t.name}</p>
                      <p className="text-xs opacity-80">{t.role}</p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="mt-6 flex justify-center gap-3">
            <CarouselPrevious
              size="icon-lg"
              className="static translate-y-0 text-foreground"
            />
            <CarouselNext
              variant="secondary"
              size="icon-lg"
              className="static translate-y-0"
            />
          </div>
        </Carousel>

        <div className="relative mx-auto h-72 w-full max-w-md md:h-96">
          {stack.map((photo) => (
            <div
              key={photo.src}
              className={`absolute top-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border-2 border-primary-foreground shadow-lg ${photo.className}`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="240px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
