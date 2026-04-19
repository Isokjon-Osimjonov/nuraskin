import { db } from '../client';
import { healthChecks } from '../schema';
import { adminUser } from './admin-user';

async function main(): Promise<void> {
  await Promise.all([
    db
      .insert(healthChecks)
      .values({ message: 'ok' })
      .onConflictDoNothing(),
    adminUser(),
  ]);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    process.stderr.write(`${String(err)}\n`);
    process.exit(1);
  });
