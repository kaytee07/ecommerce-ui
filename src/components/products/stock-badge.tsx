import { cn } from '@/lib/utils';

interface StockBadgeProps {
  quantity: number;
  lowStockThreshold?: number;
  className?: string;
}

export function StockBadge({ quantity, lowStockThreshold = 5, className }: StockBadgeProps) {
  if (quantity <= 0) {
    return (
      <span className={cn('text-sm font-medium text-error', className)}>
        Out of Stock
      </span>
    );
  }

  if (quantity <= lowStockThreshold) {
    return (
      <span className={cn('text-sm font-medium text-warning', className)}>
        Only {quantity} left
      </span>
    );
  }

  return (
    <span className={cn('text-sm font-medium text-success', className)}>
      In Stock
    </span>
  );
}
