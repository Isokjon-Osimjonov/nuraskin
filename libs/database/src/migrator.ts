import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { resolve } from 'path';
import { db } from './client';

export async function runMigrations() {
  // Use MIGRATIONS_PATH env var if provided, otherwise default to a path
  // relative to the current file. In development, this works because
  // migrations are in the same folder. In production, we must ensure
  // the migrations folder is copied to the correct location.
  const migrationsFolder = process.env['MIGRATIONS_PATH'] || resolve(__dirname, 'migrations');
  
  await migrate(db, { migrationsFolder });
}
