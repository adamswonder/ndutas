// TODO: replace the placeholder contact details and social links with the client's real ones.
export const site = {
  name: "Ndutas Kitchen",
  tagline: "Packaged food, ready to order",
  contact: {
    phone: "+254 796 929502",
    email: "hello@ndutaskitchen.example",
    address: ["Musa Gitau", "Nairobi, Kenya"],
  },
  nav: [
    { label: "Home", href: "/" },
    { label: "Menu", href: "/#menu" },
    { label: "About", href: "/#about" },
    { label: "Contact", href: "/#contact" },
  ],
  socials: [
    { label: "Facebook", href: "#" },
    { label: "Instagram", href: "#" },
    { label: "X", href: "#" },
    { label: "TikTok", href: "#" },
  ],
} as const

export function unsplash(id: string) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=75`
}

// Square, face-centred crop for small avatars.
export function unsplashAvatar(id: string) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&crop=faces&w=160&h=160&q=75`
}
