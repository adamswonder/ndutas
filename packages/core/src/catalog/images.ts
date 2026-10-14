// Placeholder stock photos until the client supplies real ones.
export function unsplash(id: string) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=75`
}

// Square, face-centred crop for small avatars.
export function unsplashAvatar(id: string) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&crop=faces&w=160&h=160&q=75`
}
