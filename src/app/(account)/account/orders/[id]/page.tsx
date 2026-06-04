'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { Order, Payment, Product } from '@/types';
import { StatusBadge, Button, Skeleton } from '@/components/ui';
import { formatCurrency, formatDate, getProductThumbnailUrl } from '@/lib/utils';
import { ArrowLeft, CheckCircle, XCircle, Clock, CreditCard, RefreshCcw, AlertCircle } from 'lucide-react';

export default function OrderDetailPage() {
  const getPaymentFailureMessage = (payment: Payment) => {
    const reason = payment.failureReason?.trim();
    if (!reason) {
      return payment.status === 'CANCELLED'
        ? 'Payment was cancelled. You can try again when ready.'
        : 'Payment could not be completed. Please try again.';
    }

    const normalized = reason.toLowerCase();
    if (payment.status === 'CANCELLED' || normalized.includes('cancel')) {
      return 'Payment was cancelled. You can try again when ready.';
    }

    if (normalized.includes('403') || normalized.includes('forbidden') || normalized.includes('hubtel service unavailable')) {
      return 'Payment could not be confirmed. Please try again.';
    }

    return reason;
  };
  const buildGatewayReturnUrl = (orderId: string) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
    const backendOrigin = apiBaseUrl.replace(/\/api\/v1\/?$/, '');
    const redirectUrl = `${window.location.origin}/account/orders/${orderId}`;
    const params = new URLSearchParams({
      orderId,
      redirect: redirectUrl,
    });
    return `${backendOrigin}/api/v1/store/payments/return?${params.toString()}`;
  };
  const getItemKey = (item: { productId: string; selectedOptions?: Record<string, string> }) =>
    `${item.productId}-${JSON.stringify(item.selectedOptions || {})}`;
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [itemImages, setItemImages] = useState<Record<string, string>>({});

  const fetchOrder = useCallback(async () => {
    try {
      const response = await apiClient.get<{ status: boolean; data: Order; message: string }>(
        `/store/orders/${orderId}`
      );
      setOrder(response.data.data);
    } catch (err) {
      console.error('Failed to fetch order', err);
      router.push('/account/orders');
    } finally {
      setIsLoading(false);
    }
  }, [orderId, router]);

  const fetchPayment = useCallback(async () => {
    try {
      const response = await apiClient.get<{ status: boolean; data: Payment[]; message: string }>(
        `/store/payments/order/${orderId}`
      );
      const payments = response.data.data || [];
      const latest = payments
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      setPayment(latest || null);
    } catch (err) {
      // Payment may not exist yet, that's okay
      console.log('No payment found for order', err);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
    fetchPayment();
  }, [fetchOrder, fetchPayment]);

  useEffect(() => {
    if (!order?.items || order.items.length === 0) return;
    const missingIds = order.items
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
  }, [order?.items, itemImages]);

  const refreshPaymentStatus = async () => {
    await Promise.all([fetchOrder(), fetchPayment()]);
  };

  const initiatePayment = async () => {
    try {
      const response = await apiClient.post<{
        status: boolean;
        data: { checkoutUrl: string };
        message: string;
      }>(`/store/payments/${orderId}/initiate`, {
        orderId,
        idempotencyKey: crypto.randomUUID(),
        returnUrl: buildGatewayReturnUrl(orderId),
      });

      if (response.data.data?.checkoutUrl) {
        window.location.href = response.data.data.checkoutUrl;
      }
    } catch (err: unknown) {
      console.error('Failed to initiate payment', err);
      const error = err as { response?: { data?: { message?: string } } };
      setPaymentError(error.response?.data?.message || 'Failed to initiate payment');
    }
  };


  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/account/orders"
            className="p-2 text-gray-400 hover:text-primary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Order {order.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-sm text-gray-500">Placed on {formatDate(order.createdAt)}</p>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Payment Status */}
      {payment && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Payment Status</h2>
          </div>

          {paymentError && (
            <div className="mb-4 p-3 bg-error-bg text-error rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {paymentError}
            </div>
          )}

          {payment ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  payment.status === 'SUCCESS'
                    ? 'bg-green-100 text-green-800'
                    : payment.status === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-800'
                    : payment.status === 'FAILED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {payment.status === 'SUCCESS' && <CheckCircle className="h-4 w-4 inline mr-1" />}
                  {payment.status === 'PENDING' && <Clock className="h-4 w-4 inline mr-1" />}
                  {payment.status === 'FAILED' && <XCircle className="h-4 w-4 inline mr-1" />}
                  {payment.status === 'CANCELLED' && <XCircle className="h-4 w-4 inline mr-1" />}
                  {payment.status}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-semibold">{formatCurrency(payment.amount)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Gateway</span>
                <span>{payment.gateway}</span>
              </div>

              {payment.transactionRef && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Reference</span>
                  <span className="font-mono text-sm">{payment.transactionRef}</span>
                </div>
              )}

              {(payment.failureReason || payment.status === 'FAILED' || payment.status === 'CANCELLED') && (
                <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  <strong>{payment.status === 'CANCELLED' ? 'Cancelled:' : 'Failed:'}</strong> {getPaymentFailureMessage(payment)}
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 flex gap-3">
                {payment.status === 'PENDING' && (
                  <>
                    <Button
                      onClick={refreshPaymentStatus}
                      variant="outline"
                      className="flex-1"
                    >
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Refresh Status
                    </Button>
                    {payment.checkoutUrl && (
                      <Button
                        onClick={() => window.location.href = payment.checkoutUrl!}
                        className="flex-1"
                      >
                        Complete Payment
                      </Button>
                    )}
                  </>
                )}
                {(payment.status === 'FAILED' || payment.status === 'CANCELLED') && (
                  <div className="flex gap-3 w-full">
                    <Button onClick={refreshPaymentStatus} variant="outline" className="flex-1">
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Refresh Status
                    </Button>
                    <Button onClick={initiatePayment} className="flex-1">
                      Retry Payment
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
      {!payment && order.status === 'PENDING' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <p className="text-gray-500 mb-4">No payment found for this order yet.</p>
          <Button onClick={initiatePayment}>Pay Now</Button>
        </div>
      )}

      {/* Order Items */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Order Items</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {order.items.map((item) => (
            <div key={getItemKey(item)} className="flex gap-4 p-6">
              <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-gray-400 text-xs">
                {itemImages[item.productId] ? (
                  <Image
                    src={itemImages[item.productId]}
                    alt={item.productName}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  'No Image'
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.productName}</p>
                <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                  <div className="mt-2 text-xs text-gray-500 space-y-1">
                    {Object.entries(item.selectedOptions).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="uppercase tracking-wider text-gray-400">{key}</span>
                        <span className="font-medium text-gray-600">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatCurrency(item.subtotal)}</p>
                <p className="text-sm text-gray-500">{formatCurrency(item.priceAtOrder)} each</p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="space-y-2">
            <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {order.shippingAddress && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Shipping Address</h2>
          <div className="text-sm text-gray-600 space-y-1">
            {order.shippingAddress.street && <p>{order.shippingAddress.street}</p>}
            {(order.shippingAddress.city || order.shippingAddress.region) && (
              <p>
                {order.shippingAddress.city}
                {order.shippingAddress.city && order.shippingAddress.region ? ', ' : ''}
                {order.shippingAddress.region}
              </p>
            )}
            {order.shippingAddress.country && <p>{order.shippingAddress.country}</p>}
            {order.shippingAddress.postalCode && <p>Postal Code: {order.shippingAddress.postalCode}</p>}
            {order.shippingAddress.phone && <p>Phone: {order.shippingAddress.phone}</p>}
            {order.shippingAddress.gps && <p>GPS: {order.shippingAddress.gps}</p>}
          </div>
        </div>
      )}

    </div>
  );
}
