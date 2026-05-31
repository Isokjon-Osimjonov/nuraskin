/**
 * CURRENCY UTILITIES — Single source of truth
 * DB: UZS in tiyin (×100), KRW in whole won
 */
export function displayUzs(tiyin: string | number | bigint): number {
  const som = Number(tiyin) / 100;
  return Math.round(som / 1000) * 1000;
}
export function displayKrw(won: string | number | bigint): number {
  return Math.round(Number(won) / 100) * 100;
}
export function formatUzs(tiyin: string | number | bigint): string {
  return new Intl.NumberFormat('uz-UZ').format(displayUzs(tiyin)) + " so'm";
}
export function formatKrw(won: string | number | bigint): string {
  return new Intl.NumberFormat('ko-KR').format(displayKrw(won)) + ' ₩';
}
export function formatPrice(amount: string | number | bigint, region: 'UZB' | 'KOR'): string {
  return region === 'KOR' ? formatKrw(amount) : formatUzs(amount);
}
export function somToTiyin(som: number): number {
  return Math.round(som * 100);
}
export function tiyinToSom(tiyin: string | number | bigint): number {
  return Number(tiyin) / 100;
}
