import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255, 'Name is too long'),
  description: z.string().optional(),
  price: z.number().positive('Price must be greater than 0'),
  compareAtPrice: z.number().positive('Compare price must be greater than 0').optional(),
  sku: z.string().min(1, 'SKU is required').max(100, 'SKU is too long'),
  categoryId: z.string().uuid('Please select a category'),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  attributes: z.record(z.string()).optional(),
});

export const discountSchema = z.object({
  discountPercentage: z.number().min(1, 'Minimum 1%').max(99, 'Maximum 99%'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const bulkDiscountSchema = z.object({
  categoryId: z.string().uuid().optional(),
  applyToAll: z.boolean().optional(),
  discountPercentage: z.number().min(1, 'Minimum 1%').max(99, 'Maximum 99%'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;
export type DiscountFormData = z.infer<typeof discountSchema>;
export type BulkDiscountFormData = z.infer<typeof bulkDiscountSchema>;
