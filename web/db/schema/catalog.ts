import { pgTable, text, numeric, integer, boolean, timestamp, uuid, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sku: text("sku").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    costPrice: numeric("cost_price", { precision: 12, scale: 2 }),
    unit: text("unit").notNull().default("unit"),
    stockOnHand: integer("stock_on_hand").notNull().default(0),
    incomingStock: integer("incoming_stock").notNull().default(0),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    check("products_unit_price_non_negative", sql`${table.unitPrice} >= 0`),
    check("products_cost_price_non_negative", sql`${table.costPrice} is null or ${table.costPrice} >= 0`),
    check("products_stock_on_hand_non_negative", sql`${table.stockOnHand} >= 0`),
    check("products_incoming_stock_non_negative", sql`${table.incomingStock} >= 0`),
  ],
);

export type Product = typeof products.$inferSelect;
