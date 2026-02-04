import { z } from 'zod';

export const shippingAddressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  region: z.string().min(1, 'Region/State is required'),
  country: z.string().min(1, 'Country is required'),
  postalCode: z.string().optional(),
  phone: z.string().min(1, 'Phone number is required'),
  gps: z.string().optional(),
});

export const checkoutSchema = z.object({
  shippingAddress: shippingAddressSchema,
  guestEmail: z.string().email('Valid email is required').optional(),
  guestName: z.string().min(1, 'Full name is required').optional(),
  createAccount: z.boolean().optional().default(false),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
}).refine(
  (data) => !data.createAccount || !!data.password,
  { message: 'Password is required to create an account', path: ['password'] }
);

export type ShippingAddressFormData = z.infer<typeof shippingAddressSchema>;
export type CheckoutFormData = z.infer<typeof checkoutSchema>;
