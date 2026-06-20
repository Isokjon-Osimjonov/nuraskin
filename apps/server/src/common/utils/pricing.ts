import { db, korShippingTiers } from '@nuraskin/database';
import { eq, asc } from 'drizzle-orm';

// Rounding helper (nearest 1,000 UZS = 100,000 minor units)
export const round1000UZS = (val: bigint) =>
  (val / 100000n) * 100000n + (val % 100000n >= 50000n ? 100000n : 0n);

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
  const safeWeightGrams = Math.round(weightGrams);
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
  const cargoFeeUzsMinor =
    (BigInt(safeWeightGrams) * cargoRateKrwScaled * krwToUzsScaled * 100n) /
    (1000n * SCALE * SCALE);

  return {
    productPrice: round1000UZS(productUzsMinor),
    cargoFee: round1000UZS(cargoFeeUzsMinor),
  };
}

/**
 * Calculate the fee for a specific box in UZS minor units.
 * Includes both freight surcharge for tare weight and material cost.
 */
export function calculateBoxFeeUzs(
  box: { tareWeightGrams: number; costPriceKrw: string | bigint | number },
  rate: { krwToUzs: string | number; cargoRateKrwPerKg: string | number }
) {
  const krwToUzs = typeof rate.krwToUzs === 'string' ? parseFloat(rate.krwToUzs) : rate.krwToUzs;
  const cargoRateKrw =
    typeof rate.cargoRateKrwPerKg === 'string'
      ? parseFloat(rate.cargoRateKrwPerKg)
      : rate.cargoRateKrwPerKg;

  const SCALE = 10000n;
  const krwToUzsScaled = BigInt(Math.round(krwToUzs * Number(SCALE)));
  const cargoRateKrwScaled = BigInt(Math.round(cargoRateKrw * Number(SCALE)));

  // freightSurchargeUzsMinor = (tareGrams / 1000) * cargoRateKrwScaled * krwToUzsScaled * 100 / (SCALE * SCALE)
  const freightSurchargeUzsMinor =
    (BigInt(box.tareWeightGrams) * cargoRateKrwScaled * krwToUzsScaled * 100n) /
    (1000n * SCALE * SCALE);

  // materialCostUzsMinor = costPriceKrw * krwToUzsScaled * 100 / SCALE
  const costPriceKrw = BigInt(box.costPriceKrw.toString());
  const materialCostUzsMinor = (costPriceKrw * krwToUzsScaled * 100n) / SCALE;

  return round1000UZS(freightSurchargeUzsMinor + materialCostUzsMinor);
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
