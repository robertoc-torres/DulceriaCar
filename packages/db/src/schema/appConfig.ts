import { pgTable, serial, text, jsonb, boolean, timestamp } from "drizzle-orm/pg-core";

export const appConfig = pgTable("app_config", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  valueType: text("value_type").notNull().default("json"),
  isPublic: boolean("is_public").notNull().default(false),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AppConfig = typeof appConfig.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
