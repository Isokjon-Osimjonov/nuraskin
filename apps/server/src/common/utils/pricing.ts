import { db, korShippingTiers } from '@nuraskin/database';
import { eq, asc } from 'drizzle-orm';

/**
 * UZB pricing logic:
 * productUzs = priceKrw × krwToUzs
 * cargoUzs = (weightGrams / 1000) × cargoRateKrwPerKg × krwToUzs
 * 
 * INPUTS: priceKrw (whole KRW), weightGrams (integer)
 * OUTPUTS: Values in UZS minor units (tiyin, multiplied by 100)
 * Rounded to nearest 1,000 UZS (which is 100,000 in minor units)
 */
export function calculateUzbPrice(priceKrw: bigint, weightGrams: number, rate: { krwToUzs: number; cargoRateKrwPerKg: number }) {
  const krwToUzs = BigInt(rate.krwToUzs);
  const cargoRateKrw = BigInt(rate.cargoRateKrwPerKg);

  // KRW is whole units in DB. 
  // To get UZS minor units (tiyin), we multiply by krwToUzs and then by 100.
  const productUzsMinor = priceKrw * krwToUzs * 100n;

  // cargoUzsMinor = (grams / 1000) * cargoRateKrw * krwToUzs * 100
  const cargoUzsMinor = (BigInt(weightGrams) * cargoRateKrw * krwToUzs * 100n) / 1000n;

  // Rounding helper (nearest 1,000 UZS = 100,000 minor units)
  const round1000UZS = (val: bigint) => (val / 100000n) * 100000n + (val % 100000n >= 50000n ? 100000n : 0n);

  return {
    productPrice: round1000UZS(productUzsMinor),
    cargoFee: round1000UZS(cargoUzsMinor),
  };
}

/**
 * KOR pricing logic:
 * productKrw = priceKrw
 * 
 * INPUTS: priceKrw (whole KRW)
 * OUTPUTS: Values in whole KRW
 */
export function calculateKorPrice(priceKrw: bigint) {
  return priceKrw;
}

/**
 * KOR cargo logic: tiered based on total order amount
 * orderTotalKrw is in whole KRW.
 */
export async function calculateKorCargo(orderTotalKrw: bigint) {
  const tiers = await db
    .select()
    .from(korShippingTiers)
    .where(eq(korShippingTiers.isActive, true))
    .orderBy(asc(korShippingTiers.sortOrder));

  for (const tier of tiers) {
    const maxOrder = tier.maxOrderKrw ? BigInt(tier.maxOrderKrw) : null;
    const fee = BigInt(tier.cargoFeeKrw);

    if (maxOrder === null || orderTotalKrw < maxOrder) {
      return fee;
    }
  }

  return 0n;
}
