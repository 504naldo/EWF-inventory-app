import { and, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, inventoryItems, InsertInventoryItem, InventoryItem, partsRequests, InsertPartsRequest } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAllInventoryItems() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inventoryItems);
}

export async function getInventoryItemsByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inventoryItems).where(eq(inventoryItems.category, category));
}

export async function searchInventoryItems(query: string) {
  const db = await getDb();
  if (!db) return [];
  const searchPattern = `%${query}%`;
  return db.select().from(inventoryItems).where(
    or(
      like(inventoryItems.productCode, searchPattern),
      like(inventoryItems.productDescription, searchPattern)
    )
  );
}

export async function createInventoryItem(item: InsertInventoryItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(inventoryItems).values(item);
}

export async function updateInventoryItem(id: string, updates: Partial<InventoryItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(inventoryItems).set(updates).where(eq(inventoryItems.id, id));
}

export async function updateInventoryQuantity(id: string, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(inventoryItems).set({ quantity }).where(eq(inventoryItems.id, id));
}

export async function deleteInventoryItem(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get users: database not available");
    return [];
  }
  return db.select().from(users).orderBy(users.createdAt);
}

export async function updateUserRole(userId: number, role: 'admin' | 'tech') {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update user role: database not available");
    throw new Error("Database unavailable");
  }
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Parts Requests
export async function createPartsRequest(request: InsertPartsRequest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(partsRequests).values(request);
  return result[0]?.insertId || crypto.randomUUID();
}

export async function getAllPartsRequests(filters?: { status?: string; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions: any[] = [];
  if (filters?.status) {
    conditions.push(eq(partsRequests.status, filters.status as any));
  }
  if (filters?.search) {
    const searchPattern = `%${filters.search}%`;
    conditions.push(
      or(
        like(partsRequests.jobId, searchPattern),
        like(partsRequests.productCode, searchPattern),
        like(partsRequests.requestedDescription, searchPattern)
      )
    );
  }
  
  if (conditions.length > 0) {
    return db.select().from(partsRequests).where(and(...conditions)).orderBy(sql`${partsRequests.createdAt} DESC`);
  }
  
  return db.select().from(partsRequests).orderBy(sql`${partsRequests.createdAt} DESC`);
}

export async function getUserPartsRequests(userId: number, filters?: { status?: string; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions: any[] = [eq(partsRequests.createdBy, userId)];
  if (filters?.status) {
    conditions.push(eq(partsRequests.status, filters.status as any));
  }
  if (filters?.search) {
    const searchPattern = `%${filters.search}%`;
    conditions.push(
      or(
        like(partsRequests.jobId, searchPattern),
        like(partsRequests.productCode, searchPattern),
        like(partsRequests.requestedDescription, searchPattern)
      )
    );
  }
  
  return db.select().from(partsRequests).where(and(...conditions)).orderBy(sql`${partsRequests.createdAt} DESC`);
}

export async function getPartsRequestById(id: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select({
    id: partsRequests.id,
    jobId: partsRequests.jobId,
    category: partsRequests.category,
    productCode: partsRequests.productCode,
    requestedDescription: partsRequests.requestedDescription,
    quantityRequested: partsRequests.quantityRequested,
    priority: partsRequests.priority,
    status: partsRequests.status,
    notes: partsRequests.notes,
    createdBy: partsRequests.createdBy,
    createdByEmail: users.email,
    createdAt: partsRequests.createdAt,
  })
  .from(partsRequests)
  .leftJoin(users, eq(partsRequests.createdBy, users.id))
  .where(eq(partsRequests.id, id));
  return result[0] || null;
}

export async function updatePartsRequestStatus(id: string, status: string, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updates: any = { status, updatedAt: new Date() };
  if (notes !== undefined) {
    updates.notes = notes;
  }
  await db.update(partsRequests).set(updates).where(eq(partsRequests.id, id));
}

export async function getNewPartsRequestsCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(partsRequests)
    .where(eq(partsRequests.status, 'new'));
  return result[0]?.count || 0;
}
