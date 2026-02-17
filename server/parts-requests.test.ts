import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(role: "admin" | "tech", userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-${role}-${userId}`,
    email: `${role}@test.com`,
    name: `${role} User`,
    loginMethod: "test",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    password: null,
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

describe("Parts Requests", () => {
  it("should allow tech user to create a parts request", async () => {
    const ctx = createMockContext("tech", 2);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.partsRequests.create({
      jobId: "JOB-12345",
      category: "Batteries",
      productCode: "BATTERY-01",
      requestedDescription: "6V 5AH SLA Battery",
      quantityRequested: 5,
      priority: "normal",
    });

    expect(result.success).toBe(true);
    expect(result.requestId).toBeDefined();
  });

  it("should allow tech user to list their own requests", async () => {
    const ctx = createMockContext("tech", 2);
    const caller = appRouter.createCaller(ctx);

    const requests = await caller.partsRequests.list();
    expect(Array.isArray(requests)).toBe(true);
  });

  it("should allow admin to list all requests", async () => {
    const ctx = createMockContext("admin");
    const caller = appRouter.createCaller(ctx);

    const requests = await caller.partsRequests.list();
    expect(Array.isArray(requests)).toBe(true);
  });

  it("should allow admin to get new requests count", async () => {
    const ctx = createMockContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.partsRequests.getNewCount();
    expect(result.count).toBeGreaterThanOrEqual(0);
  });

  it("should return zero count for tech user", async () => {
    const ctx = createMockContext("tech", 2);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.partsRequests.getNewCount();
    expect(result.count).toBe(0);
  });

  it("should filter requests by status", async () => {
    const ctx = createMockContext("admin");
    const caller = appRouter.createCaller(ctx);

    const newRequests = await caller.partsRequests.list({ status: "new" });
    expect(Array.isArray(newRequests)).toBe(true);
  });

  it("should search requests by job ID", async () => {
    const ctx = createMockContext("admin");
    const caller = appRouter.createCaller(ctx);

    const results = await caller.partsRequests.list({ search: "JOB-" });
    expect(Array.isArray(results)).toBe(true);
  });

  it("should not allow tech user to update request status", async () => {
    const ctx = createMockContext("tech", 2);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.partsRequests.updateStatus({
        id: "test-id",
        status: "ordered",
      })
    ).rejects.toThrow("Admin only");
  });
});
