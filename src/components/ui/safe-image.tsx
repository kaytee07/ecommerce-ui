'use client';

import Image, { ImageProps } from 'next/image';
import { useState, useEffect } from 'react';

interface SafeImageProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string;
}

const DEFAULT_PLACEHOLDER = '/placeholder.svg';

function isSvg(src: string | undefined | null): boolean {
  if (!src || typeof src !== 'string') return false;
  return src.endsWith('.svg');
}

export function SafeImage({ fallbackSrc, src, alt, unoptimized, ...props }: SafeImageProps) {
  const fallback = fallbackSrc || DEFAULT_PLACEHOLDER;
  const [imgSrc, setImgSrc] = useState(src || fallback);
  const [hasError, setHasError] = useState(false);

  // Reset when src prop changes
  useEffect(() => {
    setImgSrc(src || fallback);
    setHasError(false);
  }, [src, fallback]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallback);
    }
  };

  // SVGs should not go through Next.js image optimization
  const shouldSkipOptimization = unoptimized || isSvg(typeof imgSrc === 'string' ? imgSrc : undefined);

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={handleError}
      unoptimized={shouldSkipOptimization}
    />
  );
}
