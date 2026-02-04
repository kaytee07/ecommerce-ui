import { Product } from '@/types';

export function getProductImageMap(product: Product): Record<string, string> | null {
  const attributes = product.attributes as Record<string, unknown> | undefined;
  const images = attributes?.images;
  if (!images) return null;

  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, string>;
      }
    } catch {
      return null;
    }
    return null;
  }

  if (typeof images !== 'object') return null;
  return images as Record<string, string>;
}

export function getProductThumbnailUrl(product: Product): string | null {
  const map = getProductImageMap(product);
  if (map) {
    return map.thumbnail || map.medium || map.large || map.original || null;
  }
  return product.imageUrl || product.images?.[0]?.url || null;
}

export function getProductMainImageUrl(product: Product): string | null {
  const map = getProductImageMap(product);
  if (map) {
    return map.medium || map.original || map.large || map.thumbnail || null;
  }
  return product.imageUrl || product.images?.[0]?.url || null;
}

export function getProductOriginalImageUrl(product: Product): string | null {
  const map = getProductImageMap(product);
  if (map) {
    return map.original || map.large || map.medium || map.thumbnail || null;
  }
  return product.imageUrl || product.images?.[0]?.url || null;
}
