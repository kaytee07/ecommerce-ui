'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SafeImage } from '@/components/ui';
import { Skeleton } from '@/components/ui';
import { apiClient } from '@/lib/api/client';
import { Product, Category, Inventory } from '@/types';
import { formatCurrency, cn, getProductThumbnailUrl, fetchBatchInventory } from '@/lib/utils';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { enablePlaceholders } from '@/lib/config';

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [inventoryMap, setInventoryMap] = useState<Map<string, Inventory>>(new Map());
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const categoryId = searchParams.get('categoryId') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortDirection = searchParams.get('sortDirection') || 'desc';

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryId) params.set('categoryId', categoryId);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      params.set('sortBy', sortBy);
      params.set('sortDirection', sortDirection);
      params.set('size', '20');

      const response = await apiClient.get<{ status: boolean; data: Product[]; message: string }>(
        `/store/products/search?${params.toString()}`
      );
      const content = response.data.data || [];
      setProducts(content);
      setTotalElements(content.length);

      // Fetch inventory for products to show stock status
      if (content.length > 0) {
        const productIds = content.map((p) => p.id);
        const invMap = await fetchBatchInventory(productIds);
        setInventoryMap(invMap);
      } else {
        setInventoryMap(new Map());
      }
    } catch (err) {
      console.error('Failed to fetch products', err);
      setProducts([]);
      setTotalElements(0);
      setInventoryMap(new Map());
    } finally {
      setIsLoading(false);
    }
  }, [categoryId, minPrice, maxPrice, sortBy, sortDirection]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiClient.get<{ status: boolean; data: Category[]; message: string }>(
        '/store/categories'
      );
      setCategories(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch categories', err);
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/products?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/products');
  };

  const hasActiveFilters = categoryId || minPrice || maxPrice;

  const sortOptions = [
    { value: 'createdAt:desc', label: 'Newest' },
    { value: 'price:asc', label: 'Price: Low to High' },
    { value: 'price:desc', label: 'Price: High to Low' },
    { value: 'name:asc', label: 'Name: A-Z' },
  ];

  return (
    <div className="min-h-screen bg-cream">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-full py-12">
          <h1 className="font-heading text-4xl md:text-5xl font-medium tracking-tight text-center">
            All Products
          </h1>
          <p className="text-center text-gray-500 mt-2">
            {totalElements} pieces
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-[88px] z-30">
        <div className="container-full py-4">
          <div className="flex items-center justify-between">
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm tracking-wider uppercase hover:opacity-70"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filter
              {hasActiveFilters && (
                <span className="h-2 w-2 bg-primary rounded-full" />
              )}
            </button>

            {/* Sort */}
            <div className="relative">
              <select
                value={`${sortBy}:${sortDirection}`}
                onChange={(e) => {
                  const [sort, dir] = e.target.value.split(':');
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('sortBy', sort);
                  params.set('sortDirection', dir);
                  router.push(`/products?${params.toString()}`);
                }}
                className="appearance-none bg-transparent text-sm tracking-wider uppercase pr-6 cursor-pointer focus:outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="container-full py-8">
        <div className="flex gap-12">
          {/* Filters Sidebar */}
          <aside
            className={cn(
              'w-full lg:w-64 flex-shrink-0',
              'lg:block',
              showFilters ? 'fixed inset-0 z-50 bg-cream p-6 overflow-y-auto lg:relative lg:p-0' : 'hidden'
            )}
          >
            <div className="flex items-center justify-between mb-8 lg:hidden">
              <h2 className="font-heading text-2xl">Filters</h2>
              <button onClick={() => setShowFilters(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Category Filter */}
            <div className="mb-8">
              <h3 className="text-xs tracking-[0.2em] uppercase text-gray-500 mb-4">Category</h3>
              <div className="space-y-3">
                <button
                  onClick={() => updateFilters('categoryId', '')}
                  className={cn(
                    'block text-sm transition-opacity',
                    !categoryId ? 'font-medium' : 'text-gray-600 hover:text-primary'
                  )}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => updateFilters('categoryId', cat.id)}
                    className={cn(
                      'block text-sm transition-opacity',
                      categoryId === cat.id ? 'font-medium' : 'text-gray-600 hover:text-primary'
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="mb-8">
              <h3 className="text-xs tracking-[0.2em] uppercase text-gray-500 mb-4">Price Range</h3>
              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => updateFilters('minPrice', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 text-sm focus:outline-none focus:border-primary"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => updateFilters('maxPrice', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-primary underline"
              >
                Clear all filters
              </button>
            )}

            {/* Mobile Apply Button */}
            <div className="lg:hidden mt-8 pt-8 border-t border-gray-200">
              <button
                onClick={() => setShowFilters(false)}
                className="w-full bg-primary text-white py-4 text-sm tracking-wider uppercase"
              >
                View Results ({totalElements})
              </button>
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="aspect-[3/4] w-full mb-4" />
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-5 w-full mb-2" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : !products || products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 mb-4">No products found</p>
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {products.map((product) => {
                  const showNew = product.tags?.includes('new');
                  const showSale = Boolean(product.compareAtPrice);
                  const inventory = inventoryMap.get(product.id);
                  const availableQty = inventory?.availableQuantity ?? null;
                  const isOutOfStock = availableQty !== null && availableQty <= 0;
                  const isLowStock = availableQty !== null && availableQty > 0 && availableQty <= 5;
                  const mainImage = getProductThumbnailUrl(product);
                  const imageSrc = mainImage || (enablePlaceholders ? '/placeholder.svg' : '');
                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      className="group"
                    >
                    <div className="relative aspect-[3/4] overflow-hidden img-zoom mb-4">
                        {imageSrc ? (
                          <SafeImage
                            src={imageSrc}
                            alt={product.name}
                            fill
                            className="object-cover"
                            fallbackSrc={enablePlaceholders ? '/placeholder.svg' : undefined}
                          />
                        ) : null}
                      {showNew && !isOutOfStock && (
                        <span className="absolute top-4 left-4 bg-primary text-white text-xs px-3 py-1 tracking-wider uppercase">
                          New
                        </span>
                      )}
                      {showSale && !isOutOfStock && (
                        <span className={`absolute top-4 ${showNew ? 'right-4' : 'left-4'} bg-primary text-white text-xs px-3 py-1 tracking-wider uppercase`}>
                          Sale
                        </span>
                      )}
                      {/* Out of Stock Overlay */}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="px-4 py-2 bg-white text-gray-900 font-medium rounded text-sm">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 tracking-wider uppercase">
                        {product.category?.name || product.categoryName}
                      </p>
                      <h3 className="font-heading text-lg group-hover:opacity-70 transition-opacity">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {formatCurrency(product.price)}
                        </span>
                        {product.compareAtPrice && (
                          <span className="text-gray-400 line-through text-sm">
                            {formatCurrency(product.compareAtPrice)}
                          </span>
                        )}
                      </div>
                      {/* Low Stock Warning */}
                      {isLowStock && !isOutOfStock && (
                        <p className="text-xs text-orange-600 font-medium">
                          Only {availableQty} left
                        </p>
                      )}
                    </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cream">
          <div className="bg-white border-b border-gray-200">
            <div className="container-full py-12">
              <Skeleton className="h-12 w-64 mx-auto" />
            </div>
          </div>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
