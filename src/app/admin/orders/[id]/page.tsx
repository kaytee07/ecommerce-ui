'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { apiClient } from '@/lib/api/client';
import { Order, OrderStatus } from '@/types';
import { Button, Badge, Skeleton, ConfirmModal } from '@/components/ui';
import { formatCurrency, cn } from '@/lib/utils';
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  MapPin,
  User,
  Calendar,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: typeof Clock }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  PENDING_PAYMENT: { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-800', icon: CreditCard },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  PROCESSING: { label: 'Processing', color: 'bg-purple-100 text-purple-800', icon: Package },
  SHIPPED: { label: 'Shipped', color: 'bg-green-100 text-green-800', icon: Truck },
  DELIVERED: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  REFUNDED: { label: 'Refunded', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const nextStatusOptions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  PENDING_PAYMENT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: ['REFUNDED'],
  REFUNDED: [],
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusModal, setStatusModal] = useState<{ open: boolean; status: OrderStatus | null }>({
    open: false,
    status: null,
  });
  const [statusReason, setStatusReason] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<{ status: boolean; data: Order; message: string }>(
        `/admin/orders/${orderId}`
      );
      setOrder(response.data.data);
    } catch (err) {
      console.error('Failed to fetch order', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!statusModal.status || !order) return;
    setIsUpdating(true);
    try {
      const response = await apiClient.put<{ status: boolean; data: Order; message: string }>(
        `/admin/orders/${orderId}/status`,
        {
          status: statusModal.status,
          reason: statusReason || undefined,
        }
      );
      setOrder(response.data.data);
      setStatusModal({ open: false, status: null });
      setStatusReason('');
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFulfill = async () => {
    if (!order) return;
    setIsUpdating(true);
    try {
      const response = await apiClient.put<{ status: boolean; data: Order; message: string }>(
        `/admin/orders/${orderId}/fulfill`
      );
      setOrder(response.data.data);
    } catch (err) {
      console.error('Failed to fulfill order', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeliver = async () => {
    if (!order) return;
    setIsUpdating(true);
    try {
      const response = await apiClient.put<{ status: boolean; data: Order; message: string }>(
        `/admin/orders/${orderId}/deliver`
      );
      setOrder(response.data.data);
    } catch (err) {
      console.error('Failed to mark as delivered', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
        <p className="text-gray-500 mb-4">The order you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/admin/orders">
          <Button>Back to Orders</Button>
        </Link>
      </div>
    );
  }

  const StatusIcon = statusConfig[order.status]?.icon || Clock;
  const availableStatusChanges = nextStatusOptions[order.status] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Order #{order.orderNumber || order.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-sm text-gray-500">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
        <Badge className={cn('text-sm px-3 py-1', statusConfig[order.status]?.color)}>
          <StatusIcon className="h-4 w-4 mr-1" />
          {statusConfig[order.status]?.label || order.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Order Items ({order.itemCount})</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {order.items?.map((item, index) => (
                <div key={index} className="p-6 flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(item.subtotal)}</p>
                    <p className="text-sm text-gray-500">{formatCurrency(item.unitPrice)} each</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Shipping</span>
                <span>{formatCurrency(order.shippingCost || 0)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Order Timeline</h2>
              <div className="space-y-4">
                {order.statusHistory.map((history, index) => {
                  const config = statusConfig[history.status];
                  const HistoryIcon = config?.icon || Clock;
                  return (
                    <div key={index} className="flex items-start gap-4">
                      <div className={cn('p-2 rounded-full', config?.color?.replace('text-', 'bg-').replace('800', '100'))}>
                        <HistoryIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{config?.label || history.status}</p>
                        {history.reason && (
                          <p className="text-sm text-gray-500">{history.reason}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(history.changedAt)}
                          {history.changedBy && ` by ${history.changedBy}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <h2 className="font-semibold text-gray-900">Order Notes</h2>
              </div>
              <p className="text-gray-600">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="space-y-3">
              {availableStatusChanges.map((status) => (
                <Button
                  key={status}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setStatusModal({ open: true, status })}
                  disabled={isUpdating}
                >
                  {status === 'CONFIRMED' && 'Confirm Order'}
                  {status === 'PROCESSING' && 'Start Processing'}
                  {status === 'SHIPPED' && 'Mark as Shipped'}
                  {status === 'DELIVERED' && 'Mark as Delivered'}
                  {status === 'CANCELLED' && 'Cancel Order'}
                  {status === 'REFUNDED' && 'Issue Refund'}
                </Button>
              ))}

              {order.status === 'PROCESSING' && (
                <Button
                  className="w-full"
                  onClick={handleFulfill}
                  isLoading={isUpdating}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Fulfill Order
                </Button>
              )}

              {order.status === 'SHIPPED' && (
                <Button
                  className="w-full"
                  onClick={handleDeliver}
                  isLoading={isUpdating}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Delivered
                </Button>
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Customer</h2>
            </div>
            <p className="text-gray-600 mb-1">User ID: {order.userId?.slice(0, 8)}...</p>
            <Link
              href={`/admin/customers`}
              className="text-sm text-primary hover:underline"
            >
              View Customer
            </Link>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-gray-400" />
                <h2 className="font-semibold text-gray-900">Shipping Address</h2>
              </div>
              <div className="text-gray-600 space-y-1">
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.region}</p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.postalCode && (
                  <p>{order.shippingAddress.postalCode}</p>
                )}
                {order.shippingAddress.phone && (
                  <p className="pt-2">{order.shippingAddress.phone}</p>
                )}
              </div>
            </div>
          )}

          {/* Payment Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Payment</h2>
            </div>
            <p className="text-gray-600">Method: {order.paymentMethod || 'N/A'}</p>
            {order.trackingNumber && (
              <p className="text-gray-600 mt-2">Tracking: {order.trackingNumber}</p>
            )}
            {order.carrier && (
              <p className="text-gray-600">Carrier: {order.carrier}</p>
            )}
          </div>

          {/* Order Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Order Info</h2>
            </div>
            <div className="text-sm text-gray-600 space-y-2">
              <p><span className="text-gray-500">Created:</span> {formatDate(order.createdAt)}</p>
              <p><span className="text-gray-500">Updated:</span> {formatDate(order.updatedAt)}</p>
              <p><span className="text-gray-500">Order ID:</span> {order.id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      <ConfirmModal
        isOpen={statusModal.open}
        onClose={() => {
          setStatusModal({ open: false, status: null });
          setStatusReason('');
        }}
        onConfirm={handleUpdateStatus}
        title={`Update Order Status`}
        message={
          <div className="space-y-4">
            <p>
              Are you sure you want to change the order status to{' '}
              <strong>{statusModal.status ? statusConfig[statusModal.status]?.label : ''}</strong>?
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason (optional)
              </label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={3}
                placeholder="Enter a reason for this status change..."
              />
            </div>
          </div>
        }
        confirmText="Update Status"
        isLoading={isUpdating}
      />
    </div>
  );
}
