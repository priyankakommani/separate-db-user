import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import { index, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import 'dotenv/config';
import { serve } from '@hono/node-server';

export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  organization_email: varchar('organization_email').notNull().unique(),
  organization_name: varchar('organization_name').notNull(),
  organization_logo: varchar('organization_logo'),
  organization_type: varchar('organization_type').notNull(),
  status: varchar('status').default('ACTIVE'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
}, (t: any) => [
  index('email_idx').on(t.organization_email),
]);

export type ClientRow = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;

const adminClient = postgres(process.env.ADMIN_DB_URL!);
const mainClient = postgres(process.env.MAIN_DB_URL!);

async function ensureRegistryTable() {
  await mainClient`
        CREATE TABLE IF NOT EXISTS user_db_registry (
            id SERIAL PRIMARY KEY,
            db_name TEXT NOT NULL,
            connection_url TEXT NOT NULL
        );
    `;
}

await ensureRegistryTable();

const app = new Hono();


app.post('/register', async (c) => {
  const body = await c.req.json();
  
  const { organization_email, organization_name, organization_logo, organization_type } = body;

  if (!organization_email || !organization_name || !organization_type) {
    return c.json({ success: false, error: 'Missing required fields' }, 400);
  }

  const dbName = organization_name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '') ;

  const connectionUrl = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${dbName}?sslmode=require`;

  try {
    // Create the database
    await adminClient`CREATE DATABASE ${adminClient(dbName)}`;

    // Connect to the new DB and create the clients table
    const userClient = postgres(connectionUrl, { ssl: 'require' });
    const userDb = drizzle(userClient);

    await userDb.execute(sql`
      CREATE TABLE IF NOT EXISTS clients (
          id SERIAL PRIMARY KEY,
          organization_email VARCHAR NOT NULL UNIQUE,
          organization_name VARCHAR NOT NULL,
          organization_logo VARCHAR,
          organization_type VARCHAR NOT NULL,
          status VARCHAR DEFAULT 'ACTIVE',
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS email_idx ON clients (organization_email);
    `);

    await userDb.insert(clients).values({
      organization_email,
      organization_name,
      organization_logo,
      organization_type
    });

    await mainClient`
      INSERT INTO user_db_registry ( db_name, connection_url)
      VALUES ( ${dbName}, ${connectionUrl})
    `;

    return c.json({ success: true,  dbName });
  } catch (err) {
    console.error(err);
    return c.json({ success: false, error: (err as Error).message }, 500);
  }
});


app.get('/clients/:id', async (c) => {
  const id= c.req.param('id');

  const result = await mainClient`
        SELECT connection_url FROM user_db_registry WHERE id = ${id}
    `;
  if (result.length === 0) return c.json({ error: 'User DB not found' }, 404);

  const connectionUrl = result[0].connection_url;
  const userClient = postgres(connectionUrl);
  const userDb = drizzle(userClient);

  const data = await userDb.select().from(clients);
  return c.json({ clients: data });
});

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})

export default app;
