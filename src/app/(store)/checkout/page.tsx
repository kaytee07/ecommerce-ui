'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCartStore, useAuthStore } from '@/lib/stores';
import { apiClient } from '@/lib/api/client';
import { checkoutSchema, type CheckoutFormData } from '@/lib/validations';
import { formatCurrency, getProductThumbnailUrl } from '@/lib/utils';
import { Button, Input, Skeleton } from '@/components/ui';
import { Shield } from 'lucide-react';
import { Product } from '@/types';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, fetchCart, isLoading } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itemImages, setItemImages] = useState<Record<string, string>>({});
  const getItemKey = (item: { itemKey?: string; productId: string }) => item.itemKey || item.productId;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shippingAddress: {},
      createAccount: false,
    },
  });

  const createAccount = watch('createAccount');
  useEffect(() => {
    fetchCart();
  }, [isAuthenticated, fetchCart]);

  useEffect(() => {
    if (!cart?.items || cart.items.length === 0) return;
    const missingIds = cart.items
      .map((item) => item.productId)
      .filter((id) => !itemImages[id]);
    if (missingIds.length === 0) return;

    let cancelled = false;
    const fetchImages = async () => {
      try {
        const results = await Promise.all(
          missingIds.map(async (id) => {
            try {
              const res = await apiClient.get<{ status: boolean; data: Product }>(`/store/products/${id}`);
              return { id, product: res.data.data };
            } catch {
              return null;
            }
          })
        );
        if (cancelled) return;
        setItemImages((prev) => {
          let changed = false;
          const next = { ...prev };
          results.forEach((result) => {
            if (result?.product) {
              const thumb = getProductThumbnailUrl(result.product);
              if (thumb && next[result.id] !== thumb) {
                next[result.id] = thumb;
                changed = true;
              }
            }
          });
          return changed ? next : prev;
        });
      } catch {
        // ignore
      }
    };

    fetchImages();
    return () => {
      cancelled = true;
    };
  }, [cart?.items, itemImages]);

  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const guestEmail = data.guestEmail?.trim();
      const guestName = data.guestName?.trim();

      if (!isAuthenticated) {
        if (!guestEmail || !guestName) {
          setError('Full name and email are required for guest checkout.');
          return;
        }
      }

      const orderPayload = {
        shippingAddress: data.shippingAddress || null,
        notes: data.notes || null,
        guestEmail: guestEmail || null,
        guestName: guestName || null,
        createAccount: !!data.createAccount,
        password: data.createAccount ? data.password || null : null,
      };

      const orderEndpoint = isAuthenticated ? '/store/orders' : '/store/orders/guest';
      const orderResponse = await apiClient.post<{ status: boolean; data: { id: string }; message: string }>(
        orderEndpoint,
        orderPayload
      );
      const orderId = orderResponse.data.data?.id;
      if (!orderId) {
        setError(orderResponse.data.message || 'Order could not be created. Please try again.');
        return;
      }

      // Initiate payment
      const idempotencyKey = crypto.randomUUID();
      const paymentEndpoint = isAuthenticated
        ? `/store/payments/${orderId}/initiate`
        : `/store/payments/${orderId}/initiate-guest`;
      const paymentPayload = isAuthenticated
        ? { orderId, idempotencyKey, callbackUrl: `${window.location.origin}/account/orders/${orderId}?verify=true` }
        : {
            guestEmail,
            guestName,
            idempotencyKey,
            callbackUrl: `${window.location.origin}/`,
          };

      const paymentResponse = await apiClient.post<{
        status: boolean;
        data: { checkoutUrl?: string };
        message: string;
      }>(paymentEndpoint, paymentPayload);

      // Redirect to payment gateway
      if (paymentResponse.data.data?.checkoutUrl) {
        window.location.href = paymentResponse.data.data.checkoutUrl;
      } else {
        router.push(isAuthenticated ? `/account/orders/${orderId}` : '/');
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
            {!isAuthenticated && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Guest Checkout</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Provide your details so we can send order updates and receipts to your email.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    placeholder="Your name"
                    error={errors.guestName?.message}
                    {...register('guestName')}
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    error={errors.guestEmail?.message}
                    {...register('guestEmail')}
                  />
                </div>
                <div className="mt-5 space-y-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      {...register('createAccount')}
                    />
                    Create an account for faster checkout next time
                  </label>
                  {createAccount && (
                    <Input
                      label="Password"
                      type="password"
                      placeholder="Create a password"
                      error={errors.password?.message}
                      {...register('password')}
                    />
                  )}
                </div>
              </div>
            )}

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

                <Input
                  label="Region / State"
                  placeholder="Greater Accra"
                  error={errors.shippingAddress?.region?.message}
                  {...register('shippingAddress.region')}
                />

                <Input
                  label="Country"
                  placeholder="Ghana"
                  error={errors.shippingAddress?.country?.message}
                  {...register('shippingAddress.country')}
                />

                <Input
                  label="Phone"
                  placeholder="+233 20 123 4567"
                  type="tel"
                  error={errors.shippingAddress?.phone?.message}
                  {...register('shippingAddress.phone')}
                />

                <Input
                  label="Postal Code (Optional)"
                  placeholder="00233"
                  {...register('shippingAddress.postalCode')}
                />

                <Input
                  label="GPS Address (Optional)"
                  placeholder="GA-123-4567"
                  {...register('shippingAddress.gps')}
                />
              </div>
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
                  <div key={getItemKey(item)} className="flex gap-3">
                    <div className="relative w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0 flex items-center justify-center text-xs text-gray-400">
                      {itemImages[item.productId] ? (
                        <Image
                          src={itemImages[item.productId]}
                          alt={item.productName}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        'No Image'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">
                        {item.productName}
                      </p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                        <div className="mt-1 text-xs text-gray-500 space-y-1">
                          {Object.entries(item.selectedOptions).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2">
                              <span className="uppercase tracking-wider text-gray-400">{key}</span>
                              <span className="font-medium text-gray-600">{value}</span>
                            </div>
                          ))}
                        </div>
                      )}
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
                  <span>{formatCurrency(cart.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>Calculated</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between text-lg font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{formatCurrency(cart.totalAmount)}</span>
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
