'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore, useAuthStore } from '@/lib/stores';
import { apiClient } from '@/lib/api/client';
import { formatCurrency, getProductThumbnailUrl, fetchBatchInventory } from '@/lib/utils';
import { Product, Inventory } from '@/types';
import { Button, EmptyCart, Skeleton } from '@/components/ui';
import { Minus, Plus, Trash2, ArrowRight, AlertTriangle } from 'lucide-react';

export default function CartPage() {
  const { cart, isLoading, error, fetchCart, updateQuantity, removeItem, clearError } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [itemImages, setItemImages] = useState<Record<string, string>>({});
  const [inventoryMap, setInventoryMap] = useState<Map<string, Inventory>>(new Map());
  const [stockWarnings, setStockWarnings] = useState<Map<string, string>>(new Map());
  const getItemKey = (item: { itemKey?: string; productId: string }) => item.itemKey || item.productId;

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated, fetchCart]);

  useEffect(() => {
    if (!cart?.items || cart.items.length === 0) return;
    const missingIds = cart.items
      .map((item) => item.productId)
      .filter((id) => !itemImages[id]);
    if (missingIds.length === 0) return;

    let cancelled = false;
    const fetchImages = async () => {
      try {
        const results = await Promise.all(
          missingIds.map(async (id) => {
            try {
              const res = await apiClient.get<{ status: boolean; data: Product }>(`/store/products/${id}`);
              return { id, product: res.data.data };
            } catch {
              return null;
            }
          })
        );
        if (cancelled) return;
        setItemImages((prev) => {
          let changed = false;
          const next = { ...prev };
          results.forEach((result) => {
            if (result?.product) {
              const thumb = getProductThumbnailUrl(result.product);
              if (thumb && next[result.id] !== thumb) {
                next[result.id] = thumb;
                changed = true;
              }
            }
          });
          return changed ? next : prev;
        });
      } catch {
        // ignore
      }
    };

    fetchImages();
    return () => {
      cancelled = true;
    };
  }, [cart?.items, itemImages]);

  // Fetch inventory for cart items and check for stock issues
  useEffect(() => {
    if (!cart?.items || cart.items.length === 0) {
      setInventoryMap(new Map());
      setStockWarnings(new Map());
      return;
    }

    let cancelled = false;
    const checkInventory = async () => {
      try {
        const productIds = cart.items.map((item) => item.productId);
        const invMap = await fetchBatchInventory(productIds);
        if (cancelled) return;
        setInventoryMap(invMap);

        // Check for stock issues
        const warnings = new Map<string, string>();
        cart.items.forEach((item) => {
          const inventory = invMap.get(item.productId);
          const itemKey = getItemKey(item);
          if (inventory) {
            if (inventory.availableQuantity <= 0) {
              warnings.set(itemKey, 'Out of stock');
            } else if (inventory.availableQuantity < item.quantity) {
              warnings.set(itemKey, `Only ${inventory.availableQuantity} available`);
            } else if (inventory.availableQuantity <= 5) {
              warnings.set(itemKey, `Low stock: ${inventory.availableQuantity} left`);
            }
          }
        });
        setStockWarnings(warnings);
      } catch {
        // ignore inventory fetch errors
      }
    };

    checkInventory();
    return () => {
      cancelled = true;
    };
  }, [cart?.items]);

  const handleUpdateQuantity = async (productId: string, quantity: number, itemKey?: string, selectedOptions?: Record<string, string>) => {
    const key = itemKey || productId;
    setUpdatingItems((prev) => new Set(prev).add(key));
    try {
      await updateQuantity(productId, quantity, itemKey, selectedOptions);
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const handleRemove = async (productId: string, itemKey?: string) => {
    const key = itemKey || productId;
    setUpdatingItems((prev) => new Set(prev).add(key));
    try {
      await removeItem(productId, itemKey);
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container-wide py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container-wide py-12">
        <EmptyCart />
      </div>
    );
  }

  const hasOutOfStockItems = Array.from(stockWarnings.values()).some((w) => w === 'Out of stock');

  return (
    <div className="container-wide py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      {/* Cart Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 flex-1">{error}</p>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700 text-sm font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stock Warning Banner */}
      {hasOutOfStockItems && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" />
          <p className="text-orange-700">
            Some items in your cart are out of stock. Please remove them to proceed to checkout.
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => {
            const itemKey = getItemKey(item);
            const warning = stockWarnings.get(itemKey);
            const isOutOfStock = warning === 'Out of stock';
            const inventory = inventoryMap.get(item.productId);
            const maxQty = inventory?.availableQuantity ?? 999;
            return (
              <div
                key={itemKey}
                className={`flex gap-4 p-4 bg-white rounded-lg border ${
                  isOutOfStock ? 'border-red-300 bg-red-50' : warning ? 'border-orange-200' : 'border-gray-200'
                }`}
              >
                {/* Image */}
                <div className="relative w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center text-gray-400 text-xs">
                  {itemImages[item.productId] ? (
                    <Image
                      src={itemImages[item.productId]}
                      alt={item.productName}
                      fill
                      sizes="96px"
                      className={`object-cover ${isOutOfStock ? 'opacity-50' : ''}`}
                    />
                  ) : (
                    'No Image'
                  )}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xs font-medium">Unavailable</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium line-clamp-2 ${isOutOfStock ? 'text-gray-500' : 'text-gray-900'}`}>
                    {item.productName}
                  </p>
                  <p className={`font-semibold mt-1 ${isOutOfStock ? 'text-gray-400' : 'text-primary'}`}>
                    {formatCurrency(item.priceAtAdd)}
                  </p>
                  {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                    <div className="mt-2 text-xs text-gray-500 space-y-1">
                      {Object.entries(item.selectedOptions).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="uppercase tracking-wider text-gray-400">{key}</span>
                          <span className="font-medium text-gray-600">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Stock Warning */}
                  {warning && (
                    <p className={`text-xs mt-1 font-medium ${isOutOfStock ? 'text-red-600' : 'text-orange-600'}`}>
                      {warning}
                    </p>
                  )}

                  {/* Quantity Selector */}
                  <div className="flex items-center gap-4 mt-3">
                    <div className={`flex items-center border rounded-lg ${isOutOfStock ? 'border-gray-200 opacity-50' : 'border-gray-300'}`}>
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1, item.itemKey, item.selectedOptions)}
                        disabled={item.quantity <= 1 || updatingItems.has(itemKey) || isOutOfStock}
                        className="p-2 text-gray-500 hover:text-primary disabled:opacity-50"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1, item.itemKey, item.selectedOptions)}
                        disabled={updatingItems.has(itemKey) || isOutOfStock || item.quantity >= maxQty}
                        className="p-2 text-gray-500 hover:text-primary disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemove(item.productId, item.itemKey)}
                      disabled={updatingItems.has(itemKey)}
                      className="text-gray-400 hover:text-error disabled:opacity-50"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Subtotal */}
                <div className="text-right">
                  <p className={`font-semibold ${isOutOfStock ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {formatCurrency(item.subtotal)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-lg p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({cart.itemCount} items)</span>
                <span>{formatCurrency(cart.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-sm">Calculated at checkout</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between text-lg font-semibold text-gray-900">
                <span>Total</span>
                <span>{formatCurrency(cart.totalAmount)}</span>
              </div>
            </div>

            {hasOutOfStockItems ? (
              <Button className="w-full" size="lg" disabled>
                Remove Out of Stock Items
              </Button>
            ) : (
              <Link href="/checkout">
                <Button className="w-full" size="lg">
                  Proceed to Checkout
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            )}

            <Link
              href="/products"
              className="block text-center mt-4 text-sm text-gray-600 hover:text-primary"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
