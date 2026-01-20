'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { Product } from '@/types';
import { useCartStore } from '@/lib/stores';
import { dummyProducts } from '@/lib/data/dummy';
import { Skeleton } from '@/components/ui';
import { formatCurrency, cn } from '@/lib/utils';
import { Minus, Plus, Check, ArrowLeft } from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  const { addItem } = useCartStore();

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<{ status: boolean; data: Product; message: string }>(
        `/store/products/slug/${slug}`
      );
      setProduct(response.data.data);

      // Fetch related products from same category
      if (response.data.data.categoryId) {
        const relatedResponse = await apiClient.get<{ status: boolean; data: { content: Product[] }; message: string }>(
          `/store/categories/${response.data.data.categoryId}/products?size=4`
        );
        setRelatedProducts(
          relatedResponse.data.data.content.filter((p) => p.id !== response.data.data.id)
        );
      }
    } catch (err) {
      console.error('Failed to fetch product, using dummy data', err);
      // Use dummy data as fallback
      const dummyProduct = dummyProducts.find(p => p.slug === slug);
      if (dummyProduct) {
        setProduct(dummyProduct);
        // Get related products from same category
        const related = dummyProducts.filter(
          p => p.categoryId === dummyProduct.categoryId && p.id !== dummyProduct.id
        );
        setRelatedProducts(related.slice(0, 4));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    setIsAdding(true);
    try {
      await addItem(product.id, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error('Failed to add to cart', err);
    } finally {
      setIsAdding(false);
    }
  };

  const incrementQuantity = () => {
    if (product && quantity < product.stockQuantity) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="container-full py-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
            <Skeleton className="aspect-[3/4] w-full" />
            <div className="space-y-6 py-8">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  const images = product.images?.length
    ? product.images
    : product.imageUrl
    ? [{ id: '0', url: product.imageUrl, isPrimary: true, displayOrder: 0 }]
    : [];

  const isOutOfStock = product.stockQuantity <= 0;

  return (
    <div className="min-h-screen bg-cream">
      {/* Back Link */}
      <div className="container-full py-4 border-b border-gray-200 bg-white">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm tracking-wider uppercase hover:opacity-70"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Shop
        </Link>
      </div>

      <div className="container-full py-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-[3/4] bg-white overflow-hidden">
              {images.length > 0 ? (
                <Image
                  src={images[selectedImage].url}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
              {product.compareAtPrice && (
                <span className="absolute top-6 left-6 bg-primary text-white text-xs px-4 py-2 tracking-wider uppercase">
                  Sale
                </span>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      'relative w-24 h-32 flex-shrink-0 overflow-hidden border-2 transition-colors',
                      selectedImage === index ? 'border-primary' : 'border-transparent hover:border-gray-300'
                    )}
                  >
                    <Image
                      src={image.url}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="lg:py-8">
            <div className="space-y-6">
              <div>
                <p className="text-xs tracking-[0.2em] uppercase text-gray-500 mb-3">
                  {product.category?.name || product.categoryName}
                </p>
                <h1 className="font-heading text-3xl lg:text-4xl font-medium tracking-tight">
                  {product.name}
                </h1>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-heading text-2xl">
                  {formatCurrency(product.discountedPrice || product.price)}
                </span>
                {product.compareAtPrice && (
                  <span className="text-gray-400 line-through">
                    {formatCurrency(product.compareAtPrice)}
                  </span>
                )}
                {product.discountPercentage && (
                  <span className="bg-primary text-white text-xs px-2 py-1 tracking-wider uppercase">
                    -{product.discountPercentage}%
                  </span>
                )}
              </div>

              <div className="border-t border-b border-gray-200 py-6">
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>

              {/* Stock Status */}
              {isOutOfStock ? (
                <p className="text-error text-sm tracking-wider uppercase">Out of Stock</p>
              ) : (
                <p className="text-gray-500 text-sm">
                  {product.stockQuantity} in stock
                </p>
              )}

              {/* Quantity Selector */}
              {!isOutOfStock && (
                <div className="flex items-center gap-6">
                  <span className="text-sm tracking-wider uppercase text-gray-500">Quantity</span>
                  <div className="flex items-center border border-gray-300">
                    <button
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                      className="p-3 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button
                      onClick={incrementQuantity}
                      disabled={quantity >= product.stockQuantity}
                      className="p-3 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAdding}
                className={cn(
                  'w-full py-4 text-sm font-medium tracking-wider uppercase transition-all',
                  added
                    ? 'bg-success text-white'
                    : isOutOfStock
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-black'
                )}
              >
                {isAdding ? (
                  'Adding...'
                ) : added ? (
                  <span className="flex items-center justify-center gap-2">
                    <Check className="h-5 w-5" />
                    Added to Cart
                  </span>
                ) : isOutOfStock ? (
                  'Out of Stock'
                ) : (
                  'Add to Cart'
                )}
              </button>

              {/* Additional Info */}
              <div className="space-y-4 pt-6 text-sm text-gray-500">
                <p className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="tracking-wider uppercase">SKU</span>
                  <span className="font-mono">{product.sku}</span>
                </p>
                {product.shortDescription && (
                  <p className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="tracking-wider uppercase">Details</span>
                    <span>{product.shortDescription}</span>
                  </p>
                )}
              </div>

              {/* Product Attributes */}
              {product.attributes && Object.keys(product.attributes).length > 0 && (
                <div className="pt-4">
                  <h3 className="text-xs tracking-[0.2em] uppercase text-gray-500 mb-4">Specifications</h3>
                  <dl className="space-y-2">
                    {Object.entries(product.attributes).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm border-b border-gray-100 pb-2">
                        <dt className="text-gray-500 capitalize">{key}</dt>
                        <dd className="font-medium">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="bg-white py-20">
          <div className="container-full">
            <h2 className="font-heading text-3xl font-medium tracking-tight mb-12 text-center">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {relatedProducts.slice(0, 4).map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  href={`/products/${relatedProduct.slug}`}
                  className="group"
                >
                  <div className="relative aspect-[3/4] overflow-hidden img-zoom mb-4">
                    <Image
                      src={relatedProduct.images?.[0]?.url || relatedProduct.imageUrl || '/placeholder.jpg'}
                      alt={relatedProduct.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 tracking-wider uppercase">
                      {relatedProduct.category?.name || relatedProduct.categoryName}
                    </p>
                    <h3 className="font-heading text-lg group-hover:opacity-70 transition-opacity">
                      {relatedProduct.name}
                    </h3>
                    <span className="font-medium">
                      {formatCurrency(relatedProduct.price)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
