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

// Placeholder photo helpers live with the shared catalog.
export { unsplash, unsplashAvatar } from "@ndutas/core"
