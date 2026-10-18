import type {
  MealCategory,
  OrderLine,
  OrderStatus,
  PaymentInstruction,
  PaymentMethod,
  StaffRole,
} from "@ndutas/core"
import { boolean, index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

const at = (name: string) => timestamp(name, { withTimezone: true, mode: "date" }).notNull()

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey(),
    reference: text("reference").notNull().unique(),
    customerName: text("customer_name").notNull(),
    // Normalised 2547XXXXXXXX / 2541XXXXXXXX; only the back office sees it unmasked.
    customerPhone: text("customer_phone").notNull(),
    method: text("method").$type<PaymentMethod>().notNull(),
    status: text("status").$type<OrderStatus>().notNull(),
    total: integer("total").notNull(),
    // Snapshot of names and prices at the time of ordering.
    lines: jsonb("lines").$type<OrderLine[]>().notNull(),
    instruction: jsonb("instruction").$type<PaymentInstruction>(),
    checkoutRequestId: text("checkout_request_id"),
    mpesaReceipt: text("mpesa_receipt"),
    failureReason: text("failure_reason"),
    createdAt: at("created_at"),
    updatedAt: at("updated_at"),
  },
  (t) => [
    index("orders_status_created_at_idx").on(t.status, t.createdAt),
    index("orders_created_at_idx").on(t.createdAt),
    index("orders_checkout_request_id_idx").on(t.checkoutRequestId),
  ]
)

export const staff = pgTable("staff", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").$type<StaffRole>().notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: at("created_at"),
  disabledAt: timestamp("disabled_at", { withTimezone: true, mode: "date" }),
})

export const products = pgTable(
  "products",
  {
    // Readable slugs ("berry-french-toast"): they end up in customers' saved carts.
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    price: integer("price").notNull(),
    image: text("image").notNull(),
    category: text("category").$type<MealCategory>().notNull(),
    available: boolean("available").notNull().default(true),
    sortOrder: integer("sort_order").notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true, mode: "date" }),
  },
  (t) => [index("products_category_sort_idx").on(t.category, t.sortOrder)]
)
