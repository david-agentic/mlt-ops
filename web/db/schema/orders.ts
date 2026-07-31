import {
  pgEnum,
  pgTable,
  text,
  integer,
  numeric,
  timestamp,
  uuid,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { resellers } from "./resellers";
import { users } from "./auth";
import { products } from "./catalog";

/**
 * Plain text (not a Postgres enum) so new statuses can be added without an
 * ALTER TYPE migration — see architecture review, 2026-07-29.
 */
export const ORDER_STATUSES = [
  "pending_payment",
  "payment_submitted",
  "payment_verified",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const paymentMethodEnum = pgEnum("payment_method", [
  "bank_transfer",
  "cash",
]);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: text("order_number").notNull().unique(),
    resellerId: uuid("reseller_id")
      .references(() => resellers.id)
      .notNull(),
    status: text("status", { enum: ORDER_STATUSES })
      .notNull()
      .default("pending_payment"),
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("orders_reseller_id_idx").on(table.resellerId),
    index("orders_status_idx").on(table.status),
    check("orders_total_amount_non_negative", sql`${table.totalAmount} >= 0`),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .references(() => orders.id)
      .notNull(),
    productId: uuid("product_id")
      .references(() => products.id)
      .notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull(),
  },
  (table) => [
    index("order_items_order_id_idx").on(table.orderId),
    check("order_items_quantity_positive", sql`${table.quantity} > 0`),
    check("order_items_unit_price_non_negative", sql`${table.unitPrice} >= 0`),
    check("order_items_line_total_non_negative", sql`${table.lineTotal} >= 0`),
  ],
);

export const paymentProofs = pgTable(
  "payment_proofs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .references(() => orders.id)
      .notNull(),
    fileUrl: text("file_url").notNull(),
    amountClaimed: numeric("amount_claimed", {
      precision: 12,
      scale: 2,
    }).notNull(),
    reference: text("reference"),
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
    notes: text("notes"),
  },
  (table) => [
    index("payment_proofs_order_id_idx").on(table.orderId),
    check("payment_proofs_amount_claimed_non_negative", sql`${table.amountClaimed} >= 0`),
  ],
);

export const FINANCE_NOTE_TYPES = ["note", "hold", "escalate"] as const;
export type FinanceNoteType = (typeof FINANCE_NOTE_TYPES)[number];

export const financeNotes = pgTable(
  "finance_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .references(() => orders.id)
      .notNull(),
    authorId: uuid("author_id")
      .references(() => users.id)
      .notNull(),
    type: text("type", { enum: FINANCE_NOTE_TYPES }).notNull().default("note"),
    note: text("note").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("finance_notes_order_id_idx").on(table.orderId)],
);

export const paymentVerifications = pgTable(
  "payment_verifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .references(() => orders.id)
      .notNull(),
    verifiedBy: uuid("verified_by")
      .references(() => users.id)
      .notNull(),
    verifiedAmount: numeric("verified_amount", {
      precision: 12,
      scale: 2,
    }).notNull(),
    method: paymentMethodEnum("method").notNull(),
    verifiedAt: timestamp("verified_at").defaultNow().notNull(),
    notes: text("notes"),
  },
  (table) => [
    index("payment_verifications_order_id_idx").on(table.orderId),
    check("payment_verifications_amount_non_negative", sql`${table.verifiedAmount} >= 0`),
  ],
);

export const shipments = pgTable(
  "shipments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .references(() => orders.id)
      .notNull(),
    courier: text("courier"),
    trackingNumber: text("tracking_number"),
    weightKg: numeric("weight_kg", { precision: 8, scale: 2 }),
    dimensions: text("dimensions"),
    packedBy: uuid("packed_by").references(() => users.id),
    packedAt: timestamp("packed_at"),
    dispatchedAt: timestamp("dispatched_at"),
    deliveredAt: timestamp("delivered_at"),
  },
  (table) => [
    index("shipments_order_id_idx").on(table.orderId),
    check("shipments_weight_non_negative", sql`${table.weightKg} is null or ${table.weightKg} >= 0`),
  ],
);

export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type PaymentProof = typeof paymentProofs.$inferSelect;
export type PaymentVerification = typeof paymentVerifications.$inferSelect;
export type Shipment = typeof shipments.$inferSelect;
export type FinanceNote = typeof financeNotes.$inferSelect;
