'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Skeleton } from '@/components/ui';
import { apiClient } from '@/lib/api/client';
import { Product, Page, Category } from '@/types';
import { dummyProducts, dummyCategories } from '@/lib/data/dummy';
import { formatCurrency } from '@/lib/utils';
import { ChevronRight, ChevronDown } from 'lucide-react';

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    fetchData();
  }, [slug, sortBy, sortDirection]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // First try to fetch category from API
      const categoryRes = await apiClient.get<{ status: boolean; data: Category; message: string }>(
        `/store/categories/slug/${slug}`
      );
      console.log(categoryRes.data.data.id)

      if (categoryRes.data.data) {
        setCategory(categoryRes.data.data);

        // Then fetch products
        const productsRes = await apiClient.get<{ status: boolean; data: Page<Product>; message: string }>(
          `/store/categories/${categoryRes.data.data.id}/products?size=20&sortBy=${sortBy}&sortDirection=${sortDirection}`
        );
        // IMPORTANT: Always use optional chaining + fallback to prevent undefined errors
        console.log(productsRes.data.data)
        setProducts(productsRes.data.data.content ?? []);
        setTotalElements(productsRes.data.data?.totalElements || 0);
      } else {
        throw new Error('Category not found');
      }
    } catch (err) {
      console.error('Failed to fetch from API, using dummy data', err);
      // Use dummy data as fallback
      const dummyCategory = dummyCategories.find(c => c.slug === slug);
      if (dummyCategory) {
        setCategory(dummyCategory);
        const categoryProducts = dummyProducts.filter(p => p.category?.slug === slug || p.categoryId === dummyCategory.id);
        setProducts(categoryProducts);
        setTotalElements(categoryProducts.length);
      } else {
        // Category not found - show empty state
        setCategory(null);
        setProducts([]);
        setTotalElements(0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sortOptions = [
    { value: 'createdAt:desc', label: 'Newest' },
    { value: 'createdAt:asc', label: 'Oldest' },
    { value: 'price:asc', label: 'Price: Low to High' },
    { value: 'price:desc', label: 'Price: High to Low' },
    { value: 'name:asc', label: 'Name: A-Z' },
  ];

  // Category not found state
  if (!isLoading && !category) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="container-full py-20">
          <div className="text-center">
            <h1 className="font-heading text-4xl font-medium mb-4">Category Not Found</h1>
            <p className="text-gray-500 mb-8">The category you&apos;re looking for doesn&apos;t exist.</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 text-sm tracking-wider uppercase hover:bg-black transition-colors"
            >
              Browse All Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            <span className="text-primary">{category?.name || 'Loading...'}</span>
          </nav>
        </div>
      </div>

      {/* Category Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-full py-12">
          <h1 className="font-heading text-4xl md:text-5xl font-medium tracking-tight text-center">
            {category?.name}
          </h1>
          {category?.description && (
            <p className="text-center text-gray-500 mt-3 max-w-xl mx-auto">
              {category.description}
            </p>
          )}
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
            <p className="text-gray-500 mb-4">No products in this category yet</p>
            <Link
              href="/products"
              className="text-sm text-primary underline"
            >
              Browse all products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group"
              >
                <div className="relative aspect-[3/4] overflow-hidden img-zoom mb-4 bg-white">
                  <Image
                    src={product.images?.[0]?.url || product.imageUrl || '/placeholder.jpg'}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                  {product.compareAtPrice && (
                    <span className="absolute top-4 left-4 bg-primary text-white text-xs px-3 py-1 tracking-wider uppercase">
                      Sale
                    </span>
                  )}
                  {product.tags?.includes('new') && (
                    <span className="absolute top-4 left-4 bg-primary text-white text-xs px-3 py-1 tracking-wider uppercase">
                      New
                    </span>
                  )}
                  {product.stockQuantity <= 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-sm tracking-wider uppercase">Out of Stock</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 tracking-wider uppercase">
                    {product.category?.name || category?.name}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
