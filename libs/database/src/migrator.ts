import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { resolve } from 'path';
import { db } from './client';

export async function runMigrations() {
  // In local development (Nx serve), we use the workspace root.
  // In production (Docker), __dirname resolves to the dist output folder.
  const isLocalDev = !!process.env['NX_WORKSPACE_ROOT'];
  const defaultMigrationsPath = isLocalDev
    ? resolve(process.cwd(), 'libs/database/src/migrations')
    : resolve(__dirname, 'migrations');

  const migrationsFolder = process.env['MIGRATIONS_PATH'] || defaultMigrationsPath;

  await migrate(db, { migrationsFolder });
}
