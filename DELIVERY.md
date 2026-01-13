# Inventory Management MVP - Complete Deliverables

## A) SQL Migration

```sql
-- Table: inventory_items
CREATE TABLE inventory_items (
  id VARCHAR(36) PRIMARY KEY,
  category TEXT NOT NULL,
  product_code VARCHAR(255) NOT NULL UNIQUE,
  product_description TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  current_cost INT NOT NULL DEFAULT 0 CHECK (current_cost >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- Table: users (profiles with roles)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openId VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('admin', 'tech') DEFAULT 'tech' NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Seed data (10 sample items)
INSERT INTO inventory_items (id, category, product_code, product_description, quantity, current_cost, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Fire Extinguishers and accessories', 'FE-ABC-5LB', '5lb ABC Fire Extinguisher', 15, 4500, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'Fire Extinguishers and accessories', 'FE-BRACKET-WALL', 'Wall Mount Bracket for Fire Extinguisher', 25, 850, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'Emergency Light Packs and accessories', 'ELP-LED-12V', '12V LED Emergency Light Pack', 8, 6200, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'Batteries', 'BAT-9V-ALK', '9V Alkaline Battery', 50, 350, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'Steel Fittings', 'SF-ELBOW-90-1IN', '1" 90 Degree Steel Elbow', 2, 1250, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440006', 'Couplings', 'CP-RIGID-3/4IN', '3/4" Rigid Coupling', 30, 425, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440007', 'Smoke Alarms', 'SA-PHOTO-120V', '120V Photoelectric Smoke Alarm', 12, 2800, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440008', 'Heat Detectors', 'HD-FIXED-135F', '135°F Fixed Temperature Heat Detector', 1, 3200, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440009', 'Indicating Devices (Pull Stations, Strobes, Buzzers etc)', 'PS-MANUAL-RED', 'Manual Pull Station - Red', 6, 4800, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440010', 'Miscellaneous', 'MISC-SIGN-EXIT', 'LED Exit Sign with Battery Backup', 10, 5500, NOW(), NOW());
```

**RLS-Style Logic (Enforced in tRPC):**
- Both `admin` and `tech` can SELECT inventory_items
- `admin` can INSERT/UPDATE/DELETE all fields
- `tech` can UPDATE inventory_items but ONLY the `quantity` field

---

## B) File Tree (Created Files)

```
inventory-app/
├── drizzle/
│   └── schema.ts
├── server/
│   ├── db.ts
│   ├── routers.ts
│   └── inventory.test.ts
├── shared/
│   └── categories.ts
├── client/
│   └── src/
│       ├── App.tsx
│       └── pages/
│           ├── Login.tsx
│           └── Inventory.tsx
├── seed.sql
└── todo.md
```

---

## C) Code Files

### `drizzle/schema.ts`

```typescript
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "tech"]).default("tech").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const inventoryItems = mysqlTable("inventory_items", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  category: text("category").notNull(),
  productCode: varchar("product_code", { length: 255 }).notNull().unique(),
  productDescription: text("product_description").notNull(),
  quantity: int("quantity").notNull().default(0),
  currentCost: int("current_cost").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = typeof inventoryItems.$inferInsert;
```

### `shared/categories.ts`

```typescript
export const CATEGORIES = [
  "Fire Extinguishers and accessories",
  "Emergency Light Packs and accessories",
  "Batteries",
  "Steel Fittings",
  "Couplings",
  "Smoke Alarms",
  "Heat Detectors",
  "Smoke Detectors",
  "Backflow",
  "Indicating Devices (Pull Stations, Strobes, Buzzers etc)",
  "Miscellaneous",
] as const;

export type Category = typeof CATEGORIES[number];
```

### `server/db.ts`

```typescript
import { and, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, inventoryItems, InsertInventoryItem, InventoryItem } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

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
```

### `server/routers.ts`

```typescript
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
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
```

### `client/src/App.tsx`

```typescript
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Login from "./pages/Login";
import Inventory from "./pages/Inventory";

function Router() {
  return (
    <Switch>
      <Route path={"/login"} component={Login} />
      <Route path={"/inventory"} component={Inventory} />
      <Route path={"/"} component={Inventory} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
```

### `client/src/pages/Login.tsx`

```typescript
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/inventory");
    }
  }, [isAuthenticated, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-lg">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground">Sign in to access the inventory system</p>
        </div>
        <Button 
          className="w-full" 
          size="lg"
          onClick={() => window.location.href = getLoginUrl()}
        >
          Sign In
        </Button>
      </div>
    </div>
  );
}
```

### `client/src/pages/Inventory.tsx`

