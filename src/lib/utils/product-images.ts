import { Product } from '@/types';

function upgradeThumbToOriginal(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.includes('-thumb.')) {
    return url.replace('-thumb.', '-original.');
  }
  return url;
}

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
    return map.large || map.original || map.medium || map.thumbnail || null;
  }
  return (
    upgradeThumbToOriginal(product.imageUrl)
    || upgradeThumbToOriginal(product.images?.[0]?.url)
    || product.imageUrl
    || product.images?.[0]?.url
    || null
  );
}

export function getProductOriginalImageUrl(product: Product): string | null {
  const map = getProductImageMap(product);
  if (map) {
    return map.original || map.large || map.medium || map.thumbnail || null;
  }
  return (
    upgradeThumbToOriginal(product.imageUrl)
    || upgradeThumbToOriginal(product.images?.[0]?.url)
    || product.imageUrl
    || product.images?.[0]?.url
    || null
  );
}
