import { db } from '../client';
import { healthChecks } from '../schema';

async function main(): Promise<void> {
  await db
    .insert(healthChecks)
    .values({ message: 'ok' })
    .onConflictDoNothing();
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    process.stderr.write(`${String(err)}\n`);
    process.exit(1);
  });
