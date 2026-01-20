import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ProductPriceProps {
  price: number;
  compareAtPrice?: number;
  discountPercentage?: number;
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
  const hasDiscount = discountPercentage && discountPercentage > 0;
  const displayPrice = hasDiscount && discountedPrice ? discountedPrice : price;
  const originalPrice = hasDiscount ? price : compareAtPrice;

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
        {formatCurrency(displayPrice)}
      </span>
      {originalPrice && originalPrice > displayPrice && (
        <span className={cn('text-gray-400 line-through', originalSizes[size])}>
          {formatCurrency(originalPrice)}
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
