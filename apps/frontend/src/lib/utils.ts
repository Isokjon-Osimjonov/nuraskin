import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUzs(amount: number | string): string {
  const wholeSom = Number(amount) / 100;
  const rounded = Math.round(wholeSom / 1000) * 1000;
  return new Intl.NumberFormat('uz-UZ').format(rounded) + " so'm";
}

export function formatKrw(amount: number | string): string {
  return new Intl.NumberFormat('ko-KR').format(Number(amount)) + " ₩";
}
