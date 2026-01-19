import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
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
    res: {} as TrpcContext["res"],
  };
}

function createTechContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "tech-user",
    email: "tech@example.com",
    name: "Tech User",
    loginMethod: "manus",
    role: "tech",
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
    res: {} as TrpcContext["res"],
  };
}

describe("users router", () => {
  describe("list operations", () => {
    it("allows admin to list users", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const users = await caller.users.list();
      expect(Array.isArray(users)).toBe(true);
    });

    it("prevents tech from listing users", async () => {
      const ctx = createTechContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.users.list()).rejects.toThrow("Admin access required");
    });
  });

  describe("role updates", () => {
    it("allows admin to update user roles", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.users.updateRole({ userId: 2, role: "admin" });
      expect(result.success).toBe(true);
    });

    it("prevents tech from updating user roles", async () => {
      const ctx = createTechContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.users.updateRole({ userId: 1, role: "tech" })
      ).rejects.toThrow("Admin access required");
    });
  });
});
