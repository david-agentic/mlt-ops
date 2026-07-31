import { pgEnum, pgTable, text, timestamp, boolean, uuid, index } from "drizzle-orm/pg-core";
import { resellers } from "./resellers";

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "finance",
  "shipping",
  "reseller",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull(),
  name: text("name").notNull(),
  resellerId: uuid("reseller_id").references(() => resellers.id),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)],
);

export type User = typeof users.$inferSelect;
