'use client';

import { useEffect, useState, Suspense, useMemo, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { Inventory, Product } from '@/types';
import { Button, Skeleton, Modal, Input } from '@/components/ui';
import { Search, AlertTriangle, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores';
import { getPermissions } from '@/lib/auth/permissions';

function InventoryContent() {
  const searchParams = useSearchParams();
  const lowStockFilter = searchParams.get('lowStock') === 'true';
  const router = useRouter();
  const { user } = useAuthStore();
  const permissions = useMemo(
    () => (user ? getPermissions(user.roles) : null),
    [user?.roles?.join('|')]
  );
  const lastFetchKeyRef = useRef<string | null>(null);

  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [productInfoById, setProductInfoById] = useState<Record<string, { name?: string; sku?: string }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStock, setShowLowStock] = useState(lowStockFilter);
  const [adjustModal, setAdjustModal] = useState<{ open: boolean; item: Inventory | null }>({
    open: false,
    item: null,
  });
  const [adjustment, setAdjustment] = useState({ amount: 0, reason: '', adjustmentType: 'ADJUSTMENT' });
  const [isAdjusting, setIsAdjusting] = useState(false);
  const productsFetchedRef = useRef(false);

  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const endpoint = showLowStock ? '/admin/inventory/low-stock' : '/admin/inventory';
      const response = await apiClient.get<{ status: boolean; data: Inventory[]; message: string }>(endpoint);
      setInventory(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch inventory', err);
      setInventory([]);
    } finally {
      setIsLoading(false);
    }
  }, [showLowStock]);

  const fetchProductInfo = useCallback(async () => {
    if (productsFetchedRef.current) return;
    try {
      const params = new URLSearchParams();
      params.set('size', '1000');
      const response = await apiClient.get<{ status: boolean; data: { content?: Product[] } | Product[] }>(
        `/admin/products?${params.toString()}`
      );
      const products = (response.data.data as { content?: Product[] })?.content || response.data.data || [];
      const map: Record<string, { name?: string; sku?: string }> = {};
      (products as Product[]).forEach((product) => {
        if (product?.id) {
          map[product.id] = { name: product.name, sku: product.sku };
        }
      });
      setProductInfoById(map);
      productsFetchedRef.current = true;
    } catch (err) {
      console.error('Failed to fetch product info for inventory', err);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!permissions?.canViewInventory) {
      router.push('/admin');
      return;
    }
    const key = `${user.id || user.username || 'user'}:${showLowStock ? 'low' : 'all'}`;
    if (lastFetchKeyRef.current === key) return;
    lastFetchKeyRef.current = key;
    fetchInventory();
  }, [showLowStock, user, permissions?.canViewInventory, router, fetchInventory]);

  useEffect(() => {
    if (inventory.length === 0) return;
    const hasMissing = inventory.some((item) => !productInfoById[item.productId]);
    if (hasMissing) {
      fetchProductInfo();
    }
  }, [inventory, productInfoById, fetchProductInfo]);

  const handleAdjust = async () => {
    if (!adjustModal.item || !adjustment.reason) return;
    if (!permissions?.canAdjustInventory) return;
    setIsAdjusting(true);
    try {
      await apiClient.post(`/admin/inventory/${adjustModal.item.productId}/adjust`, {
        quantity: adjustment.amount,
        adjustmentType: adjustment.adjustmentType,
        reason: adjustment.reason,
      });
      await fetchInventory();
      setAdjustModal({ open: false, item: null });
      setAdjustment({ amount: 0, reason: '', adjustmentType: 'ADJUSTMENT' });
    } catch (err) {
      console.error('Failed to adjust inventory', err);
    } finally {
      setIsAdjusting(false);
    }
  };

  const filteredInventory = (inventory || []).filter((item) => {
    const q = searchQuery.toLowerCase();
    const productInfo = productInfoById[item.productId];
    return (
      (item.productId || '').toLowerCase().includes(q) ||
      (item.productName || productInfo?.name || '').toLowerCase().includes(q) ||
      (item.sku || productInfo?.sku || '').toLowerCase().includes(q)
    );
  });

  if (user && !permissions?.canViewInventory) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="search"
            placeholder="Search by product or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
        <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="checkbox"
            checked={showLowStock}
            onChange={(e) => setShowLowStock(e.target.checked)}
            className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <AlertTriangle className="h-4 w-4 text-warning" />
          <span className="text-sm">Low stock only</span>
        </label>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  In Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reserved
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-4">
                      <Skeleton className="h-12 w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {showLowStock
                      ? 'No low stock items found'
                      : 'No inventory records found'}
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const isLow = item.availableQuantity <= 5;
                  const isOut = item.availableQuantity <= 0;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {item.productName || productInfoById[item.productId]?.name || item.productId}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {item.sku || productInfoById[item.productId]?.sku || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {item.stockQuantity}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{item.reservedQuantity}</td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'font-medium',
                            isOut ? 'text-error' : isLow ? 'text-warning' : 'text-gray-900'
                          )}
                        >
                          {item.availableQuantity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isOut ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-bg text-error">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-bg text-warning">
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-bg text-success">
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (!permissions?.canAdjustInventory) return;
                            setAdjustModal({ open: true, item });
                            setAdjustment({ amount: 0, reason: '', adjustmentType: 'ADJUSTMENT' });
                          }}
                          disabled={!permissions?.canAdjustInventory}
                        >
                          Adjust
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Modal */}
      <Modal
        isOpen={adjustModal.open}
        onClose={() => setAdjustModal({ open: false, item: null })}
        title="Adjust Stock"
        size="sm"
      >
        {adjustModal.item && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Product</p>
              <p className="font-medium">
                {adjustModal.item.productName ||
                  productInfoById[adjustModal.item.productId]?.name ||
                  adjustModal.item.productId}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Current Stock</p>
              <p className="font-medium">{adjustModal.item.stockQuantity}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Adjustment
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustment((a) => ({ ...a, amount: a.amount - 1 }))}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  value={adjustment.amount}
                  onChange={(e) => setAdjustment((a) => ({ ...a, amount: parseInt(e.target.value) || 0 }))}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setAdjustment((a) => ({ ...a, amount: a.amount + 1 }))}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                New stock: {adjustModal.item.stockQuantity + adjustment.amount}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Adjustment Type
              </label>
              <select
                value={adjustment.adjustmentType}
                onChange={(e) => setAdjustment((a) => ({ ...a, adjustmentType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="ADJUSTMENT">Adjustment</option>
                <option value="RESTOCK">Restock</option>
                <option value="SALE">Sale</option>
                <option value="RESERVE">Reserve</option>
                <option value="RELEASE">Release</option>
              </select>
            </div>

            <Input
              label="Reason (required)"
              placeholder="e.g., Restock from supplier"
              value={adjustment.reason}
              onChange={(e) => setAdjustment((a) => ({ ...a, reason: e.target.value }))}
            />

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setAdjustModal({ open: false, item: null })}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdjust}
                disabled={adjustment.amount === 0 || !adjustment.reason}
                isLoading={isAdjusting}
              >
                Apply Adjustment
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function AdminInventoryPage() {
  return (
    <Suspense fallback={<div className="space-y-6"><Skeleton className="h-96 w-full" /></div>}>
      <InventoryContent />
    </Suspense>
  );
}
