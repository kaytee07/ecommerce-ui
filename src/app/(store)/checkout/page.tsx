'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCartStore, useAuthStore } from '@/lib/stores';
import { apiClient } from '@/lib/api/client';
import { checkoutSchema, type CheckoutFormData } from '@/lib/validations';
import { formatCurrency } from '@/lib/utils';
import { Button, Input, Select, Skeleton } from '@/components/ui';
import { CreditCard, Smartphone, ChevronRight, Shield, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const PAYMENT_METHODS = [
  { value: 'MOBILE_MONEY', label: 'Mobile Money', icon: Smartphone },
  { value: 'CARD', label: 'Card Payment', icon: CreditCard },
] as const;

const COUNTRIES = [
  { value: 'Ghana', label: 'Ghana' },
  { value: 'Nigeria', label: 'Nigeria' },
  { value: 'Kenya', label: 'Kenya' },
];

const REGIONS = {
  Ghana: [
    { value: 'Greater Accra', label: 'Greater Accra' },
    { value: 'Ashanti', label: 'Ashanti' },
    { value: 'Western', label: 'Western' },
    { value: 'Central', label: 'Central' },
    { value: 'Eastern', label: 'Eastern' },
    { value: 'Northern', label: 'Northern' },
  ],
};

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, fetchCart, isLoading } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState('Ghana');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shippingAddress: {
        country: 'Ghana',
      },
      paymentMethod: 'MOBILE_MONEY',
    },
  });

  const paymentMethod = watch('paymentMethod');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
      return;
    }
    fetchCart();
  }, [isAuthenticated]);

  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Create order
      const orderResponse = await apiClient.post<{ status: boolean; data: { id: string }; message: string }>(
        '/store/orders',
        data
      );
      const orderId = orderResponse.data.data.id;

      // Initiate payment
      const paymentResponse = await apiClient.post<{
        status: boolean;
        data: { checkoutUrl: string };
        message: string;
      }>(`/store/payments/${orderId}/initiate`, {
        callbackUrl: `${window.location.origin}/account/orders/${orderId}`,
      });

      // Redirect to payment gateway
      if (paymentResponse.data.data.checkoutUrl) {
        window.location.href = paymentResponse.data.data.checkoutUrl;
      } else {
        router.push(`/account/orders/${orderId}`);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to process order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !cart) {
    return (
      <div className="container-wide py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    router.push('/cart');
    return null;
  }

  return (
    <div className="container-wide py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Shipping Address */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Shipping Address</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Street Address"
                    placeholder="123 Main Street"
                    error={errors.shippingAddress?.street?.message}
                    {...register('shippingAddress.street')}
                  />
                </div>

                <Input
                  label="City"
                  placeholder="Accra"
                  error={errors.shippingAddress?.city?.message}
                  {...register('shippingAddress.city')}
                />

                <Select
                  label="Region"
                  options={REGIONS[selectedCountry as keyof typeof REGIONS] || []}
                  placeholder="Select region"
                  error={errors.shippingAddress?.region?.message}
                  {...register('shippingAddress.region')}
                />

                <Select
                  label="Country"
                  options={COUNTRIES}
                  error={errors.shippingAddress?.country?.message}
                  {...register('shippingAddress.country', {
                    onChange: (e) => setSelectedCountry(e.target.value),
                  })}
                />

                <Input
                  label="Postal Code (Optional)"
                  placeholder="00233"
                  {...register('shippingAddress.postalCode')}
                />

                <Input
                  label="Phone (Optional)"
                  placeholder="+233 20 123 4567"
                  type="tel"
                  {...register('shippingAddress.phone')}
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Payment Method</h2>

              <div className="grid grid-cols-2 gap-4">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  const isSelected = paymentMethod === method.value;

                  return (
                    <label
                      key={method.value}
                      className={cn(
                        'flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors',
                        isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <input
                        type="radio"
                        value={method.value}
                        className="sr-only"
                        {...register('paymentMethod')}
                      />
                      <Icon className={cn('h-6 w-6', isSelected ? 'text-primary' : 'text-gray-400')} />
                      <span className={cn('font-medium', isSelected ? 'text-primary' : 'text-gray-700')}>
                        {method.label}
                      </span>
                      {isSelected && <Check className="h-5 w-5 text-primary ml-auto" />}
                    </label>
                  );
                })}
              </div>
              {errors.paymentMethod && (
                <p className="mt-2 text-sm text-error">{errors.paymentMethod.message}</p>
              )}
            </div>

            {/* Order Notes */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Notes (Optional)</h2>
              <textarea
                placeholder="Any special instructions for your order?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                rows={3}
                {...register('notes')}
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={item.productId} className="flex gap-3">
                    <div className="relative w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {item.productImage && (
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">
                        {item.productName}
                      </p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(item.subtotal)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>Calculated</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between text-lg font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{formatCurrency(cart.subtotal)}</span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-error-bg text-error rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
                Complete Order
              </Button>

              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-500">
                <Shield className="h-4 w-4" />
                <span>Secure checkout powered by Hubtel</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
