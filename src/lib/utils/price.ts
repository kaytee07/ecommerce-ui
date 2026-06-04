import type { Region } from '@/types/region';

/**
 * Convert a GHS amount to the buyer's display currency.
 * GHS-on-GHS returns the original amount; everything else multiplies by fxRate.
 */
export function toDisplayAmount(amountGhs: number, region: Region): number {
  if (region.displayCurrency === 'GHS') return amountGhs;
  return Number((amountGhs * region.fxRate).toFixed(2));
}

/**
 * Format a GHS amount as the buyer's local currency string.
 *
 *   toDisplayPrice(200, { displayCurrency: 'GBP', fxRate: 0.05, ... }) → '£10.00'
 *   toDisplayPrice(200, { displayCurrency: 'GHS', fxRate: 1, ... })    → 'GH₵200.00'
 */
export function toDisplayPrice(amountGhs: number, region: Region): string {
  const amount = toDisplayAmount(amountGhs, region);
  try {
    return new Intl.NumberFormat(localeFor(region.displayCurrency), {
      style: 'currency',
      currency: region.displayCurrency,
    }).format(amount);
  } catch {
    return `${region.displayCurrency} ${amount.toFixed(2)}`;
  }
}

/**
 * Format a GHS amount in GHS regardless of region — used for the checkout
 * disclosure ("charged as GHS X by our payment processor").
 */
export function toGhsPrice(amountGhs: number): string {
  try {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amountGhs);
  } catch {
    return `GHS ${amountGhs.toFixed(2)}`;
  }
}

function localeFor(currency: string): string {
  switch (currency.toUpperCase()) {
    case 'GBP':
      return 'en-GB';
    case 'USD':
      return 'en-US';
    case 'EUR':
      return 'en-IE';
    case 'NGN':
      return 'en-NG';
    case 'KES':
      return 'en-KE';
    case 'ZAR':
      return 'en-ZA';
    case 'GHS':
    default:
      return 'en-GH';
  }
}
