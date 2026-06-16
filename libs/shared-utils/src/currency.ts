/**
 * CURRENCY UTILITIES — Single source of truth
 * DB: UZS in tiyin (×100), KRW in whole won
 */

export function displayUzs(tiyin: string | number | bigint): number {
  if (tiyin === null || tiyin === undefined || tiyin === '') return 0;
  // DB stores tiyin (e.g. 1000000 = 10,000.00 so'm)
  // We divide by 100 to get som, then round to nearest 1000 for cleaner display
  const raw = typeof tiyin === 'string' ? parseFloat(tiyin) : Number(tiyin);
  const som = raw / 100;
  return Math.round(som / 1000) * 1000;
}

export function displayKrw(won: string | number | bigint): number {
  if (won === null || won === undefined || won === '') return 0;
  // DB stores whole won (e.g. 15000 = 15,000 ₩)
  // We round to nearest 100 for cleaner display
  const raw = typeof won === 'string' ? parseFloat(won) : Number(won);
  return Math.round(raw / 100) * 100;
}

export function formatUzs(tiyin: string | number | bigint): string {
  const som = displayUzs(tiyin);
  return new Intl.NumberFormat('uz-UZ').format(som) + " so'm";
}

export function formatKrw(won: string | number | bigint): string {
  const rounded = displayKrw(won);
  return new Intl.NumberFormat('ko-KR').format(rounded) + ' ₩';
}

export function formatPrice(amount: string | number | bigint, region: 'UZB' | 'KOR'): string {
  return region === 'KOR' ? formatKrw(amount) : formatUzs(amount);
}

export function somToTiyin(som: number): number {
  return Math.round(som * 100);
}

export function tiyinToSom(tiyin: string | number | bigint): number {
  if (tiyin === null || tiyin === undefined || tiyin === '') return 0;
  return Number(tiyin) / 100;
}
