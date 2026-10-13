const priceFormat = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  minimumFractionDigits: 0,
})

export function formatPrice(price: number) {
  return priceFormat.format(price)
}
