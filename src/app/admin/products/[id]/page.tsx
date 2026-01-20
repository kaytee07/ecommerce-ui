'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api/client';
import { Category, Product } from '@/types';
import { Button, Input, Skeleton, MultiImageUpload } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';

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

type ProductFormData = z.infer<typeof productSchema>;

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  useEffect(() => {
    fetchData();
  }, [productId]);

  const fetchData = async () => {
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

      // Set product images
      const images = productData.images?.map((img: { url: string }) => img.url) || [];
      if (productData.imageUrl && !images.includes(productData.imageUrl)) {
        images.unshift(productData.imageUrl);
      }
      setProductImages(images);

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
    } catch (err) {
      console.error('Failed to fetch product', err);
      setError('Failed to load product. It may not exist.');
    } finally {
      setIsLoadingProduct(false);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        ...data,
        compareAtPrice: data.compareAtPrice || undefined,
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
      formData.append('image', file);

      const response = await apiClient.post<{ status: boolean; data: { url: string }; message: string }>(
        `/admin/products/${productId}/image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Add the new image URL to the list
      const newImageUrl = response.data.data?.url;
      if (newImageUrl) {
        setProductImages((prev) => [...prev, newImageUrl]);
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
    </div>
  );
}
