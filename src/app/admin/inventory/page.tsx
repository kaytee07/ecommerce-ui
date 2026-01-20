'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { Inventory } from '@/types';
import { Button, Skeleton, Modal, Input } from '@/components/ui';
import { Search, AlertTriangle, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

function InventoryContent() {
  const searchParams = useSearchParams();
  const lowStockFilter = searchParams.get('lowStock') === 'true';

  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStock, setShowLowStock] = useState(lowStockFilter);
  const [adjustModal, setAdjustModal] = useState<{ open: boolean; item: Inventory | null }>({
    open: false,
    item: null,
  });
  const [adjustment, setAdjustment] = useState({ amount: 0, reason: '' });
  const [isAdjusting, setIsAdjusting] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, [showLowStock]);

  const fetchInventory = async () => {
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
  };

  const handleAdjust = async () => {
    if (!adjustModal.item || !adjustment.reason) return;
    setIsAdjusting(true);
    try {
      await apiClient.post(`/admin/inventory/${adjustModal.item.productId}/adjust`, {
        adjustment: adjustment.amount,
        reason: adjustment.reason,
      });
      await fetchInventory();
      setAdjustModal({ open: false, item: null });
      setAdjustment({ amount: 0, reason: '' });
    } catch (err) {
      console.error('Failed to adjust inventory', err);
    } finally {
      setIsAdjusting(false);
    }
  };

  const filteredInventory = (inventory || []).filter(
    (item) =>
      (item.productName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sku || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                  SKU
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
                    <td colSpan={7} className="px-6 py-4">
                      <Skeleton className="h-12 w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No inventory items found
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const isLow = item.availableQuantity <= item.lowStockThreshold;
                  const isOut = item.availableQuantity <= 0;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 line-clamp-1">{item.productName}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">{item.sku}</td>
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
                            setAdjustModal({ open: true, item });
                            setAdjustment({ amount: 0, reason: '' });
                          }}
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
              <p className="font-medium">{adjustModal.item.productName}</p>
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
