'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { Product, Category, Page } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui';

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHomePageData();
  }, []);

  const fetchHomePageData = async () => {
    setIsLoading(true);
    try {
      // Fetch all data in parallel
      const [categoriesRes, featuredRes, newArrivalsRes] = await Promise.all([
        apiClient.get<{ status: boolean; data: Category[] }>('/store/categories'),
        apiClient.get<{ status: boolean; data: Product[] }>('/store/products/featured'),
        apiClient.get<{ status: boolean; data: Page<Product> }>('/store/products/search?size=8&sortBy=createdAt&sortDirection=desc'),
      ]);

      // IMPORTANT: Always use fallback to prevent undefined errors
      setCategories(categoriesRes.data.data || []);
      setFeaturedProducts(featuredRes.data.data || []);
      setNewArrivals(newArrivalsRes.data.data?.content || []);
    } catch (err) {
      console.error('Failed to fetch homepage data', err);
      // Keep empty arrays on error
      setCategories([]);
      setFeaturedProducts([]);
      setNewArrivals([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter out inactive categories and sort by display order
  const activeCategories = categories
    .filter(c => c.active !== false)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Section - Vlisco Inspired */}
      <section className="relative h-[90vh] min-h-[600px]">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1920&q=80"
            alt="World Genius Collection"
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
                New Collection
              </p>
              <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl text-white font-medium tracking-tight leading-none mb-6">
                Define Your
                <br />
                Own Rules
              </h1>
              <p className="text-white/80 text-lg mb-8 max-w-md">
                Bold streetwear for those who refuse to conform. Made in Ghana, worn worldwide.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-3 bg-white text-primary px-8 py-4 text-sm font-medium tracking-wider uppercase hover:bg-white/90 transition-colors"
              >
                Shop Collection
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
                <Image
                  src={category.imageUrl || '/placeholder-category.jpg'}
                  alt={category.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <h3 className="font-heading text-2xl text-white mb-1">{category.name}</h3>
                  <p className="text-white/80 text-sm tracking-wide">
                    {category.productCount || 0} Products
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
              {featuredProducts.slice(0, 8).map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group"
                >
                  <div className="relative aspect-[3/4] overflow-hidden img-zoom mb-4">
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
              ))}
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
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1920&q=80"
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
            {newArrivals.slice(0, 4).map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group"
              >
                <div className="relative aspect-[3/4] overflow-hidden img-zoom mb-4">
                  <Image
                    src={product.images?.[0]?.url || product.imageUrl || '/placeholder.jpg'}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                  <span className="absolute top-4 left-4 bg-primary text-white text-xs px-3 py-1 tracking-wider uppercase">
                    New
                  </span>
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
                </div>
              </Link>
            ))}
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
