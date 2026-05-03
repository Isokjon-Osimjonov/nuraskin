import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export { formatUzs, formatKrw, formatPrice, displayUzs, displayKrw, somToTiyin, tiyinToSom } from './currency';
