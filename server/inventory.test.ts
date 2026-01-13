import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { TRPCError } from "@trpc/server";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(role: "admin" | "tech"): TrpcContext {
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

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("inventory router", () => {
  describe("list operations", () => {
    it("allows both admin and tech to list inventory items", async () => {
      const adminCtx = createMockContext("admin");
      const techCtx = createMockContext("tech");

      const adminCaller = appRouter.createCaller(adminCtx);
      const techCaller = appRouter.createCaller(techCtx);

      const adminResult = await adminCaller.inventory.list();
      const techResult = await techCaller.inventory.list();

      expect(Array.isArray(adminResult)).toBe(true);
      expect(Array.isArray(techResult)).toBe(true);
      expect(adminResult.length).toBeGreaterThan(0);
      expect(techResult.length).toBe(adminResult.length);
    });
  });

  describe("quantity updates", () => {
    it("allows tech to update quantity only", async () => {
      const techCtx = createMockContext("tech");
      const caller = appRouter.createCaller(techCtx);

      const items = await caller.inventory.list();
      const testItem = items[0];

      if (!testItem) {
        throw new Error("No items found for testing");
      }

      const result = await caller.inventory.updateQuantity({
        id: testItem.id,
        quantity: testItem.quantity + 1,
      });

      expect(result.success).toBe(true);

      const updatedItems = await caller.inventory.list();
      const updatedItem = updatedItems.find((i) => i.id === testItem.id);
      expect(updatedItem?.quantity).toBe(testItem.quantity + 1);
    });
  });

  describe("admin-only operations", () => {
    it("allows admin to create items", async () => {
      const adminCtx = createMockContext("admin");
      const caller = appRouter.createCaller(adminCtx);

      const newItem = {
        category: "Batteries",
        productCode: `TEST-${Date.now()}`,
        productDescription: "Test Battery",
        quantity: 10,
        currentCost: 1000,
      };

      const result = await caller.inventory.create(newItem);
      expect(result.success).toBe(true);

      const items = await caller.inventory.list();
      const createdItem = items.find((i) => i.productCode === newItem.productCode);
      expect(createdItem).toBeDefined();
      expect(createdItem?.productDescription).toBe(newItem.productDescription);
    });

    it("prevents tech from creating items", async () => {
      const techCtx = createMockContext("tech");
      const caller = appRouter.createCaller(techCtx);

      const newItem = {
        category: "Batteries",
        productCode: `TEST-TECH-${Date.now()}`,
        productDescription: "Test Battery",
        quantity: 10,
        currentCost: 1000,
      };

      await expect(caller.inventory.create(newItem)).rejects.toThrow();
    });

    it("allows admin to update all fields", async () => {
      const adminCtx = createMockContext("admin");
      const caller = appRouter.createCaller(adminCtx);

      const items = await caller.inventory.list();
      const testItem = items[0];

      if (!testItem) {
        throw new Error("No items found for testing");
      }

      const updates = {
        id: testItem.id,
        productDescription: "Updated Description",
        currentCost: 9999,
      };

      const result = await caller.inventory.update(updates);
      expect(result.success).toBe(true);

      const updatedItems = await caller.inventory.list();
      const updatedItem = updatedItems.find((i) => i.id === testItem.id);
      expect(updatedItem?.productDescription).toBe("Updated Description");
      expect(updatedItem?.currentCost).toBe(9999);
    });

    it("prevents tech from updating non-quantity fields", async () => {
      const techCtx = createMockContext("tech");
      const caller = appRouter.createCaller(techCtx);

      const items = await caller.inventory.list();
      const testItem = items[0];

      if (!testItem) {
        throw new Error("No items found for testing");
      }

      await expect(
        caller.inventory.update({
          id: testItem.id,
          productDescription: "Hacked Description",
        })
      ).rejects.toThrow();
    });

    it("allows admin to delete items", async () => {
      const adminCtx = createMockContext("admin");
      const caller = appRouter.createCaller(adminCtx);

      const newItem = {
        category: "Miscellaneous",
        productCode: `DELETE-TEST-${Date.now()}`,
        productDescription: "Item to Delete",
        quantity: 1,
        currentCost: 100,
      };

      await caller.inventory.create(newItem);
      const items = await caller.inventory.list();
      const createdItem = items.find((i) => i.productCode === newItem.productCode);

      if (!createdItem) {
        throw new Error("Failed to create test item");
      }

      const result = await caller.inventory.delete({ id: createdItem.id });
      expect(result.success).toBe(true);

      const updatedItems = await caller.inventory.list();
      const deletedItem = updatedItems.find((i) => i.id === createdItem.id);
      expect(deletedItem).toBeUndefined();
    });

    it("prevents tech from deleting items", async () => {
      const techCtx = createMockContext("tech");
      const caller = appRouter.createCaller(techCtx);

      const items = await caller.inventory.list();
      const testItem = items[0];

      if (!testItem) {
        throw new Error("No items found for testing");
      }

      await expect(caller.inventory.delete({ id: testItem.id })).rejects.toThrow();
    });
  });

  describe("search and filter", () => {
    it("searches by product code", async () => {
      const adminCtx = createMockContext("admin");
      const caller = appRouter.createCaller(adminCtx);

      const results = await caller.inventory.search({ query: "FE-ABC" });
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((item) => item.productCode.includes("FE-ABC"))).toBe(true);
    });

    it("filters by category", async () => {
      const adminCtx = createMockContext("admin");
      const caller = appRouter.createCaller(adminCtx);

      const results = await caller.inventory.listByCategory({ category: "Batteries" });
      expect(results.every((item) => item.category === "Batteries")).toBe(true);
    });
  });
});
