'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { SafeImage } from '@/components/ui';
import { Skeleton } from '@/components/ui';
import { apiClient } from '@/lib/api/client';
import { Product, Page, Inventory } from '@/types';
import { formatCurrency, getProductOriginalImageUrl } from '@/lib/utils';
import { ChevronRight, ChevronDown, Sparkles } from 'lucide-react';
import { enablePlaceholders } from '@/lib/config';

export default function NewArrivalsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch newest products (sorted by createdAt desc)
      const response = await apiClient.get<{ status: boolean; data: Page<Product>; message: string }>(
        `/store/products?size=40&sortBy=${sortBy}&sortDirection=${sortDirection}`
      );

      const allProducts = response.data.data?.content || [];

      const isProductActive = (product: Product) => {
        if (product.status && product.status !== 'ACTIVE') return false;
        if (product.active === false) return false;
        if (product.isActive === false) return false;
        return true;
      };

      const visibleProducts = allProducts.filter(isProductActive);

      // Filter to products created within the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const newProducts = visibleProducts.filter(product => {
        const createdAt = new Date(product.createdAt);
        return createdAt >= thirtyDaysAgo;
      });

      const displayProducts = newProducts.length === 0
        ? visibleProducts.slice(0, 20)
        : newProducts;
      const productIds = displayProducts.map((product) => product.id);
      let inventoryMap = new Map<string, Inventory>();

      if (productIds.length > 0) {
        try {
          const inventoryRes = await apiClient.post<{ status: boolean; data: Inventory[]; message: string }>(
            '/store/inventory/batch',
            productIds
          );
          inventoryMap = new Map(
            (inventoryRes.data.data || []).map((item) => [item.productId, item])
          );
        } catch (invErr) {
          console.error('Failed to fetch inventory batch', invErr);
        }
      }

      const enrichedProducts = displayProducts.map((product) => {
        const inventory = inventoryMap.get(product.id);
        if (!inventory) return product;
        return {
          ...product,
          stockQuantity: inventory.availableQuantity,
        };
      });

      // If no products in last 30 days, show the 20 most recent products
      if (newProducts.length === 0) {
        setProducts(enrichedProducts);
        setTotalElements(Math.min(visibleProducts.length, 20));
      } else {
        setProducts(enrichedProducts);
        setTotalElements(newProducts.length);
      }
    } catch (err) {
      console.error('Failed to fetch new arrivals', err);
      setProducts([]);
      setTotalElements(0);
    } finally {
      setIsLoading(false);
    }
  }, [sortBy, sortDirection]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const sortOptions = [
    { value: 'createdAt:desc', label: 'Newest' },
    { value: 'createdAt:asc', label: 'Oldest' },
    { value: 'price:asc', label: 'Price: Low to High' },
    { value: 'price:desc', label: 'Price: High to Low' },
    { value: 'name:asc', label: 'Name: A-Z' },
  ];

  return (
    <div className="min-h-screen bg-cream">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-full py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/products" className="hover:text-primary transition-colors">Shop</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-primary">New Arrivals</span>
          </nav>
        </div>
      </div>

      {/* Collection Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-full py-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="font-heading text-4xl md:text-5xl font-medium tracking-tight text-center">
              New Arrivals
            </h1>
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <p className="text-center text-gray-500 mt-3 max-w-xl mx-auto">
            Discover our latest additions. Fresh styles added regularly to keep your wardrobe updated.
          </p>
          <p className="text-center text-gray-400 text-sm mt-4">
            {totalElements} {totalElements === 1 ? 'product' : 'products'}
          </p>
        </div>
      </div>

      {/* Sort Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-[88px] z-30">
        <div className="container-full py-4">
          <div className="flex items-center justify-end">
            <div className="relative">
              <select
                value={`${sortBy}:${sortDirection}`}
                onChange={(e) => {
                  const [sort, dir] = e.target.value.split(':');
                  setSortBy(sort);
                  setSortDirection(dir);
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

      {/* Products */}
      <div className="container-full py-12">
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
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
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">No new arrivals at the moment</p>
            <Link
              href="/products"
              className="text-sm text-primary underline"
            >
              Browse all products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {products.map((product) => {
              const mainImage = getProductOriginalImageUrl(product);
              const imageSrc = mainImage || (enablePlaceholders ? '/placeholder.svg' : '');
              return (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group"
              >
                <div className="relative aspect-[3/4] overflow-hidden img-zoom mb-4 bg-white">
                    {imageSrc ? (
                      <SafeImage
                        src={imageSrc}
                        alt={product.name}
                        fill
                        className="object-cover"
                        fallbackSrc={enablePlaceholders ? '/placeholder.svg' : undefined}
                      />
                    ) : null}
                  {/* New badge */}
                  <span className="absolute top-4 left-4 bg-primary text-white text-xs px-3 py-1 tracking-wider uppercase">
                    New
                  </span>
                  {product.compareAtPrice && (
                    <span className="absolute top-4 right-4 bg-error text-white text-xs px-3 py-1 tracking-wider uppercase">
                      Sale
                    </span>
                  )}
                  {typeof product.stockQuantity === 'number' && product.stockQuantity <= 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-sm tracking-wider uppercase">Out of Stock</span>
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
                </div>
              </Link>
            );})}
          </div>
        )}
      </div>
    </div>
  );
}
