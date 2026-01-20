import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Name is too long'),
  slug: z
    .string()
    .regex(/^[a-z0-9-]*$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .optional()
    .or(z.literal('')),
  description: z.string().max(500, 'Description is too long').optional(),
  parentId: z.string().uuid().nullable().optional(),
  displayOrder: z.number().int().min(0).default(0),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
