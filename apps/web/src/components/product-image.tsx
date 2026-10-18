import Image, { type ImageProps } from "next/image"

// Product photos are uploads (Vercel Blob) or links the owner pastes in the back office.
// Next only optimises hosts allowed in next.config.ts, so pasted links from elsewhere (and
// local uploads served from localhost) load as-is.
const optimisedHosts = [/^images\.unsplash\.com$/, /\.public\.blob\.vercel-storage\.com$/]

export function ProductImage({ src, alt, ...props }: Omit<ImageProps, "src"> & { src: string }) {
  let optimise = false
  try {
    const { hostname } = new URL(src)
    optimise = optimisedHosts.some((host) => host.test(hostname))
  } catch {
    // Not a valid URL: let the browser show its broken-image state.
  }
  return <Image src={src} alt={alt} unoptimized={!optimise} {...props} />
}
