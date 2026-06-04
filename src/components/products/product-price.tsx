'use client';

import { cn } from '@/lib/utils';
import { useRegion } from '@/lib/hooks/use-region';
import { toDisplayPrice } from '@/lib/utils/price';

interface ProductPriceProps {
  /** Price in GHS (always — currency conversion is rendered client-side). */
  price: number;
  /** Compare-at price in GHS, for showing the strikethrough original. */
  compareAtPrice?: number;
  discountPercentage?: number;
  /** Discounted GHS price; if absent, computed from price + discountPercentage. */
  discountedPrice?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProductPrice({
  price,
  compareAtPrice,
  discountPercentage,
  discountedPrice,
  size = 'md',
  className,
}: ProductPriceProps) {
  const region = useRegion();
  const hasDiscount = discountPercentage && discountPercentage > 0;
  const displayGhs = hasDiscount && discountedPrice ? discountedPrice : price;
  const originalGhs = hasDiscount ? price : compareAtPrice;

  const sizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  const originalSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className={cn('font-bold text-primary', sizes[size])}>
        {toDisplayPrice(displayGhs, region)}
      </span>
      {originalGhs && originalGhs > displayGhs && (
        <span className={cn('text-gray-400 line-through', originalSizes[size])}>
          {toDisplayPrice(originalGhs, region)}
        </span>
      )}
      {hasDiscount && (
        <span className="px-2 py-0.5 bg-error text-white text-xs font-bold rounded">
          -{discountPercentage}%
        </span>
      )}
    </div>
  );
}
