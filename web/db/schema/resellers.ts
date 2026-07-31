import { pgTable, text, boolean, timestamp, uuid } from "drizzle-orm/pg-core";

export const resellers = pgTable("resellers", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Reseller = typeof resellers.$inferSelect;