```typescript
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { CATEGORIES } from "@shared/categories";
import { Loader2, LogOut, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Inventory() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: allItems = [], isLoading } = trpc.inventory.list.useQuery();

  const updateQuantityMutation = trpc.inventory.updateQuantity.useMutation({
    onSuccess: () => {
      utils.inventory.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createMutation = trpc.inventory.create.useMutation({
    onSuccess: () => {
      utils.inventory.list.invalidate();
      setIsAddDialogOpen(false);
      toast.success("Item added successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.inventory.update.useMutation({
    onSuccess: () => {
      utils.inventory.list.invalidate();
      setEditingItem(null);
      toast.success("Item updated successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.inventory.delete.useMutation({
    onSuccess: () => {
      utils.inventory.list.invalidate();
      toast.success("Item deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const filteredItems = useMemo(() => {
    let items = allItems;
    
    if (selectedCategory !== "all") {
      items = items.filter(item => item.category === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.productCode.toLowerCase().includes(query) ||
        item.productDescription.toLowerCase().includes(query)
      );
    }
    
    return items.sort((a, b) => a.productCode.localeCompare(b.productCode));
  }, [allItems, selectedCategory, searchQuery]);

  const handleQuantityChange = (id: string, currentQty: number, delta: number) => {
    const newQty = Math.max(0, currentQty + delta);
    updateQuantityMutation.mutate({ id, quantity: newQty });
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  const isAdmin = user.role === "admin";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user.name} ({user.role})
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Input
            placeholder="Search by product code or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
          {isAdmin && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Item</DialogTitle>
                </DialogHeader>
                <ItemForm
                  onSubmit={(data) => createMutation.mutate(data)}
                  isLoading={createMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="w-full flex-wrap h-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            {CATEGORIES.map((cat) => (
              <TabsTrigger key={cat} value={cat}>
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin h-8 w-8" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No items found
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-4 font-semibold">Product Code</th>
                      <th className="text-left p-4 font-semibold">Description</th>
                      <th className="text-right p-4 font-semibold">Quantity</th>
                      <th className="text-right p-4 font-semibold">Current Cost</th>
                      <th className="text-right p-4 font-semibold">Value</th>
                      <th className="text-center p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => {
                      const value = (item.quantity * item.currentCost) / 100;
                      const isLowStock = item.quantity <= 2;
                      
                      return (
                        <tr 
                          key={item.id} 
                          className={`border-t ${isLowStock ? 'bg-red-50 dark:bg-red-950/20' : ''}`}
                        >
                          <td className="p-4 font-mono text-sm">{item.productCode}</td>
                          <td className="p-4">{item.productDescription}</td>
                          <td className="p-4 text-right font-semibold">{item.quantity}</td>
                          <td className="p-4 text-right">${(item.currentCost / 100).toFixed(2)}</td>
                          <td className="p-4 text-right font-semibold">${value.toFixed(2)}</td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                                disabled={updateQuantityMutation.isPending || item.quantity === 0}
                              >
                                -1
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                                disabled={updateQuantityMutation.isPending}
                              >
                                +1
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuantityChange(item.id, item.quantity, 5)}
                                disabled={updateQuantityMutation.isPending}
                              >
                                +5
                              </Button>
                              {isAdmin && (
                                <>
                                  <Dialog open={editingItem?.id === item.id} onOpenChange={(open) => !open && setEditingItem(null)}>
                                    <DialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setEditingItem(item)}
                                      >
                                        Edit
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Edit Item</DialogTitle>
                                      </DialogHeader>
                                      <ItemForm
                                        initialData={item}
                                        onSubmit={(data) => updateMutation.mutate({ id: item.id, ...data })}
                                        isLoading={updateMutation.isPending}
                                      />
                                    </DialogContent>
                                  </Dialog>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      if (confirm("Are you sure you want to delete this item?")) {
                                        deleteMutation.mutate({ id: item.id });
                                      }
                                    }}
                                    disabled={deleteMutation.isPending}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function ItemForm({ 
  initialData, 
  onSubmit, 
  isLoading 
}: { 
  initialData?: any; 
  onSubmit: (data: any) => void; 
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    category: initialData?.category || CATEGORIES[0],
    productCode: initialData?.productCode || "",
    productDescription: initialData?.productDescription || "",
    quantity: initialData?.quantity || 0,
    currentCost: initialData ? initialData.currentCost / 100 : 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      currentCost: Math.round(formData.currentCost * 100),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Product Code</Label>
        <Input
          required
          value={formData.productCode}
          onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Input
          required
          value={formData.productDescription}
          onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Quantity</Label>
        <Input
          type="number"
          min="0"
          required
          value={formData.quantity}
          onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
        />
      </div>

      <div className="space-y-2">
        <Label>Current Cost ($)</Label>
        <Input
          type="number"
          step="0.01"
          min="0"
          required
          value={formData.currentCost}
          onChange={(e) => setFormData({ ...formData, currentCost: parseFloat(e.target.value) || 0 })}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : initialData ? "Update" : "Add"}
      </Button>
    </form>
  );
}
```

---

## D) Environment Variables

```bash
# .env.example

# Database connection (MySQL/TiDB)
DATABASE_URL=mysql://user:password@host:port/database

# OAuth configuration (Manus Auth)
JWT_SECRET=auto-generated-secret
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
VITE_APP_ID=your-app-id

# Owner information
OWNER_OPEN_ID=owner-open-id
OWNER_NAME=Owner Name
```

**Usage:**
- `DATABASE_URL`: Used in `server/db.ts` for Drizzle ORM connection
- `JWT_SECRET`: Used in `server/_core/auth.ts` for session cookie signing
- `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`: Used in `server/_core/oauth.ts` and `client/src/const.ts` for authentication flow
- `OWNER_OPEN_ID`: Used in `server/db.ts` to auto-promote owner to admin role

---

## E) Run Steps

1. **Install dependencies:** `pnpm install`
2. **Configure environment:** Set `DATABASE_URL` in `.env`
3. **Push schema:** `pnpm db:push`
4. **Seed database:** Execute `seed.sql` via database client or Management UI
5. **Start dev server:** `pnpm dev`
6. **Access app:** Navigate to `http://localhost:3000`
