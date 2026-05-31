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
export function calculateUzbPrice(
  priceKrw: bigint,
  weightGrams: number,
  rate: { krwToUzs: string | number; cargoRateKrwPerKg: string | number }
) {
  const krwToUzs = typeof rate.krwToUzs === 'string' ? parseFloat(rate.krwToUzs) : rate.krwToUzs;
  const cargoRateKrw =
    typeof rate.cargoRateKrwPerKg === 'string'
      ? parseFloat(rate.cargoRateKrwPerKg)
      : rate.cargoRateKrwPerKg;

  // Since rates can be decimals (e.g. 14.5), we scale them by 10000 to maintain precision in BigInt math.
  const SCALE = 10000n;
  const krwToUzsScaled = BigInt(Math.round(krwToUzs * Number(SCALE)));
  const cargoRateKrwScaled = BigInt(Math.round(cargoRateKrw * Number(SCALE)));

  // productUzsMinor = (priceKrw * krwToUzsScaled * 100) / SCALE
  const productUzsMinor = (priceKrw * krwToUzsScaled * 100n) / SCALE;

  // cargoUzsMinor = (grams / 1000) * cargoRateKrwScaled * krwToUzsScaled * 100 / (SCALE * SCALE)
  // cargoFee (UZS) = weight (kg) * cargoRate (KRW/kg) * exchangeRate (UZS/KRW)
  const weightKgScaled = BigInt(weightGrams) * SCALE; // scaled by SCALE
  const cargoFeeUzsMinor =
    (weightKgScaled * cargoRateKrwScaled * krwToUzsScaled * 100n) / (1000n * SCALE * SCALE);

  // Rounding helper (nearest 1,000 UZS = 100,000 minor units)
  const round1000UZS = (val: bigint) =>
    (val / 100000n) * 100000n + (val % 100000n >= 50000n ? 100000n : 0n);

  return {
    productPrice: round1000UZS(productUzsMinor),
    cargoFee: round1000UZS(cargoFeeUzsMinor),
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
