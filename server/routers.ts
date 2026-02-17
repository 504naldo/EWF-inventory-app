import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { notifyOwner } from "./_core/notification";

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

  users: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }
      return db.getAllUsers();
    }),
    updateRole: protectedProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(['admin', 'tech']),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        await db.updateUserRole(input.userId, input.role);
        return { success: true };
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

  partsRequests: router({
    // Tech + Admin can create requests
    create: protectedProcedure
      .input(z.object({
        jobId: z.string().min(1),
        category: z.string().min(1),
        productCode: z.string().optional(),
        requestedDescription: z.string().min(1),
        quantityRequested: z.number().int().min(1),
        priority: z.enum(['normal', 'urgent']).default('normal'),
      }))
      .mutation(async ({ ctx, input }) => {
        const requestId = await db.createPartsRequest({
          ...input,
          createdBy: ctx.user.id,
        });
        
        // Notify admin
        try {
          await notifyOwner({
            title: `New Parts Request: ${input.jobId}`,
            content: `Job ID: ${input.jobId}\nCategory: ${input.category}\nQty: ${input.quantityRequested}\nDescription: ${input.requestedDescription}\nRequester: ${ctx.user.email || ctx.user.name}\nPriority: ${input.priority}\n\nView at: https://invmanage-qyyacr2d.manus.space/requests`,
          });
        } catch (error) {
          console.error("Failed to send notification:", error);
        }
        
        return { success: true, requestId };
      }),

    // Tech can list their own requests, Admin can list all
    list: protectedProcedure
      .input(z.object({
        status: z.enum(['new', 'ordered', 'ready', 'completed', 'denied']).optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role === 'admin') {
          return db.getAllPartsRequests(input);
        } else {
          return db.getUserPartsRequests(ctx.user.id, input);
        }
      }),

    // Admin can update status and notes
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.string(),
        status: z.enum(['new', 'ordered', 'ready', 'completed', 'denied']),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' });
        }
        await db.updatePartsRequestStatus(input.id, input.status, input.notes);
        return { success: true };
      }),

    // Admin can get count of new requests for badge
    getNewCount: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        return { count: 0 };
      }
      const count = await db.getNewPartsRequestsCount();
      return { count };
    }),
  }),
});

export type AppRouter = typeof appRouter;
