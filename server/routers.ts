import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  inventory: router({
    list: protectedProcedure.query(async () => {
      return db.getAllInventoryItems();
    }),
    
    listByCategory: protectedProcedure
      .input(z.object({ category: z.string() }))
      .query(async ({ input }) => {
        return db.getInventoryItemsByCategory(input.category);
      }),
    
    search: protectedProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) => {
        return db.searchInventoryItems(input.query);
      }),
    
    create: protectedProcedure
      .input(z.object({
        category: z.string(),
        productCode: z.string(),
        productDescription: z.string(),
        quantity: z.number().int().min(0),
        currentCost: z.number().int().min(0),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
        }
        await db.createInventoryItem(input);
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        category: z.string().optional(),
        productCode: z.string().optional(),
        productDescription: z.string().optional(),
        quantity: z.number().int().min(0).optional(),
        currentCost: z.number().int().min(0).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
        }
        const { id, ...updates } = input;
        await db.updateInventoryItem(id, updates);
        return { success: true };
      }),
    
    updateQuantity: protectedProcedure
      .input(z.object({
        id: z.string(),
        quantity: z.number().int().min(0),
      }))
      .mutation(async ({ input }) => {
        await db.updateInventoryQuantity(input.id, input.quantity);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
        }
        await db.deleteInventoryItem(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
