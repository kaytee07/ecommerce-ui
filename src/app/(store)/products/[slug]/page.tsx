'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import { SafeImage } from '@/components/ui';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { Product, Inventory, ProductOption } from '@/types';
import { useCartStore } from '@/lib/stores';
import { Skeleton } from '@/components/ui';
import { formatCurrency, cn, getProductImageMap, getProductThumbnailUrl } from '@/lib/utils';
import { Minus, Plus, Check, ArrowLeft, AlertTriangle } from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

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
      setSelectedOptions({});

      // Fetch inventory for availability
      if (response.data.data?.id) {
        try {
          const inventoryRes = await apiClient.get<{ status: boolean; data: Inventory; message: string }>(
            `/store/inventory/${response.data.data.id}`
          );
          setInventory(inventoryRes.data.data);
        } catch (invErr) {
          console.error('Failed to fetch inventory', invErr);
          setInventory(null);
        }
      }

      // Fetch related products from same category
      if (response.data.data.categoryId) {
        const relatedResponse = await apiClient.get<{ status: boolean; data: { content: Product[] }; message: string }>(
          `/store/categories/${response.data.data.categoryId}/products?size=4`
        );
        const related = relatedResponse.data.data?.content || [];
        setRelatedProducts(related.filter((p) => p.id !== response.data.data.id));
      }
    } catch (err) {
      console.error('Failed to fetch product', err);
      setProduct(null);
      setRelatedProducts([]);
      setInventory(null);
    } finally {
      setIsLoading(false);
    }
  };

  const productOptions = useMemo<ProductOption[]>(() => {
    if (!product?.attributes) return [];
    const options = (product.attributes as { options?: unknown }).options;
    if (!Array.isArray(options)) return [];
    return options
      .map((option) => {
        if (!option || typeof option !== 'object') return null;
        const name = (option as { name?: unknown }).name;
        const values = (option as { values?: unknown }).values;
        const required = (option as { required?: unknown }).required;
        if (typeof name !== 'string' || !Array.isArray(values)) return null;
        return {
          name,
          values: values.filter((value) => typeof value === 'string') as string[],
          required: required === true,
        };
      })
      .filter((option): option is ProductOption => Boolean(option));
  }, [product]);

  useEffect(() => {
    if (productOptions.length === 0) return;
    setSelectedOptions((prev) => {
      const next = { ...prev };
      productOptions.forEach((option) => {
        if (!next[option.name] && option.values.length > 0) {
          if (option.values.length === 1 || option.required) {
            next[option.name] = option.values[0];
          }
        }
      });
      return next;
    });
  }, [productOptions]);

  const handleAddToCart = async () => {
    if (!product) return;
    const missingRequired = productOptions
      .filter((option) => option.required && !selectedOptions[option.name]);
    if (missingRequired.length > 0) {
      const missingLabels = missingRequired.map((option) => option.name).join(', ');
      setAddError(`Please select: ${missingLabels}.`);
      return;
    }
    setIsAdding(true);
    setAddError(null);
    try {
      const optionsPayload = Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined;
      await addItem(product.id, quantity, optionsPayload);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err: unknown) {
      console.error('Failed to add to cart', err);
      // Extract error message from API response
      const error = err as { response?: { data?: { message?: string; data?: { errorCode?: string } } } };
      const errorCode = error.response?.data?.data?.errorCode;
      if (errorCode === 'INSUFFICIENT_STOCK') {
        setAddError('Sorry, this item is out of stock or has insufficient quantity available.');
      } else {
        setAddError(error.response?.data?.message || 'Failed to add item to cart. Please try again.');
      }
      // Clear error after 5 seconds
      setTimeout(() => setAddError(null), 5000);
    } finally {
      setIsAdding(false);
    }
  };

  const maxAvailable = inventory?.availableQuantity ?? null;
  const incrementQuantity = () => {
    if (!product) return;
    if (maxAvailable === null || quantity < maxAvailable) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const images = useMemo(() => {
    if (!product) return [];
    const imageMap = getProductImageMap(product);
    if (!imageMap) return [];

    const mainUrl = imageMap.original || imageMap.large || imageMap.medium || imageMap.thumbnail;
    const thumbUrl = imageMap.thumbnail || imageMap.medium || imageMap.large || imageMap.original;

    if (!mainUrl || !thumbUrl) return [];
    return [{ id: 'primary', mainUrl, thumbUrl }];
  }, [product]);

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
  const isOutOfStock = maxAvailable !== null ? maxAvailable <= 0 : false;
  const missingRequiredOptions = productOptions.filter(
    (option) => option.required && !selectedOptions[option.name]
  );
  const isOptionsValid = missingRequiredOptions.length === 0;
  const missingLabel =
    missingRequiredOptions.length === 1
      ? `Select ${missingRequiredOptions[0].name}`
      : missingRequiredOptions.length > 1
      ? 'Select options'
      : null;
  const addToCartLabel = isOutOfStock
    ? 'Out of Stock'
    : isAdding
    ? 'Adding...'
    : added
    ? 'Added to Cart'
    : missingLabel
    ? missingLabel
    : addError
    ? 'Try Again'
    : 'Add to Cart';
  const isColorOption = (name: string) => name.toLowerCase().includes('color');
  const colorMap: Record<string, string> = {
    black: '#111827',
    white: '#f9fafb',
    gray: '#6b7280',
    grey: '#6b7280',
    blue: '#2563eb',
    red: '#dc2626',
    green: '#16a34a',
    yellow: '#ca8a04',
    pink: '#db2777',
    purple: '#7c3aed',
    orange: '#ea580c',
    brown: '#92400e',
  };
  const resolveColor = (value: string) => {
    const trimmed = value.trim().toLowerCase();
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed;
    return colorMap[trimmed] || null;
  };

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
                <SafeImage
                  src={images[selectedImage].mainUrl}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                  fallbackSrc="/placeholder.svg"
                />
              ) : (
                <SafeImage
                  src="/placeholder.svg"
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain bg-gray-100"
                />
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
                    <SafeImage
                      src={image.thumbUrl}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      sizes="96px"
                      className="object-cover"
                      fallbackSrc="/placeholder.svg"
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
                  {formatCurrency(product.effectivePrice || product.price)}
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
              ) : maxAvailable !== null ? (
                <p className="text-gray-500 text-sm">
                  {maxAvailable} in stock
                </p>
              ) : (
                <p className="text-gray-500 text-sm">Stock available</p>
              )}

              {/* Product Options */}
              {productOptions.length > 0 && (
                <div className="space-y-5">
                  {productOptions.map((option) => {
                    const value = selectedOptions[option.name] || '';
                    const isColor = isColorOption(option.name);
                    return (
                      <div key={option.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm tracking-wider uppercase text-gray-500">
                              {option.name}
                            </span>
                            {option.required && (
                              <span className="text-[10px] text-red-500 tracking-wider uppercase">Required</span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            {value ? value : 'Select one'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {option.values.map((optValue) => {
                            const isSelected = value === optValue;
                            const swatch = isColor ? resolveColor(optValue) : null;
                            return (
                              <button
                                key={optValue}
                                type="button"
                                onClick={() =>
                                  setSelectedOptions((prev) => ({
                                    ...prev,
                                    [option.name]: optValue,
                                  }))
                                }
                                className={cn(
                                  'group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs tracking-wide uppercase transition-all duration-200 active:scale-95',
                                  isSelected
                                    ? 'border-primary bg-primary text-white shadow-sm ring-2 ring-primary/20'
                                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-500 hover:shadow-sm'
                                )}
                              >
                                {swatch && (
                                  <span
                                    className={cn(
                                      'h-3 w-3 rounded-full border border-white/60 shadow-sm',
                                      isSelected ? 'border-white' : 'border-gray-200'
                                    )}
                                    style={{ backgroundColor: swatch }}
                                  />
                                )}
                                <span>{optValue}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Error Message */}
              {addError && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-700 text-sm">{addError}</p>
                  </div>
                  <button
                    onClick={() => setAddError(null)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Quantity */}
              {!isOutOfStock && (
                <div className="flex items-center gap-4">
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
                      disabled={maxAvailable !== null ? quantity >= maxAvailable : false}
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
                disabled={isOutOfStock || isAdding || !isOptionsValid}
                className={cn(
                  'w-full py-4 text-sm font-medium tracking-wider uppercase transition-all',
                  added
                    ? 'bg-success text-white'
                    : addError
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : isOutOfStock || !isOptionsValid
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-black'
                )}
              >
                {added ? (
                  <span className="flex items-center justify-center gap-2">
                    <Check className="h-5 w-5" />
                    Added to Cart
                  </span>
                ) : (
                  addToCartLabel
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
                    {Object.entries(product.attributes)
                      .filter(([key]) => key !== 'options')
                      .map(([key, value]) => {
                      const isImages = key === 'images' && value && typeof value === 'object';
                      const displayValue = (() => {
                        if (isImages) {
                          return `${Object.keys(value as Record<string, unknown>).length} images`;
                        }
                        if (typeof value === 'string' || typeof value === 'number') {
                          return value;
                        }
                        if (value === null || value === undefined) {
                          return '—';
                        }
                        return JSON.stringify(value);
                      })();

                      return (
                        <div key={key} className="flex justify-between text-sm border-b border-gray-100 pb-2">
                          <dt className="text-gray-500 capitalize">{key}</dt>
                          <dd className="font-medium">{displayValue}</dd>
                        </div>
                      );
                    })}
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
                    <SafeImage
                      src={getProductThumbnailUrl(relatedProduct) || '/placeholder.svg'}
                      alt={relatedProduct.name}
                      fill
                      className="object-cover"
                      fallbackSrc="/placeholder.svg"
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
