import { users, assets, assetAssignments, type User, type InsertUser, type Asset, type InsertAsset, type AssetAssignment, type InsertAssignment } from "@shared/schema";
import { db } from "./db";
import { eq, and, or } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listUsers(): Promise<User[]>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  deactivateUser(id: string): Promise<User>;

  listAssets(): Promise<Asset[]>;
  listMyAssets(userId: string): Promise<(AssetAssignment & { asset: Asset })[]>;
  getAsset(id: string): Promise<Asset | undefined>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: string, asset: Partial<InsertAsset>): Promise<Asset>;
  deleteAsset(id: string): Promise<void>;

  assignAsset(assignment: InsertAssignment): Promise<AssetAssignment>;
  returnAsset(assetId: string): Promise<AssetAssignment | undefined>;
  requestReturn(assetId: string, userId: string): Promise<AssetAssignment | undefined>;
  getActiveAssignment(assetId: string): Promise<AssetAssignment | undefined>;
  listAssignments(): Promise<(AssetAssignment & { asset: Asset, user: User })[]>;

  getStats(): Promise<{ totalAssets: number; assignedAssets: number; availableAssets: number; maintenanceAssets: number }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async listUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async deactivateUser(id: string): Promise<User> {
    const [user] = await db.update(users).set({ status: "INACTIVE" }).where(eq(users.id, id)).returning();
    return user;
  }

  async listAssets(): Promise<Asset[]> {
    return await db.select().from(assets);
  }

  async listMyAssets(userId: string): Promise<(AssetAssignment & { asset: Asset })[]> {
    const results = await db.query.assetAssignments.findMany({
      where: and(eq(assetAssignments.userId, userId), eq(assetAssignments.status, "ACTIVE")),
      with: { asset: true }
    });
    return results as (AssetAssignment & { asset: Asset })[];
  }

  async getAsset(id: string): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, id));
    return asset;
  }

  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    const [asset] = await db.insert(assets).values(insertAsset).returning();
    return asset;
  }

  async updateAsset(id: string, updates: Partial<InsertAsset>): Promise<Asset> {
    const [asset] = await db.update(assets).set(updates).where(eq(assets.id, id)).returning();
    return asset;
  }

  async deleteAsset(id: string): Promise<void> {
    // Remove assignment records first to satisfy FK constraints, then delete the asset.
    // For simplicity and to avoid edge cases, clear all assignments for this asset id.
    await db.delete(assetAssignments).where(eq(assetAssignments.assetId, id));
    await db.delete(assets).where(eq(assets.id, id));
  }

  async assignAsset(assignment: InsertAssignment): Promise<AssetAssignment> {
    const [newAssignment] = await db.insert(assetAssignments).values(assignment).returning();
    await db.update(assets).set({ status: "ASSIGNED" }).where(eq(assets.id, assignment.assetId));
    return newAssignment;
  }

  async getActiveAssignment(assetId: string): Promise<AssetAssignment | undefined> {
    const [assignment] = await db.select().from(assetAssignments).where(and(eq(assetAssignments.assetId, assetId), eq(assetAssignments.status, "ACTIVE")));
    return assignment;
  }

  async returnAsset(assetId: string): Promise<AssetAssignment | undefined> {
    // Allow returning both ACTIVE and RETURN_REQUESTED assignments
    const [openAssignment] = await db
      .select()
      .from(assetAssignments)
      .where(
        and(
          eq(assetAssignments.assetId, assetId),
          or(
            eq(assetAssignments.status, "ACTIVE"),
            eq(assetAssignments.status, "RETURN_REQUESTED")
          )
        )
      );
    if (!openAssignment) return undefined;

    const [updatedAssignment] = await db
      .update(assetAssignments)
      .set({ status: "RETURNED", returnedDate: new Date() })
      .where(eq(assetAssignments.id, openAssignment.id))
      .returning();
    await db.update(assets).set({ status: "AVAILABLE" }).where(eq(assets.id, assetId));
    return updatedAssignment;
  }

  async requestReturn(assetId: string, userId: string): Promise<AssetAssignment | undefined> {
    const activeAssignment = await db.select().from(assetAssignments).where(and(eq(assetAssignments.assetId, assetId), eq(assetAssignments.userId, userId), eq(assetAssignments.status, "ACTIVE")));
    if (activeAssignment.length === 0) return undefined;
    const [updatedAssignment] = await db.update(assetAssignments).set({ status: "RETURN_REQUESTED" }).where(eq(assetAssignments.id, activeAssignment[0].id)).returning();
    return updatedAssignment;
  }

  async listAssignments(): Promise<(AssetAssignment & { asset: Asset, user: User })[]> {
    const results = await db.query.assetAssignments.findMany({ with: { asset: true, user: true } });
    return results as (AssetAssignment & { asset: Asset, user: User })[];
  }

  async getStats(): Promise<{ totalAssets: number; assignedAssets: number; availableAssets: number; maintenanceAssets: number }> {
    const allAssets = await this.listAssets();
    return {
      totalAssets: allAssets.length,
      assignedAssets: allAssets.filter(a => a.status === "ASSIGNED").length,
      availableAssets: allAssets.filter(a => a.status === "AVAILABLE").length,
      maintenanceAssets: allAssets.filter(a => a.status === "UNDER_MAINTENANCE").length,
    };
  }
}

export const storage = new DatabaseStorage();
