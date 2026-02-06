'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { Product, Page, Category, Inventory } from '@/types';
import { Button, Badge, Skeleton, ConfirmModal, Select, Input } from '@/components/ui';
import { formatCurrency, getProductThumbnailUrl } from '@/lib/utils';
import { Plus, Pencil, Trash2, Search, Image as ImageIcon } from 'lucide-react';
import { useAuthStore } from '@/lib/stores';
import { getPermissions } from '@/lib/auth/permissions';

export default function AdminProductsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const permissions = useMemo(
    () => (user ? getPermissions(user.roles) : null),
    [user]
  );
  const lastFetchKeyRef = useRef<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [inventoryByProductId, setInventoryByProductId] = useState<Record<string, Inventory | null>>({});
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBulkDiscount, setShowBulkDiscount] = useState(false);
  const [bulkApplyToAll, setBulkApplyToAll] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState('');
  const [bulkDiscountPercentage, setBulkDiscountPercentage] = useState('');
  const [bulkDiscountStart, setBulkDiscountStart] = useState('');
  const [bulkDiscountEnd, setBulkDiscountEnd] = useState('');
  const [bulkDiscountError, setBulkDiscountError] = useState<string | null>(null);
  const [isApplyingBulkDiscount, setIsApplyingBulkDiscount] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('size', '200');

      const [productsRes, categoriesRes] = await Promise.all([
        apiClient.get<{ status: boolean; data: Page<Product>; message: string }>(
          `/admin/products?${params.toString()}`
        ),
        apiClient.get<{ status: boolean; data: Category[]; message: string }>('/admin/categories'),
      ]);

      const allProducts = productsRes.data.data?.content || [];
      const filtered = allProducts.filter((product) => {
        const matchesQuery = searchQuery
          ? product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
          : true;
        const matchesCategory = categoryFilter ? product.categoryId === categoryFilter : true;
        return matchesQuery && matchesCategory;
      });
      setProducts(filtered);
      setCategories(categoriesRes.data.data || []);
      const productIds = filtered.map((product) => product.id);
      if (productIds.length > 0) {
        try {
          const invRes = await apiClient.post<{ status: boolean; data: Inventory[]; message: string }>(
            '/admin/inventory/batch',
            productIds
          );
          const inventoryMap: Record<string, Inventory> = {};
          (invRes.data.data || []).forEach((inv) => {
            inventoryMap[inv.productId] = inv;
          });
          setInventoryByProductId((prev) => ({ ...prev, ...inventoryMap }));
        } catch (invErr) {
          console.error('Failed to fetch inventory batch', invErr);
        }
      }
    } catch (err) {
      console.error('Failed to fetch products', err);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, categoryFilter]);

  useEffect(() => {
    if (!user) return;
    if (!permissions?.canViewAdminProducts) {
      router.push('/admin');
      return;
    }
    const key = `${user.id || user.username || 'user'}:${searchQuery}:${categoryFilter || 'all'}`;
    if (lastFetchKeyRef.current === key) return;
    lastFetchKeyRef.current = key;
    fetchData();
  }, [searchQuery, categoryFilter, user, permissions?.canViewAdminProducts, router, fetchData]);

  const handleDelete = async () => {
    if (!deleteModal.product) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/admin/products/${deleteModal.product.id}`);
      setProducts(products.filter((p) => p.id !== deleteModal.product?.id));
      setDeleteModal({ open: false, product: null });
    } catch (err) {
      console.error('Failed to delete product', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const normalizeDateTimePayload = (value: string) => {
    if (!value) return undefined;
    return value.length === 16 ? `${value}:00` : value;
  };

  const handleApplyBulkDiscount = async () => {
    setBulkDiscountError(null);
    setIsApplyingBulkDiscount(true);
    try {
      const percentage = Number(bulkDiscountPercentage);
      if (Number.isNaN(percentage)) {
        setBulkDiscountError('Discount percentage is required.');
        return;
      }
      if (!bulkApplyToAll && !bulkCategoryId) {
        setBulkDiscountError('Select a category or choose apply to all.');
        return;
      }
      const payload: Record<string, unknown> = {
        discountPercentage: percentage,
        applyToAll: bulkApplyToAll,
      };
      if (!bulkApplyToAll && bulkCategoryId) {
        payload.categoryId = bulkCategoryId;
      }
      const startDate = normalizeDateTimePayload(bulkDiscountStart);
      const endDate = normalizeDateTimePayload(bulkDiscountEnd);
      if (startDate) payload.startDate = startDate;
      if (endDate) payload.endDate = endDate;

      await apiClient.post('/admin/products/bulk-discount', payload);
      setShowBulkDiscount(false);
      setBulkDiscountPercentage('');
      setBulkDiscountStart('');
      setBulkDiscountEnd('');
      await fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setBulkDiscountError(error.response?.data?.message || 'Failed to apply bulk discount.');
    } finally {
      setIsApplyingBulkDiscount(false);
    }
  };

  if (user && !permissions?.canViewAdminProducts) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowBulkDiscount((prev) => !prev)}>
            Bulk Discount
          </Button>
          <Link href="/admin/products/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {showBulkDiscount && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Apply Bulk Discount</h2>
            <Button variant="outline" onClick={() => setShowBulkDiscount(false)}>
              Close
            </Button>
          </div>
          {bulkDiscountError && (
            <div className="mb-4 p-3 bg-error-bg text-error rounded-lg text-sm">
              {bulkDiscountError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <Input
              label="Discount %"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={bulkDiscountPercentage}
              onChange={(e) => setBulkDiscountPercentage(e.target.value)}
            />
            <Select
              label="Category"
              options={[
                { value: '', label: 'Select category' },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
              value={bulkCategoryId}
              onChange={(e) => setBulkCategoryId(e.target.value)}
              disabled={bulkApplyToAll}
            />
            <Input
              label="Start Date (Optional)"
              type="datetime-local"
              value={bulkDiscountStart}
              onChange={(e) => setBulkDiscountStart(e.target.value)}
            />
            <Input
              label="End Date (Optional)"
              type="datetime-local"
              value={bulkDiscountEnd}
              onChange={(e) => setBulkDiscountEnd(e.target.value)}
            />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={bulkApplyToAll}
                onChange={(e) => setBulkApplyToAll(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              Apply to all products
            </label>
            <Button
              onClick={handleApplyBulkDiscount}
              isLoading={isApplyingBulkDiscount}
              disabled={bulkDiscountPercentage.trim() === ''}
            >
              Apply Discount
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="search"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
        <Select
          options={[
            { value: '', label: 'All Categories' },
            ...categories.map((c) => ({ value: c.id, label: c.name })),
          ]}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-48"
        />
      </div>

      {/* Products Table */}
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
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
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
              ) : !products || products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {getProductThumbnailUrl(product) ? (
                            <Image
                              src={getProductThumbnailUrl(product) as string}
                              alt={product.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">{product.name}</p>
                          {product.featured && (
                            <Badge variant="warning" className="mt-1">Featured</Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{product.sku}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{product.categoryName}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{formatCurrency(product.price)}</p>
                      {product.discountPercentage && (
                        <p className="text-xs text-error">-{product.discountPercentage}%</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {inventoryByProductId[product.id]?.availableQuantity ?? '—'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={product.active ? 'success' : 'default'}>
                        {product.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="p-2 text-gray-400 hover:text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteModal({ open: true, product })}
                          className="p-2 text-gray-400 hover:text-error"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, product: null })}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteModal.product?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
