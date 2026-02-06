'use client';

import { SafeImage } from '@/components/ui';
import Link from 'next/link';
import { Product, Inventory } from '@/types';
import { formatCurrency, getProductThumbnailUrl } from '@/lib/utils';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/lib/stores';
import { useState } from 'react';
import { enablePlaceholders } from '@/lib/config';

interface ProductCardProps {
  product: Product;
  showQuickAdd?: boolean;
  inventory?: Inventory | null;
}

export function ProductCard({ product, showQuickAdd = true, inventory }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const { addItem } = useCartStore();
  const hasOptions = Array.isArray((product.attributes as { options?: unknown } | undefined)?.options)
    && ((product.attributes as { options?: unknown }).options as unknown[]).length > 0;

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    setAddError(null);
    try {
      await addItem(product.id, 1);
    } catch (err) {
      // Show brief error feedback
      setAddError('Failed to add');
      setTimeout(() => setAddError(null), 2000);
    } finally {
      setIsAdding(false);
    }
  };

  const discountPercent = product.currentDiscountPercentage ?? product.discountPercentage;
  const hasDiscount = typeof discountPercent === 'number' && discountPercent > 0;
  const displayPrice = hasDiscount && product.effectivePrice ? product.effectivePrice : product.price;

  // Determine stock status from inventory prop first, then fallback to product.stockQuantity
  const availableQty = inventory?.availableQuantity ??
    (typeof product.stockQuantity === 'number' ? product.stockQuantity : null);
  const isOutOfStock = availableQty !== null ? availableQty <= 0 : false;
  const isLowStock = availableQty !== null && availableQty > 0 && availableQty <= 5;

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
        {/* Image Container */}
        <div className="relative aspect-product bg-gray-100 overflow-hidden">
          <SafeImage
            src={getProductThumbnailUrl(product) || (enablePlaceholders ? '/placeholder.svg' : undefined)}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            fallbackSrc={enablePlaceholders ? '/placeholder.svg' : undefined}
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {hasDiscount && (
              <span className="px-2 py-1 bg-error text-white text-xs font-bold rounded">
                -{discountPercent}%
              </span>
            )}
            {product.featured && (
              <span className="px-2 py-1 bg-secondary text-primary text-xs font-bold rounded">
                Featured
              </span>
            )}
          </div>

          {/* Quick Add Button */}
          {showQuickAdd && !isOutOfStock && !hasOptions && (
            <button
              onClick={handleQuickAdd}
              disabled={isAdding}
              className="absolute bottom-2 right-2 p-2 bg-primary text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-primary-hover disabled:opacity-50"
              aria-label="Add to cart"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          )}

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="px-4 py-2 bg-white text-gray-900 font-medium rounded">
                Out of Stock
              </span>
            </div>
          )}

          {/* Add Error Feedback */}
          {addError && (
            <div className="absolute bottom-2 left-2 right-2 bg-error text-white text-xs py-1 px-2 rounded text-center">
              {addError}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            {product.categoryName}
          </p>
          <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-lg font-bold text-primary">
              {formatCurrency(displayPrice)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>
          {/* Low Stock Warning */}
          {isLowStock && !isOutOfStock && (
            <p className="mt-1 text-xs text-warning font-medium">
              Only {availableQty} left
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
