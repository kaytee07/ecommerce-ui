'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SafeImage } from '@/components/ui';
import { ArrowRight } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { Product, Category, Page, Inventory, StorefrontBanner } from '@/types';
import { formatCurrency, getProductOriginalImageUrl, fetchBatchInventory } from '@/lib/utils';
import { Skeleton } from '@/components/ui';

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [inventoryMap, setInventoryMap] = useState<Map<string, Inventory>>(new Map());
  const [banners, setBanners] = useState<StorefrontBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHomePageData();
  }, []);

  const fetchHomePageData = async () => {
    setIsLoading(true);
    try {
      const results = await Promise.allSettled([
        apiClient.get<{ status: boolean; data: Category[] }>('/store/categories'),
        apiClient.get<{ status: boolean; data: Product[] }>('/store/products/featured'),
        apiClient.get<{ status: boolean; data: Page<Product> }>('/store/products?size=8&sortBy=createdAt&sortDirection=desc'),
        apiClient.get<{ status: boolean; data: StorefrontBanner[] }>('/storefront/banners'),
      ]);

      const [categoriesRes, featuredRes, newArrivalsRes, bannersRes] = results;

      if (categoriesRes.status === 'fulfilled') {
        setCategories(categoriesRes.value.data.data || []);
      } else {
        console.error('Failed to fetch categories', categoriesRes.reason);
        setCategories([]);
      }

      let featured: Product[] = [];
      if (featuredRes.status === 'fulfilled') {
        featured = featuredRes.value.data.data || [];
        setFeaturedProducts(featured);
      } else {
        console.error('Failed to fetch featured products', featuredRes.reason);
        setFeaturedProducts([]);
      }

      let arrivals: Product[] = [];
      if (newArrivalsRes.status === 'fulfilled') {
        arrivals = newArrivalsRes.value.data.data?.content || [];
        setNewArrivals(arrivals);
      } else {
        console.error('Failed to fetch new arrivals', newArrivalsRes.reason);
        setNewArrivals([]);
      }

      if (bannersRes.status === 'fulfilled') {
        setBanners(bannersRes.value.data.data || []);
      } else {
        console.error('Failed to fetch banners', bannersRes.reason);
        setBanners([]);
      }

      // Fetch inventory for all products to show stock status
      const allProducts = [...featured, ...arrivals];
      if (allProducts.length > 0) {
        const uniqueIds = [...new Set(allProducts.map((p) => p.id))];
        const invMap = await fetchBatchInventory(uniqueIds);
        setInventoryMap(invMap);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Filter out inactive categories and sort by display order
  const activeCategories = categories
    .filter(c => c.active !== false)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const productCountMap = (() => {
    const byId = new Map<string, Category>();
    const childrenByParent = new Map<string, Category[]>();
    categories.forEach((cat) => {
      byId.set(cat.id, cat);
      if (cat.parentId) {
        const children = childrenByParent.get(cat.parentId) || [];
        children.push(cat);
        childrenByParent.set(cat.parentId, children);
      }
    });

    const cache = new Map<string, number>();
    const getCount = (id: string): number => {
      if (cache.has(id)) return cache.get(id) as number;
      const category = byId.get(id);
      let total = category?.productCount || 0;
      const children = childrenByParent.get(id) || [];
      children.forEach((child) => {
        total += getCount(child.id);
      });
      cache.set(id, total);
      return total;
    };

    categories.forEach((cat) => getCount(cat.id));
    return cache;
  })();

  const defaultPrimaryBanner: StorefrontBanner = {
    id: 'default-primary',
    slot: 'PRIMARY',
    eyebrow: 'New Collection',
    headline: 'Define Your Own Rules',
    subheadline: 'Bold streetwear for those who refuse to conform. Made in Ghana, worn worldwide.',
    ctaText: 'Shop Collection',
    ctaLink: '/products',
    imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1920&q=80',
    active: true,
  };

  const activeBanners = banners.filter((banner) => banner.active !== false);
  const primaryBanner = activeBanners.find((banner) => banner.slot === 'PRIMARY') || defaultPrimaryBanner;
  const secondaryBanner = activeBanners.find((banner) => banner.slot === 'SECONDARY');

  const primaryHeadline = primaryBanner.headline || defaultPrimaryBanner.headline || '';
  const headlineWords = primaryHeadline.split(' ').filter(Boolean);
  const headlineSplitIndex = Math.max(1, Math.ceil(headlineWords.length / 2));
  const headlineLineOne = headlineWords.slice(0, headlineSplitIndex).join(' ');
  const headlineLineTwo = headlineWords.slice(headlineSplitIndex).join(' ');

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Section - Vlisco Inspired */}
      <section className="relative h-[90vh] min-h-[600px]">
        <div className="absolute inset-0">
          <SafeImage
            src={primaryBanner.imageUrl || defaultPrimaryBanner.imageUrl || ''}
            alt={primaryBanner.headline || 'World Genius Collection'}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        <div className="relative h-full flex items-end">
          <div className="container-full pb-16 lg:pb-24">
            <div className="max-w-2xl">
              <p className="text-white/80 text-sm tracking-[0.3em] uppercase mb-4">
                {primaryBanner.eyebrow || defaultPrimaryBanner.eyebrow}
              </p>
              <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl text-white font-medium tracking-tight leading-none mb-6">
                {headlineLineOne}
                {headlineLineTwo ? (
                  <>
                    <br />
                    {headlineLineTwo}
                  </>
                ) : null}
              </h1>
              <p className="text-white/80 text-lg mb-8 max-w-md">
                {primaryBanner.subheadline || defaultPrimaryBanner.subheadline}
              </p>
              <Link
                href={primaryBanner.ctaLink || defaultPrimaryBanner.ctaLink || '/products'}
                className="inline-flex items-center gap-3 bg-white text-primary px-8 py-4 text-sm font-medium tracking-wider uppercase hover:bg-white/90 transition-colors"
              >
                {primaryBanner.ctaText || defaultPrimaryBanner.ctaText || 'Shop Collection'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid - Dynamic from API */}
      <section className="container-full py-20 lg:py-32">
        <div className="text-center mb-16">
          <h2 className="font-heading text-4xl md:text-5xl font-medium tracking-tight">
            Shop by Category
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="aspect-[3/4] w-full" />
            ))}
          </div>
        ) : !activeCategories || activeCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No categories available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeCategories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group relative aspect-[3/4] overflow-hidden img-zoom"
              >
                <SafeImage
                  src={category.imageUrl || '/placeholder-category.svg'}
                  alt={category.name}
                  fill
                  className="object-cover"
                  fallbackSrc="/placeholder-category.svg"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <h3 className="font-heading text-2xl text-white mb-1">{category.name}</h3>
                  <p className="text-white/80 text-sm tracking-wide">
                    {(productCountMap.get(category.id) ?? category.productCount ?? 0)} Products
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured Products - Admin controlled via 'featured' flag */}
      <section className="bg-white py-20 lg:py-32">
        <div className="container-full">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-gray-500 mb-3">Curated</p>
              <h2 className="font-heading text-4xl md:text-5xl font-medium tracking-tight">
                Featured Pieces
              </h2>
            </div>
            <Link
              href="/products"
              className="hidden md:flex items-center gap-2 text-sm tracking-wider uppercase hover:opacity-70 transition-opacity"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i}>
                  <Skeleton className="aspect-[3/4] w-full mb-4" />
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-5 w-full mb-2" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : !featuredProducts || featuredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-2">No featured products yet</p>
              <p className="text-sm text-gray-400">
                Admins can mark products as featured in the admin panel
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {featuredProducts.slice(0, 8).map((product) => {
                const inventory = inventoryMap.get(product.id);
                const availableQty = inventory?.availableQuantity ?? null;
                const isOutOfStock = availableQty !== null && availableQty <= 0;
                const isLowStock = availableQty !== null && availableQty > 0 && availableQty <= 5;
                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="group"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden img-zoom mb-4">
                      <SafeImage
                        src={getProductOriginalImageUrl(product) || '/placeholder.svg'}
                        alt={product.name}
                        fill
                        className="object-cover"
                        fallbackSrc="/placeholder.svg"
                      />
                      {product.compareAtPrice && !isOutOfStock && (
                        <span className="absolute top-4 left-4 bg-primary text-white text-xs px-3 py-1 tracking-wider uppercase">
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

          <div className="mt-12 text-center md:hidden">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm tracking-wider uppercase"
            >
              View All Products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Editorial Banner */}
      <section className="relative h-[70vh] min-h-[500px]">
        <div className="absolute inset-0">
          <Image
            src={secondaryBanner?.imageUrl || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1920&q=80'}
            alt="World Genius Lookbook"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="relative h-full flex items-center justify-center text-center">
          <div className="max-w-2xl px-6">
            <p className="text-white/80 text-sm tracking-[0.3em] uppercase mb-4">
              The Lookbook
            </p>
            <h2 className="font-heading text-4xl md:text-6xl text-white font-medium tracking-tight mb-6">
              Street Style
              <br />
              Elevated
            </h2>
            <Link
              href="/collections/new-arrivals"
              className="inline-flex items-center gap-3 border border-white text-white px-8 py-4 text-sm font-medium tracking-wider uppercase hover:bg-white hover:text-primary transition-all"
            >
              Explore New Arrivals
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* New Arrivals - Recent products from API */}
      <section className="container-full py-20 lg:py-32">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-gray-500 mb-3">Just Dropped</p>
            <h2 className="font-heading text-4xl md:text-5xl font-medium tracking-tight">
              New Arrivals
            </h2>
          </div>
          <Link
            href="/collections/new-arrivals"
            className="hidden md:flex items-center gap-2 text-sm tracking-wider uppercase hover:opacity-70 transition-opacity"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton className="aspect-[3/4] w-full mb-4" />
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : !newArrivals || newArrivals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No new arrivals yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {newArrivals.slice(0, 4).map((product) => {
              const inventory = inventoryMap.get(product.id);
              const availableQty = inventory?.availableQuantity ?? null;
              const isOutOfStock = availableQty !== null && availableQty <= 0;
              const isLowStock = availableQty !== null && availableQty > 0 && availableQty <= 5;
              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group"
                >
                  <div className="relative aspect-[3/4] overflow-hidden img-zoom mb-4">
                    <Image
                      src={getProductOriginalImageUrl(product) || '/placeholder.svg'}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                    {!isOutOfStock && (
                      <span className="absolute top-4 left-4 bg-primary text-white text-xs px-3 py-1 tracking-wider uppercase">
                        New
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
                    <span className="font-medium">
                      {formatCurrency(product.price)}
                    </span>
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

        <div className="mt-12 text-center md:hidden">
          <Link
            href="/collections/new-arrivals"
            className="inline-flex items-center gap-2 text-sm tracking-wider uppercase"
          >
            View All New Arrivals
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Brand Story Banner */}
      <section className="bg-primary text-white">
        <div className="container-full py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-white/60 text-sm tracking-[0.3em] uppercase mb-4">Our Story</p>
              <h2 className="font-heading text-4xl md:text-5xl font-medium tracking-tight mb-6">
                Born in Ghana,
                <br />
                Made for the World
              </h2>
              <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-md">
                World Genius is more than a brand. It&apos;s a movement for those who dare to be different.
                Our pieces are designed for the bold, the creative, the nonconformists.
              </p>
              <Link
                href="/about"
                className="inline-flex items-center gap-3 border border-white text-white px-8 py-4 text-sm font-medium tracking-wider uppercase hover:bg-white hover:text-primary transition-all"
              >
                Learn More
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="relative aspect-square lg:aspect-[4/3]">
              <Image
                src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80"
                alt="World Genius Brand"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Instagram Feed Placeholder */}
      <section className="container-full py-20 lg:py-32">
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-gray-500 mb-3">@worldg3nius</p>
          <h2 className="font-heading text-4xl md:text-5xl font-medium tracking-tight">
            Follow Our Journey
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400&q=80',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
            'https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?w=400&q=80',
            'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400&q=80',
          ].map((src, i) => (
            <a
              key={i}
              href="https://instagram.com/worldg3nius"
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square overflow-hidden img-zoom"
            >
              <Image
                src={src}
                alt={`Instagram post ${i + 1}`}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors" />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
