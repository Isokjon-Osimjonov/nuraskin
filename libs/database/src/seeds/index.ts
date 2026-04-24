import { db } from '../client';
import { healthChecks, settings, exchangeRateSnapshots } from '../schema';
import { adminUser } from './admin-user';

async function main(): Promise<void> {
  await Promise.all([
    db.insert(healthChecks).values({ message: 'ok' }).onConflictDoNothing(),
    adminUser(),
    db
      .insert(settings)
      .values({
        debtLimitDefault: 50000000n, // 500 USD in UZS cents (~500 * 100)
        lowStockThreshold: 10,
      })
      .onConflictDoNothing(),
    db
      .insert(exchangeRateSnapshots)
      .values({
        usdToUzs: 12600n,
        usdToKrw: 1340n,
        cargoRateUsdPerKg: 1000, // $10 per kg stored as cents
        note: 'Initial seed rate',
      })
      .onConflictDoNothing(),
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
