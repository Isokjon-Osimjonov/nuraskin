import type { ShippingBox } from '@nuraskin/database';
import { db, shippingBoxes } from '@nuraskin/database';
import { eq } from 'drizzle-orm';

interface BoxSelection {
  boxId: string;
  name: string;
  quantity: number;
  tareWeightGrams: number;
}

export async function getActiveBoxes(tx: any = db): Promise<ShippingBox[]> {
  return await tx.select().from(shippingBoxes).where(eq(shippingBoxes.isActive, true));
}

export function recommendBoxes(
  totalProductWeightGrams: number,
  activeBoxes: ShippingBox[]
): {
  boxes: BoxSelection[];
  totalTareWeightGrams: number;
} {
  // SAFETY: no boxes configured → graceful fallback, zero overhead
  if (!activeBoxes.length || totalProductWeightGrams <= 0) {
    return { boxes: [], totalTareWeightGrams: 0 };
  }

  const sorted = [...activeBoxes].sort((a, b) => a.maxWeightGrams - b.maxWeightGrams);

  // Try smallest single box that fits
  const fits = sorted.find(b => b.maxWeightGrams >= totalProductWeightGrams);

  if (fits) {
    return {
      boxes: [
        {
          boxId: fits.id,
          name: fits.name,
          quantity: 1,
          tareWeightGrams: fits.tareWeightGrams,
        },
      ],
      totalTareWeightGrams: fits.tareWeightGrams,
    };
  }

  // Exceeds largest box — use multiples of the largest
  const largest = sorted[sorted.length - 1];
  const qty = Math.ceil(totalProductWeightGrams / largest.maxWeightGrams);
  return {
    boxes: [
      {
        boxId: largest.id,
        name: largest.name,
        quantity: qty,
        tareWeightGrams: largest.tareWeightGrams,
      },
    ],
    totalTareWeightGrams: largest.tareWeightGrams * qty,
  };
}

export function getWeightScalingFactor(
  totalProductWeightGrams: number,
  activeBoxes: ShippingBox[]
): number {
  if (totalProductWeightGrams <= 0) {
    return 1; // no weight, no scaling
  }
  const { totalTareWeightGrams } = recommendBoxes(totalProductWeightGrams, activeBoxes);
  return 1 + totalTareWeightGrams / totalProductWeightGrams;
}
