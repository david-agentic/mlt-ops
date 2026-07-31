import { pgTable, text, numeric, integer, boolean, timestamp, uuid } from "drizzle-orm/pg-core";

export const products = pgTable("products", {
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
});

export type Product = typeof products.$inferSelect;
