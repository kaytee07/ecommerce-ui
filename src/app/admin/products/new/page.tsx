'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api/client';
import { Category } from '@/types';
import { Button, ImageUpload, Input, Select } from '@/components/ui';
import { ProductAttributeBuilder } from '@/components/admin/ProductAttributeBuilder';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/lib/stores';
import { getPermissions } from '@/lib/auth/permissions';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  price: z.coerce.number().positive('Price must be positive'),
  compareAtPrice: z.coerce.number().positive().optional().or(z.literal('')),
  sku: z.string().min(1, 'SKU is required').max(100),
  categoryId: z.string().min(1, 'Category is required'),
  stockQuantity: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
});

type ProductFormData = z.input<typeof productSchema>;

export default function NewProductPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const permissions = useMemo(
    () => (user ? getPermissions(user.roles) : null),
    [user?.roles?.join('|')]
  );
  const lastFetchKeyRef = useRef<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inventoryWarning, setInventoryWarning] = useState<string | null>(null);
  const [attributes, setAttributes] = useState<Record<string, any>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      active: true,
      featured: false,
      stockQuantity: 0,
    },
  });

  const selectedCategoryId = watch('categoryId');

  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiClient.get<{ status: boolean; data: Category[]; message: string }>(
        '/admin/categories'
      );
      setCategories(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!permissions?.canCreateProducts) {
      router.push('/admin');
      return;
    }
    const key = `${user.id || user.username || 'user'}`;
    if (lastFetchKeyRef.current === key) return;
    lastFetchKeyRef.current = key;
    fetchCategories();
  }, [user, permissions?.canCreateProducts, router, fetchCategories]);

  const onSubmit = async (data: ProductFormData) => {
    setIsLoading(true);
    setError(null);
    setInventoryWarning(null);
    try {
      const payload = {
        name: data.name,
        description: data.description,
        price: data.price,
        compareAtPrice: data.compareAtPrice || undefined,
        sku: data.sku,
        categoryId: data.categoryId,
        attributes: attributes, // Include product specifications
        active: data.active,
        featured: data.featured,
      };
      const response = await apiClient.post<{ status: boolean; data: { product: { id: string } }; message: string }>(
        '/admin/products',
        payload
      );

      const newProductId = response.data.data?.product?.id;
      let imageUploadFailed = false;
      if (newProductId && imageFile) {
        try {
          const formData = new FormData();
          formData.append('file', imageFile);
          await apiClient.post(`/admin/products/${newProductId}/image`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } catch (uploadErr) {
          console.error('Failed to upload image during product creation', uploadErr);
          imageUploadFailed = true;
        }
      }

      if (newProductId) {
        const initialStock = typeof data.stockQuantity === 'number' ? data.stockQuantity : 0;
        try {
          await apiClient.post(`/admin/inventory/${newProductId}?initialStock=${initialStock}`);
        } catch (invErr) {
          console.error('Failed to create initial inventory', invErr);
          setInventoryWarning('Product created, but inventory setup failed. Please update stock from the edit page.');
        }
      }
      if (newProductId) {
        const imageParam = imageUploadFailed ? '&image=failed' : '';
        router.push(`/admin/products/${newProductId}?new=true${imageParam}`);
      } else {
        router.push('/admin/products');
      }
    } catch (err: unknown) {
      console.error('Failed to create product', err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to create product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (user && !permissions?.canCreateProducts) {
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
        <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
      </div>

      {error && (
        <div className="p-4 bg-error-bg text-error rounded-lg">
          {error}
        </div>
      )}
      {inventoryWarning && (
        <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg">
          {inventoryWarning}
        </div>
      )}

      {/* Note about images */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> You can optionally choose an image now. We&apos;ll upload it after the product is
          created and the backend will generate the thumbnail. You&apos;ll still be redirected to the edit page.
        </p>
      </div>

      {/* Optional Product Image */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Product Image (Optional)</h2>
        <p className="text-sm text-gray-500 mb-4">
          Upload a main product image. The backend will create a thumbnail for small screens.
        </p>
        <ImageUpload
          currentImage={null}
          onUpload={async (file) => {
            setImageFile(file);
          }}
          onRemove={() => setImageFile(null)}
          disabled={isLoading}
        />
      </div>

      {/* Basic Product Information Form */}
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

          <Input
            label="Stock Quantity"
            type="number"
            placeholder="0"
            error={errors.stockQuantity?.message}
            {...register('stockQuantity')}
          />

          <div className="flex items-center gap-6">
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
            Create Product
          </Button>
        </div>
      </form>

      {/* Product Specifications Section - Optional, Independent */}
      <div className="bg-white rounded-lg shadow-sm">
        <ProductAttributeBuilder
          attributes={attributes}
          onChange={setAttributes}
          categoryId={selectedCategoryId}
        />
      </div>
    </div>
  );
}
