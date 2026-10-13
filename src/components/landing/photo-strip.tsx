"use client"

import * as React from "react"
import Image from "next/image"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

const sizes = {
  sm: "size-28 md:size-40",
  lg: "size-40 md:size-60",
  xl: "size-48 md:size-68",
}

// Alternating tile sizes with the largest in the middle; the row overflows
// both edges of the viewport on purpose.
const pattern = ["lg", "sm", "lg", "xl", "lg", "sm", "lg"] as const

type Photo = { src: string; alt: string }

// Fisher–Yates, retried so a shuffle never leaves every tile where it was.
function shuffle(photos: Photo[]): Photo[] {
  if (photos.length < 2) return photos
  let next: Photo[]
  do {
    next = [...photos]
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[next[i], next[j]] = [next[j], next[i]]
    }
  } while (next.every((photo, i) => photo === photos[i]))
  return next
}

export function PhotoStrip({
  photos,
  preload = false,
  shuffleEveryMs,
}: {
  photos: Photo[]
  preload?: boolean
  // When set, the photos swap places at this interval (skipped for reduced motion).
  shuffleEveryMs?: number
}) {
  // The server and first client render use the given order, so hydration matches.
  const [order, setOrder] = React.useState(photos)
  const [shuffled, setShuffled] = React.useState(false)
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)")

  React.useEffect(() => {
    if (!shuffleEveryMs || reduceMotion) return
    const timer = setInterval(() => {
      if (document.hidden) return
      setOrder(shuffle)
      setShuffled(true)
    }, shuffleEveryMs)
    return () => clearInterval(timer)
  }, [shuffleEveryMs, reduceMotion])

  return (
    <div className="flex items-center justify-center gap-4 overflow-hidden md:gap-5">
      {order.slice(0, pattern.length).map((photo, i) => (
        <div
          key={i}
          className={cn(
            "relative shrink-0 overflow-hidden rounded-2xl border border-foreground/15 bg-muted shadow-sm",
            sizes[pattern[i]]
          )}
        >
          <Image
            key={photo.src}
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(min-width: 768px) 272px, 192px"
            preload={preload && !shuffled && pattern[i] === "xl"}
            className={cn("object-cover", shuffled && "animate-in fade-in zoom-in-105 duration-700")}
          />
        </div>
      ))}
    </div>
  )
}
