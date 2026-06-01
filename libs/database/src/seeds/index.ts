import { db } from '../client';
import { healthChecks, settings, exchangeRateSnapshots, korShippingTiers } from '../schema';
import { adminUser } from './admin-user';

async function main(): Promise<void> {
  await Promise.all([
    // System health check
    db.insert(healthChecks).values({ message: 'ok' }).onConflictDoNothing(),

    // Admin user
    adminUser(),

    // Business settings
    db
      .insert(settings)
      .values({
        debtLimitDefault: 50000000n,
        lowStockThreshold: 10,
        minOrderUzbUzs: 20000000n, // 200,000 so'm
        minOrderKorKrw: 3000000n, // 30,000 ₩
      })
      .onConflictDoNothing(),

    // Initial exchange rate
    // UPDATE THIS via admin panel before launch
    db
      .insert(exchangeRateSnapshots)
      .values({
        krwToUzs: '14',
        cargoRateKrwPerKg: 10000,
        note: 'Initial rate — update before launch',
      })
      .onConflictDoNothing(),

    // Korean shipping tiers
    db
      .insert(korShippingTiers)
      .values([
        { maxOrderKrw: 100000n, cargoFeeKrw: 4000n, sortOrder: 1 },
        { maxOrderKrw: 200000n, cargoFeeKrw: 8000n, sortOrder: 2 },
        { maxOrderKrw: 300000n, cargoFeeKrw: 6000n, sortOrder: 3 },
        { maxOrderKrw: null, cargoFeeKrw: 0n, sortOrder: 4 },
      ])
      .onConflictDoNothing(),
  ]);
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    process.stderr.write(`${String(err)}\n`);
    process.exit(1);
  });
