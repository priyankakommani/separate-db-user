import { sql } from 'drizzle-orm';
import { index, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

export const clients = pgTable('clients', {
    id: serial('id').primaryKey(),
    organization_email: varchar('organization_email').notNull().unique(),
    organization_name: varchar('organization_name').notNull(),
    organization_logo: varchar('organization_logo'),
    organization_type: varchar('organization_type').notNull(),
    status: varchar('status').default('ACTIVE'),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
}, (t: any) => [
    index("email_idx").on(t.organization_email),
]);

export type ClientRow = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type clientsTable = typeof clients;