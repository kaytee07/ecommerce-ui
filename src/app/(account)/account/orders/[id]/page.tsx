'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { Order, Payment } from '@/types';
import { StatusBadge, Button, Skeleton, ConfirmModal } from '@/components/ui';
import { formatCurrency, formatDate, formatDateTime, formatOrderNumber } from '@/lib/utils';
import { ArrowLeft, Package, Truck, CheckCircle, XCircle, Clock, MapPin, CreditCard, Loader2, RefreshCcw, AlertCircle } from 'lucide-react';

const statusIcons: Record<string, typeof Package> = {
  PENDING: Clock,
  PENDING_PAYMENT: Clock,
  CONFIRMED: Package,
  PROCESSING: Package,
  SHIPPED: Truck,
  DELIVERED: CheckCircle,
  CANCELLED: XCircle,
  REFUNDED: XCircle,
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentVerified, setPaymentVerified] = useState(false);

  useEffect(() => {
    fetchOrder();
    fetchPayment();
  }, [orderId]);

  // Auto-verify payment when returning from payment gateway
  useEffect(() => {
    const shouldVerify = searchParams.get('verify') === 'true' || searchParams.get('status');
    if (shouldVerify && payment?.status === 'PENDING') {
      verifyPayment();
    }
  }, [payment, searchParams]);

  const fetchOrder = async () => {
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
  };

  const fetchPayment = async () => {
    try {
      const response = await apiClient.get<{ status: boolean; data: Payment; message: string }>(
        `/store/payments/order/${orderId}`
      );
      setPayment(response.data.data);
    } catch (err) {
      // Payment may not exist yet, that's okay
      console.log('No payment found for order', err);
    }
  };

  const verifyPayment = async () => {
    if (!payment?.id || isVerifyingPayment) return;

    setIsVerifyingPayment(true);
    setPaymentError(null);

    try {
      const response = await apiClient.get<{ status: boolean; data: Payment; message: string }>(
        `/store/payments/${payment.id}/verify`
      );
      setPayment(response.data.data);
      setPaymentVerified(true);

      // Refresh order to get updated status
      if (response.data.data?.status === 'SUCCESS') {
        await fetchOrder();
      }
    } catch (err: unknown) {
      console.error('Failed to verify payment', err);
      const error = err as { response?: { data?: { message?: string } } };
      setPaymentError(error.response?.data?.message || 'Failed to verify payment status');
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  const initiatePayment = async () => {
    try {
      const response = await apiClient.post<{
        status: boolean;
        data: { checkoutUrl: string };
        message: string;
      }>(`/store/payments/${orderId}/initiate`, {
        callbackUrl: `${window.location.origin}/account/orders/${orderId}?verify=true`,
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

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await apiClient.post(`/store/orders/${orderId}/cancel`);
      await fetchOrder();
    } catch (err) {
      console.error('Failed to cancel order', err);
    } finally {
      setIsCancelling(false);
      setShowCancelModal(false);
    }
  };

  const canCancel = order && ['PENDING', 'PENDING_PAYMENT', 'CONFIRMED'].includes(order.status);

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
              Order {formatOrderNumber(order.orderNumber)}
            </h1>
            <p className="text-sm text-gray-500">Placed on {formatDate(order.createdAt)}</p>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Payment Status */}
      {(payment || order?.status === 'PENDING_PAYMENT') && (
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

              {payment.failureReason && (
                <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  <strong>Failed:</strong> {payment.failureReason}
                </div>
              )}

              {paymentVerified && payment.status === 'SUCCESS' && (
                <div className="mt-3 p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Payment verified successfully
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 flex gap-3">
                {payment.status === 'PENDING' && (
                  <>
                    <Button
                      onClick={verifyPayment}
                      disabled={isVerifyingPayment}
                      variant="outline"
                      className="flex-1"
                    >
                      {isVerifyingPayment ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCcw className="h-4 w-4 mr-2" />
                      )}
                      Check Status
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
                {payment.status === 'FAILED' && (
                  <Button onClick={initiatePayment} className="flex-1">
                    Retry Payment
                  </Button>
                )}
              </div>
            </div>
          ) : order?.status === 'PENDING_PAYMENT' ? (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-4">This order is awaiting payment.</p>
              <Button onClick={initiatePayment}>
                Pay Now
              </Button>
            </div>
          ) : null}
        </div>
      )}

      {/* Order Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Order Timeline</h2>
        <div className="space-y-4">
          {order.statusHistory.map((history, index) => {
            const Icon = statusIcons[history.status] || Package;
            return (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  {index < order.statusHistory.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 my-1" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="font-medium text-gray-900">{history.status.replace('_', ' ')}</p>
                  <p className="text-sm text-gray-500">{formatDateTime(history.changedAt)}</p>
                  {history.reason && (
                    <p className="text-sm text-gray-600 mt-1">{history.reason}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Order Items</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {order.items.map((item) => (
            <div key={item.productId} className="flex gap-4 p-6">
              <Link
                href={`/products/${item.productSlug}`}
                className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0"
              >
                {item.productImage && (
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                )}
              </Link>
              <div className="flex-1">
                <Link
                  href={`/products/${item.productSlug}`}
                  className="font-medium text-gray-900 hover:text-primary"
                >
                  {item.productName}
                </Link>
                <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatCurrency(item.subtotal)}</p>
                <p className="text-sm text-gray-500">{formatCurrency(item.unitPrice)} each</p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>{formatCurrency(order.shippingCost)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Shipping Address</h2>
        </div>
        <address className="not-italic text-gray-600">
          {order.shippingAddress.street}<br />
          {order.shippingAddress.city}, {order.shippingAddress.region}<br />
          {order.shippingAddress.country}
          {order.shippingAddress.postalCode && ` ${order.shippingAddress.postalCode}`}
          {order.shippingAddress.phone && (
            <>
              <br />
              Phone: {order.shippingAddress.phone}
            </>
          )}
        </address>
      </div>

      {/* Tracking Info */}
      {order.trackingNumber && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="h-5 w-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Tracking Information</h2>
          </div>
          <p className="text-gray-600">
            <span className="font-medium">Carrier:</span> {order.carrier || 'N/A'}
          </p>
          <p className="text-gray-600">
            <span className="font-medium">Tracking Number:</span> {order.trackingNumber}
          </p>
        </div>
      )}

      {/* Cancel Button */}
      {canCancel && (
        <div className="flex justify-end">
          <Button variant="danger" onClick={() => setShowCancelModal(true)}>
            Cancel Order
          </Button>
        </div>
      )}

      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This action cannot be undone."
        confirmText="Cancel Order"
        variant="danger"
        isLoading={isCancelling}
      />
    </div>
  );
}
