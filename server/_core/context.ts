import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { verifyToken } from "../auth-helpers";
import * as db from "../db";
import { parse as parseCookie } from "cookie";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // First try: check for auth_token cookie (set by REST login)
  const cookieHeader = opts.req.headers.cookie;
  if (cookieHeader) {
    const cookies = parseCookie(cookieHeader);
    const authToken = cookies["auth_token"];
    if (authToken) {
      try {
        const decoded = await verifyToken(authToken);
        if (decoded) {
          const found = await db.getUserById(decoded.userId);
          if (found) {
            user = found as User;
          }
        }
      } catch (error) {
        // Token invalid, continue to next auth method
      }
    }
  }

  // Second try: Manus OAuth session cookie (legacy)
  if (!user) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
