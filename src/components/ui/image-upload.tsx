'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  currentImage?: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
  accept?: string;
  maxSizeMB?: number;
}

export function ImageUpload({
  currentImage,
  onUpload,
  onRemove,
  disabled = false,
  className,
  accept = 'image/jpeg,image/png,image/webp',
  maxSizeMB = 5,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = accept.split(',').map(t => t.trim());
    if (!validTypes.includes(file.type)) {
      setError(`Invalid file type. Accepted: ${validTypes.join(', ')}`);
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`File too large. Maximum size: ${maxSizeMB}MB`);
      return;
    }

    setError(null);
    setIsUploading(true);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      await onUpload(file);
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to upload image. Please try again.');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setError(null);
    if (onRemove) {
      onRemove();
    }
  };

  const displayImage = previewUrl || currentImage;

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-colors',
          displayImage ? 'border-gray-200' : 'border-gray-300 hover:border-primary',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && !displayImage && 'cursor-pointer'
        )}
        onClick={() => !disabled && !displayImage && fileInputRef.current?.click()}
      >
        {displayImage ? (
          <div className="relative aspect-square">
            <Image
              src={displayImage}
              alt="Uploaded image"
              fill
              className="object-cover rounded-lg"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
            {!disabled && !isUploading && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>
            )}
          </div>
        ) : (
          <div className="p-8 text-center">
            {isUploading ? (
              <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin mb-4" />
            ) : (
              <Upload className="h-10 w-10 mx-auto text-gray-400 mb-4" />
            )}
            <p className="text-sm text-gray-600 mb-1">
              {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-gray-400">
              PNG, JPG, WebP up to {maxSizeMB}MB
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={disabled || isUploading}
          className="hidden"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-error">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}

interface MultiImageUploadProps {
  images: string[];
  onUpload: (file: File) => Promise<string | void>;
  onRemove: (index: number) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  disabled?: boolean;
  maxImages?: number;
  className?: string;
}

export function MultiImageUpload({
  images,
  onUpload,
  onRemove,
  disabled = false,
  maxImages = 5,
  className,
}: MultiImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check if adding these files would exceed max
    const remainingSlots = maxImages - images.length;
    if (files.length > remainingSlots) {
      setError(`Can only add ${remainingSlots} more image(s). Maximum is ${maxImages}.`);
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      for (const file of files) {
        // Validate file type
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          continue;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          continue;
        }

        await onUpload(file);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to upload some images.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Existing images */}
        {images.map((image, index) => (
          <div key={index} className="relative aspect-square">
            <Image
              src={image}
              alt={`Product image ${index + 1}`}
              fill
              className="object-cover rounded-lg border border-gray-200"
            />
            {index === 0 && (
              <span className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-0.5 rounded">
                Main
              </span>
            )}
            {!disabled && (
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>
            )}
          </div>
        ))}

        {/* Add new image button */}
        {canAddMore && !disabled && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="aspect-square border-2 border-dashed border-gray-300 rounded-lg hover:border-primary transition-colors flex flex-col items-center justify-center"
          >
            {isUploading ? (
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            ) : (
              <>
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Add Image</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {error && (
        <div className="flex items-center gap-2 text-sm text-error">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <p className="text-xs text-gray-500">
        {images.length}/{maxImages} images. First image will be the main product image.
      </p>
    </div>
  );
}
