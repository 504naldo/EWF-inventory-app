cat > drizzle/schema.ts << 'EOF'
import { mysqlTable, mysqlSchema, AnyMySqlColumn, index, varchar, text, int, timestamp, mysqlEnum } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const inventoryItems = mysqlTable("inventory_items", {
	id: varchar({ length: 36 }).notNull(),
	category: text().notNull(),
	productCode: varchar("product_code", { length: 255 }).notNull(),
	productDescription: text("product_description").notNull(),
	quantity: int().default(0).notNull(),
	currentCost: int("current_cost").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("inventory_items_product_code_unique").on(table.productCode),
]);

export const partsRequests = mysqlTable("parts_requests", {
	id: varchar({ length: 36 }).notNull(),
	buildingId: varchar("building_id", { length: 255 }).notNull(),
	category: text().notNull(),
	productCode: varchar("product_code", { length: 255 }),
	requestedDescription: text("requested_description").notNull(),
	quantityRequested: int("quantity_requested").notNull(),
	priority: mysqlEnum(['normal','urgent']).default('normal').notNull(),
	status: mysqlEnum(['new','ordered','ready','completed','denied']).default('new').notNull(),
	notes: text(),
	adminNotes: text("admin_notes"),
	createdBy: int("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	openId: varchar({ length: 64 }).notNull(),
	name: text(),
	email: varchar({ length: 320 }),
	loginMethod: varchar({ length: 64 }),
	role: mysqlEnum(['admin','tech']).default('tech').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	lastSignedIn: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	password: varchar({ length: 255 }),
},
(table) => [
	index("users_openId_unique").on(table.openId),
]);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type PartsRequest = typeof partsRequests.$inferSelect;
EOF