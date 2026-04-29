import { db } from '../client';
import { healthChecks, settings, exchangeRateSnapshots, customers, korShippingTiers } from '../schema';
import { adminUser } from './admin-user';

async function main(): Promise<void> {
  await Promise.all([
    db.insert(healthChecks).values({ message: 'ok' }).onConflictDoNothing(),
    adminUser(),
    db
      .insert(settings)
      .values({
        debtLimitDefault: 50000000n, // $500,000 in cents
        lowStockThreshold: 10,
        minOrderUzbUzs: 20000000n, // 200,000 UZS in minor units
        minOrderKorKrw: 3000000n, // 30,000 KRW in minor units
      })
      .onConflictDoNothing(),
    db
      .insert(exchangeRateSnapshots)
      .values({
        krwToUzs: 9,
        cargoRateKrwPerKg: 10000,
        note: 'Initial seed rate',
      })
      .onConflictDoNothing(),
    db
      .insert(korShippingTiers)
      .values([
        { maxOrderKrw: 100000n, cargoFeeKrw: 4000n, sortOrder: 1 },
        { maxOrderKrw: 200000n, cargoFeeKrw: 8000n, sortOrder: 2 },
        { maxOrderKrw: 300000n, cargoFeeKrw: 6000n, sortOrder: 3 },
        { maxOrderKrw: null, cargoFeeKrw: 0n, sortOrder: 4 },
      ])
      .onConflictDoNothing(),
    db
      .insert(customers)
      .values({
        fullName: 'Test Customer',
        phone: '+998901234567',
        regionCode: 'UZB',
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
