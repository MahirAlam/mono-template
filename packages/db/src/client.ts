
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "./schema";
import { Pool } from 'pg';

if (!process.env.POSTGRES_URL) {
  throw new Error("POSTGRES_URL is not defined");
}

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
}); 

export const db = drizzle({
  client: pool,
  schema,
  casing: "snake_case",
});
