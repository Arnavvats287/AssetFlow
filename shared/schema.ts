import { pgTable, text, timestamp, uuid, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["ADMIN", "USER"] }).notNull().default("USER"),
  status: text("status", { enum: ["ACTIVE", "INACTIVE"] }).notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  assetId: text("asset_id").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  serialNumber: text("serial_number").notNull(),
  purchaseDate: date("purchase_date").notNull(),
  status: text("status", { enum: ["AVAILABLE", "ASSIGNED", "UNDER_MAINTENANCE", "RETIRED"] }).notNull().default("AVAILABLE"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const assetAssignments = pgTable("asset_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  assetId: uuid("asset_id").notNull().references(() => assets.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  assignedDate: timestamp("assigned_date").notNull().defaultNow(),
  returnedDate: timestamp("returned_date"),
  status: text("status", { enum: ["ACTIVE", "RETURNED", "RETURN_REQUESTED"] }).notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  assignments: many(assetAssignments),
}));

export const assetsRelations = relations(assets, ({ many }) => ({
  assignments: many(assetAssignments),
}));

export const assetAssignmentsRelations = relations(assetAssignments, ({ one }) => ({
  asset: one(assets, {
    fields: [assetAssignments.assetId],
    references: [assets.id],
  }),
  user: one(users, {
    fields: [assetAssignments.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAssetSchema = createInsertSchema(assets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAssignmentSchema = createInsertSchema(assetAssignments).omit({ id: true, createdAt: true, updatedAt: true, returnedDate: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type AssetAssignment = typeof assetAssignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
