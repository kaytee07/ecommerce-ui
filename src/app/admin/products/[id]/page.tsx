'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api/client';
import { Category, Inventory, Product } from '@/types';
import { Button, Input, Select, Skeleton, MultiImageUpload } from '@/components/ui';
import { ProductAttributeBuilder } from '@/components/admin/ProductAttributeBuilder';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/lib/stores';
import { getPermissions } from '@/lib/auth/permissions';
import { getProductThumbnailUrl } from '@/lib/utils';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  price: z.coerce.number().positive('Price must be positive'),
  compareAtPrice: z.coerce.number().positive().optional().or(z.literal('')).or(z.literal(0)),
  sku: z.string().min(1, 'SKU is required').max(100),
  categoryId: z.string().min(1, 'Category is required'),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
});

type ProductFormData = z.input<typeof productSchema>;

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const productId = params.id as string;
  const { user } = useAuthStore();
  const rolesKey = user?.roles?.join('|') ?? '';
  const permissions = useMemo(
    () => (user ? getPermissions(user.roles) : null),
    [user, rolesKey]
  );
  const lastFetchKeyRef = useRef<string | null>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [imageAttributes, setImageAttributes] = useState<Record<string, string> | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [inventoryAdjustQuantity, setInventoryAdjustQuantity] = useState(0);
  const [inventoryAdjustType, setInventoryAdjustType] = useState('RESTOCK');
  const [inventoryReason, setInventoryReason] = useState('');
  const [isAdjustingInventory, setIsAdjustingInventory] = useState(false);
  const [isCreatingInventory, setIsCreatingInventory] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [discountStart, setDiscountStart] = useState('');
  const [discountEnd, setDiscountEnd] = useState('');
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [isUpdatingDiscount, setIsUpdatingDiscount] = useState(false);
  const [attributes, setAttributes] = useState<Record<string, any>>({});

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  const selectedCategoryId = watch('categoryId');

  const fetchData = useCallback(async () => {
    setIsLoadingProduct(true);
    try {
      const [productRes, categoriesRes] = await Promise.all([
        apiClient.get<{ status: boolean; data: Product; message: string }>(
          `/admin/products/${productId}`
        ),
        apiClient.get<{ status: boolean; data: Category[]; message: string }>(
          '/admin/categories'
        ),
      ]);

      const productData = productRes.data.data;
      setProduct(productData);
      setCategories(categoriesRes.data.data || []);

      const thumb = getProductThumbnailUrl(productData);
      setProductImages(thumb ? [thumb] : []);

      // Reset form with product data
      reset({
        name: productData.name,
        description: productData.description || '',
        price: productData.price,
        compareAtPrice: productData.compareAtPrice || '',
        sku: productData.sku,
        categoryId: productData.categoryId,
        active: productData.active ?? true,
        featured: productData.featured ?? false,
      });

      // Initialize attributes, filtering out image-related data
      if (productData.attributes && typeof productData.attributes === 'object') {
        const attrs = { ...productData.attributes as Record<string, any> };
        const images = attrs.images;
        if (images && typeof images === 'object') {
          const normalized: Record<string, string> = {};
          for (const [key, value] of Object.entries(images as Record<string, unknown>)) {
            if (typeof value === 'string') {
              normalized[key] = value;
            }
          }
          setImageAttributes(Object.keys(normalized).length ? normalized : null);
        } else {
          setImageAttributes(null);
        }
        delete attrs.images; // Remove images from attributes
        setAttributes(attrs);
      }

      const normalizeDateTimeInput = (value?: string | null) => {
        if (!value) return '';
        if (value.length >= 16) return value.slice(0, 16);
        return value;
      };
      setDiscountPercentage(
        typeof productData.discountPercentage === 'number'
          ? String(productData.discountPercentage)
          : ''
      );
      setDiscountStart(normalizeDateTimeInput(productData.discountStart || undefined));
      setDiscountEnd(normalizeDateTimeInput(productData.discountEnd || undefined));

      try {
        const inventoryRes = await apiClient.get<{ status: boolean; data: Inventory; message: string }>(
          `/admin/inventory/${productId}`
        );
        setInventory(inventoryRes.data.data);
      } catch (invErr: unknown) {
        const err = invErr as { response?: { status?: number } };
        if (err.response?.status === 404) {
          setInventory(null);
          setInventoryError('No inventory record found. Create one to track stock.');
        } else {
          setInventoryError('Failed to load inventory.');
        }
      }
    } catch (err) {
      console.error('Failed to fetch product', err);
      setError('Failed to load product. It may not exist.');
    } finally {
      setIsLoadingProduct(false);
    }
  }, [productId, reset]);

  useEffect(() => {
    if (!user) return;
    if (!permissions?.canEditProducts) {
      router.push('/admin');
      return;
    }
    const key = `${user.id || user.username || 'user'}:${productId}`;
    if (lastFetchKeyRef.current === key) return;
    lastFetchKeyRef.current = key;
    fetchData();
  }, [productId, user, permissions?.canEditProducts, router, fetchData]);

  useEffect(() => {
    if (searchParams.get('image') === 'failed') {
      setImageError('Image upload failed during product creation. Please upload again.');
    }
  }, [searchParams]);

  const onSubmit = async (data: ProductFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const mergedAttributes = {
        ...attributes,
        ...(imageAttributes ? { images: imageAttributes } : {}),
      };
      const payload = {
        ...data,
        compareAtPrice: data.compareAtPrice || undefined,
        attributes: mergedAttributes, // Include product specifications + images
      };
      await apiClient.put(`/admin/products/${productId}`, payload);
      router.push('/admin/products');
    } catch (err: unknown) {
      console.error('Failed to update product', err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to update product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (file: File): Promise<void> => {
    setImageError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post<{ status: boolean; data: Record<string, unknown>; message: string }>(
        `/admin/products/${productId}/image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Add uploaded image URLs to the list
      const payload = response.data.data || {};
      const images = (payload as { images?: Record<string, unknown> }).images;
      const imageMap = images && typeof images === 'object' ? images : payload;
      const normalized: Record<string, string> = {};
      Object.entries(imageMap as Record<string, unknown>).forEach(([key, value]) => {
        if (typeof value === 'string') {
          normalized[key] = value;
        }
      });
      setImageAttributes(Object.keys(normalized).length ? normalized : null);
      const thumb = (imageMap as Record<string, unknown>).thumbnail
        || (imageMap as Record<string, unknown>).medium
        || (imageMap as Record<string, unknown>).large
        || (imageMap as Record<string, unknown>).original;
      if (typeof thumb === 'string') {
        setProductImages([thumb]);
      }
    } catch (err: unknown) {
      console.error('Failed to upload image', err);
      const error = err as { response?: { data?: { message?: string } } };
      setImageError(error.response?.data?.message || 'Failed to upload image. Please try again.');
      throw err;
    }
  };

  // Handle image removal
  const handleImageRemove = async (index: number) => {
    // For now, just remove from local state
    // TODO: Call DELETE endpoint if available
    setProductImages((prev) => prev.filter((_, i) => i !== index));
    setImageAttributes(null);
  };

  const handleAdjustInventory = async () => {
    setInventoryError(null);
    setIsAdjustingInventory(true);
    try {
      const payload = {
        quantity: inventoryAdjustQuantity,
        adjustmentType: inventoryAdjustType,
        reason: inventoryReason || undefined,
      };
      const response = await apiClient.post<{ status: boolean; data: Inventory; message: string }>(
        `/admin/inventory/${productId}/adjust`,
        payload
      );
      setInventory(response.data.data);
      setInventoryAdjustQuantity(0);
      setInventoryReason('');
    } catch (invErr: unknown) {
      const err = invErr as { response?: { data?: { message?: string } } };
      setInventoryError(err.response?.data?.message || 'Failed to adjust inventory.');
    } finally {
      setIsAdjustingInventory(false);
    }
  };

  const handleCreateInventory = async (initialStock: number) => {
    setInventoryError(null);
    setIsCreatingInventory(true);
    try {
      const response = await apiClient.post<{ status: boolean; data: Inventory; message: string }>(
        `/admin/inventory/${productId}?initialStock=${initialStock}`
      );
      setInventory(response.data.data);
      setInventoryError(null);
    } catch (invErr: unknown) {
      const err = invErr as { response?: { data?: { message?: string } } };
      setInventoryError(err.response?.data?.message || 'Failed to create inventory.');
    } finally {
      setIsCreatingInventory(false);
    }
  };

  const normalizeDateTimePayload = (value: string) => {
    if (!value) return undefined;
    return value.length === 16 ? `${value}:00` : value;
  };

  const handleApplyDiscount = async () => {
    setDiscountError(null);
    setIsUpdatingDiscount(true);
    try {
      const percentage = Number(discountPercentage);
      if (Number.isNaN(percentage)) {
        setDiscountError('Discount percentage is required.');
        return;
      }
      const payload: Record<string, unknown> = {
        discountPercentage: percentage,
      };
      const startDate = normalizeDateTimePayload(discountStart);
      const endDate = normalizeDateTimePayload(discountEnd);
      if (startDate) payload.startDate = startDate;
      if (endDate) payload.endDate = endDate;

      const response = await apiClient.post<{ status: boolean; data: Product; message: string }>(
        `/admin/products/${productId}/discount`,
        payload
      );
      setProduct(response.data.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setDiscountError(error.response?.data?.message || 'Failed to apply discount.');
    } finally {
      setIsUpdatingDiscount(false);
    }
  };

  const handleRemoveDiscount = async () => {
    setDiscountError(null);
    setIsUpdatingDiscount(true);
    try {
      const response = await apiClient.delete<{ status: boolean; data: Product; message: string }>(
        `/admin/products/${productId}/discount`
      );
      setProduct(response.data.data);
      setDiscountPercentage('');
      setDiscountStart('');
      setDiscountEnd('');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setDiscountError(error.response?.data?.message || 'Failed to remove discount.');
    } finally {
      setIsUpdatingDiscount(false);
    }
  };

  if (isLoadingProduct) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!product && !isLoadingProduct) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/products"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Product Not Found</h1>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">The product you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/admin/products">
            <Button>Back to Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (user && !permissions?.canEditProducts) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
      </div>

      {error && (
        <div className="p-4 bg-error-bg text-error rounded-lg">
          {error}
        </div>
      )}

      {/* Product Images Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Images</h2>
        <p className="text-sm text-gray-500 mb-4">
          Upload images for your product. The first image will be the main product image.
        </p>

        {imageError && (
          <div className="mb-4 p-3 bg-error-bg text-error rounded-lg text-sm">
            {imageError}
          </div>
        )}

        <MultiImageUpload
          images={productImages}
          onUpload={handleImageUpload}
          onRemove={handleImageRemove}
          maxImages={5}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Input
              label="Product Name"
              placeholder="Enter product name"
              error={errors.name?.message}
              {...register('name')}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              placeholder="Enter product description"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary resize-none"
              {...register('description')}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-error">{errors.description.message}</p>
            )}
          </div>

          <Input
            label="SKU"
            placeholder="e.g., WG-PROD-001"
            error={errors.sku?.message}
            {...register('sku')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
              {...register('categoryId')}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-sm text-error">{errors.categoryId.message}</p>
            )}
          </div>

          <Input
            label="Price (GHS)"
            type="number"
            step="0.01"
            placeholder="0.00"
            error={errors.price?.message}
            {...register('price')}
          />

          <Input
            label="Compare at Price (GHS)"
            type="number"
            step="0.01"
            placeholder="0.00 (optional)"
            error={errors.compareAtPrice?.message}
            {...register('compareAtPrice')}
          />

          <div className="md:col-span-2 flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                {...register('active')}
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                {...register('featured')}
              />
              <span className="text-sm text-gray-700">Featured</span>
            </label>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-4">
          <Link href="/admin/products">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" isLoading={isLoading}>
            Update Product
          </Button>
        </div>
      </form>

      {/* Product Specifications Section - Optional */}
      <div className="bg-white rounded-lg shadow-sm">
        <ProductAttributeBuilder
          attributes={attributes}
          onChange={setAttributes}
          categoryId={selectedCategoryId}
        />
      </div>

      {/* Discount Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Discount</h2>
        {discountError && (
          <div className="mb-4 p-3 bg-error-bg text-error rounded-lg text-sm">
            {discountError}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <Input
            label="Discount %"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={discountPercentage}
            onChange={(e) => setDiscountPercentage(e.target.value)}
          />
          <Input
            label="Start Date (Optional)"
            type="datetime-local"
            value={discountStart}
            onChange={(e) => setDiscountStart(e.target.value)}
          />
          <Input
            label="End Date (Optional)"
            type="datetime-local"
            value={discountEnd}
            onChange={(e) => setDiscountEnd(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              onClick={handleApplyDiscount}
              isLoading={isUpdatingDiscount}
              disabled={discountPercentage.trim() === ''}
            >
              Apply
            </Button>
            <Button
              variant="outline"
              onClick={handleRemoveDiscount}
              isLoading={isUpdatingDiscount}
              disabled={!product?.discountPercentage}
            >
              Remove
            </Button>
          </div>
        </div>
        {product?.discountActive && (
          <p className="mt-3 text-sm text-green-700">
            Discount active: {product.discountPercentage}% off
          </p>
        )}
      </div>

      {/* Inventory Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h2>
        {inventoryError && (
          <div className="mb-4 p-3 bg-error-bg text-error rounded-lg text-sm">
            {inventoryError}
          </div>
        )}

        {inventory ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Stock</p>
              <p className="text-xl font-semibold text-gray-900">{inventory.stockQuantity}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Reserved</p>
              <p className="text-xl font-semibold text-gray-900">{inventory.reservedQuantity}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Available</p>
              <p className="text-xl font-semibold text-gray-900">{inventory.availableQuantity}</p>
            </div>
          </div>
        ) : (
          <div className="mb-6 text-sm text-gray-600">
            Create an inventory record to track stock levels for this product.
          </div>
        )}

        {!inventory ? (
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <Input
              label="Initial Stock"
              type="number"
              value={inventoryAdjustQuantity}
              onChange={(e) => setInventoryAdjustQuantity(Number(e.target.value))}
            />
            <Button
              onClick={() => handleCreateInventory(inventoryAdjustQuantity)}
              isLoading={isCreatingInventory}
              disabled={inventoryAdjustQuantity < 0}
            >
              Create Inventory
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <Input
              label="Quantity"
              type="number"
              value={inventoryAdjustQuantity}
              onChange={(e) => setInventoryAdjustQuantity(Number(e.target.value))}
            />
            <Select
              label="Adjustment Type"
              options={[
                { value: 'RESTOCK', label: 'Restock' },
                { value: 'ADJUSTMENT', label: 'Adjustment' },
                { value: 'SALE', label: 'Sale' },
                { value: 'RESERVE', label: 'Reserve' },
                { value: 'RELEASE', label: 'Release' },
              ]}
              value={inventoryAdjustType}
              onChange={(e) => setInventoryAdjustType(e.target.value)}
            />
            <Input
              label="Reason (optional)"
              value={inventoryReason}
              onChange={(e) => setInventoryReason(e.target.value)}
            />
            <Button
              onClick={handleAdjustInventory}
              isLoading={isAdjustingInventory}
              disabled={inventoryAdjustQuantity === 0}
            >
              Update Stock
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
