
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components/products';
import { ProductGridSkeleton, EmptySearchResults } from '@/components/ui';
import { apiClient } from '@/lib/api/client';
import { Product, Inventory } from '@/types';
import { Search } from 'lucide-react';
import { fetchBatchInventory } from '@/lib/utils';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryMap, setInventoryMap] = useState<Map<string, Inventory>>(new Map());
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (query) {
      fetchProducts();
    } else {
      setProducts([]);
      setInventoryMap(new Map());
      setIsLoading(false);
    }
  }, [query]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<{ status: boolean; data: Product[]; message: string }>(
        `/store/products/search?q=${encodeURIComponent(query)}&size=24`
      );
      // IMPORTANT: Always use optional chaining + fallback to prevent undefined errors
      const items = response.data.data || [];
      setProducts(items);
      setTotalElements(items.length);

      // Fetch inventory for search results
      if (items.length > 0) {
        const productIds = items.map((p) => p.id);
        const invMap = await fetchBatchInventory(productIds);
        setInventoryMap(invMap);
      } else {
        setInventoryMap(new Map());
      }
    } catch (err) {
      console.error('Failed to search products', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-wide py-8">
      {/* Search Header */}
      <div className="mb-8">
        <form action="/search" className="max-w-xl mb-6">
          <div className="relative">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search products..."
              className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-full focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
          </div>
        </form>

        {query && (
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Results for &ldquo;{query}&rdquo;
            </h1>
            <p className="text-gray-500 mt-1">
              {totalElements} products found
            </p>
          </div>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <ProductGridSkeleton count={8} />
      ) : !query ? (
        <div className="text-center py-12">
          <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Search for products</h2>
          <p className="text-gray-500">Enter a keyword to find what you&apos;re looking for</p>
        </div>
      ) : !products || products.length === 0 ? (
        <EmptySearchResults query={query} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              inventory={inventoryMap.get(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container-wide py-8"><ProductGridSkeleton count={8} /></div>}>
      <SearchContent />
    </Suspense>
  );
}
