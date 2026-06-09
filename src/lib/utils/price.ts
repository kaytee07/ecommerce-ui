import type { Region } from '@/types/region';

/**
 * Keep storefront amounts in GHS.
 * The backend still resolves region and FX data, but the UI should remain
 * cedis-only for the buyer-facing price display.
 */
export function toDisplayAmount(amountGhs: number, region: Region): number {
  void region;
  return amountGhs;
}

/**
 * Format a GHS amount as a cedi string for the storefront.
 *
 *   toDisplayPrice(200, ...) → 'GH₵200.00'
 */
export function toDisplayPrice(amountGhs: number, region: Region): string {
  const amount = toDisplayAmount(amountGhs, region);
  try {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  } catch {
    return `GHS ${amount.toFixed(2)}`;
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
    case 'GHS':
    default:
      return 'en-GH';
  }
}
