import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: 'admin' | 'tech' = 'admin'): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("REST API - Inventory Endpoints", () => {
  it("can list all inventory items", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inventory.list();

    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('productCode');
      expect(result[0]).toHaveProperty('productDescription');
      expect(result[0]).toHaveProperty('quantity');
      expect(result[0]).toHaveProperty('currentCost');
      expect(result[0]).toHaveProperty('category');
    }
  });

  it("can filter inventory by category", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inventory.listByCategory({ category: 'Batteries' });

    expect(Array.isArray(result)).toBe(true);
    result.forEach(item => {
      expect(item.category).toBe('Batteries');
    });
  });

  it("can search inventory items", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inventory.search({ query: 'BAT' });

    expect(Array.isArray(result)).toBe(true);
  });

  it("admin can create inventory item", async () => {
    const { ctx } = createAuthContext('admin');
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inventory.create({
      productCode: 'TEST-001',
      productDescription: 'Test Item',
      quantity: 10,
      currentCost: 5,
      category: 'Miscellaneous',
    });

    expect(result).toEqual({ success: true });
  });

  it("tech cannot create inventory item", async () => {
    const { ctx } = createAuthContext('tech');
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.inventory.create({
        productCode: 'TEST-002',
        productDescription: 'Test Item',
        quantity: 10,
        currentCost: 5,
        category: 'Miscellaneous',
      })
    ).rejects.toThrow();
  });

  it("admin can update inventory item", async () => {
    const { ctx } = createAuthContext('admin');
    const caller = appRouter.createCaller(ctx);

    // First get an item
    const items = await caller.inventory.list();
    if (items.length === 0) return;

    const result = await caller.inventory.update({
      id: items[0].id,
      quantity: 100,
    });

    expect(result).toEqual({ success: true });
  });

  it("can update quantity only", async () => {
    const { ctx } = createAuthContext('tech');
    const caller = appRouter.createCaller(ctx);

    // First get an item
    const items = await caller.inventory.list();
    if (items.length === 0) return;

    const result = await caller.inventory.updateQuantity({
      id: items[0].id,
      quantity: 50,
    });

    expect(result).toEqual({ success: true });
  });
});

describe("REST API - Auth Endpoints", () => {
  it("can logout", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
  });
});
