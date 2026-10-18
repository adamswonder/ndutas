// @ndutas/core: the business rules shared by the storefront (apps/web) and the API (apps/api).
// No frameworks, databases or crypto here; adapters live in the apps.
export * from "./domain/errors"
export * from "./domain/money"
export * from "./domain/phone"
export * from "./domain/product"
export * from "./domain/cart"
export * from "./domain/order"

export * from "./application/ports"
export * from "./application/events"
export * from "./application/start-payment"
export * from "./application/place-order"
export * from "./application/record-stk-result"
export * from "./application/manage-order"
export * from "./application/staff"
export * from "./application/products"

export * from "./catalog/images"
export * from "./catalog/meals-data"
export * from "./catalog/static-catalog"

export * from "./adapters/in-memory-order-repository"
export * from "./adapters/in-memory-staff-repository"
export * from "./adapters/in-memory-product-repository"

export * from "./contracts"
