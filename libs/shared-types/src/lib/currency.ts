/**
 * CURRENCY UTILITIES — Single source of truth
 * DB Storage:
 *   UZS: tiyin (×100). 213,000 so'm = 21300000
 *   KRW: whole won. 15,000 ₩ = 15000
 *
 * These functions convert DB values → display values
 */

// DB tiyin → display so'm (rounded to nearest 1000)
export function displayUzs(tiyin: string | number | bigint): number {
  if (tiyin === null || tiyin === undefined || tiyin === '') return 0;
  const raw = typeof tiyin === 'string' ? parseFloat(tiyin) : Number(tiyin);
  const som = raw / 100;
  return Math.round(som / 1000) * 1000;
}

// DB won → display won
export function displayKrw(won: string | number | bigint): number {
  if (won === null || won === undefined || won === '') return 0;
  return typeof won === 'string' ? parseFloat(won) : Number(won);
}

// Format UZS for UI: 21300000 → "213,000 so'm"
export function formatUzs(tiyin: string | number | bigint): string {
  const som = displayUzs(tiyin);
  return new Intl.NumberFormat('uz-UZ').format(som) + " so'm";
}

// Format KRW for UI: 15000 → "15,000 ₩"
export function formatKrw(won: string | number | bigint): string {
  const rounded = displayKrw(won);
  return new Intl.NumberFormat('ko-KR').format(rounded) + ' ₩';
}

// Format by region — USE THIS EVERYWHERE
export function formatPrice(amount: string | number | bigint, region: 'UZB' | 'KOR'): string {
  return region === 'KOR' ? formatKrw(amount) : formatUzs(amount);
}

// Admin input helpers: convert display value to DB value
export function somToTiyin(som: number): number {
  return Math.round(som * 100);
}

export function tiyinToSom(tiyin: string | number | bigint): number {
  if (tiyin === null || tiyin === undefined || tiyin === '') return 0;
  return Number(tiyin) / 100;
}
