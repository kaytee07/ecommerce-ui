'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { apiClient } from '@/lib/api/client';
import { Order, OrderStatus, Product } from '@/types';
import { Button, Badge, Skeleton, ConfirmModal } from '@/components/ui';
import { formatCurrency, formatOrderNumber, cn, getProductThumbnailUrl } from '@/lib/utils';
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  FileText,
  MapPin,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores';
import { getPermissions } from '@/lib/auth/permissions';

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: typeof Clock }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  PROCESSING: { label: 'Processing', color: 'bg-purple-100 text-purple-800', icon: Package },
  SHIPPED: { label: 'Shipped', color: 'bg-green-100 text-green-800', icon: Truck },
  DELIVERED: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  REFUNDED: { label: 'Refunded', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const nextStatusOptions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: ['REFUNDED'],
  REFUNDED: [],
};

export default function AdminOrderDetailPage() {
  const getItemKey = (item: { productId: string; selectedOptions?: Record<string, string> }) =>
    `${item.productId}-${JSON.stringify(item.selectedOptions || {})}`;
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { user } = useAuthStore();
  const permissions = useMemo(
    () => (user ? getPermissions(user.roles) : null),
    [user]
  );
  const lastFetchKeyRef = useRef<string | null>(null);

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusModal, setStatusModal] = useState<{ open: boolean; status: OrderStatus | null }>({
    open: false,
    status: null,
  });
  const [statusReason, setStatusReason] = useState('');
  const [itemImages, setItemImages] = useState<Record<string, string>>({});
  const [usernamesById, setUsernamesById] = useState<Record<string, string>>({});
  const usersFetchedRef = useRef(false);

  const fetchOrder = useCallback(async () => {
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
  }, [orderId]);

  const fetchUsernames = useCallback(async () => {
    if (usersFetchedRef.current) return;
    try {
      const params = new URLSearchParams();
      params.set('size', '1000');
      const response = await apiClient.get(`/admin/users?${params.toString()}`);
      const users = response.data.data?.content || response.data.data || [];
      const map: Record<string, string> = {};
      users.forEach((u: { id?: string; username?: string }) => {
        if (u?.id && u?.username) {
          map[u.id] = u.username;
        }
      });
      setUsernamesById(map);
      usersFetchedRef.current = true;
    } catch (err) {
      console.error('Failed to fetch users for order display', err);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!permissions?.canViewAllOrders) {
      router.push('/admin');
      return;
    }
    const key = `${user.id || user.username || 'user'}:${orderId}`;
    if (lastFetchKeyRef.current === key) return;
    lastFetchKeyRef.current = key;
    fetchOrder();
  }, [orderId, user, permissions?.canViewAllOrders, router, fetchOrder]);

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
          const next = { ...prev };
          results.forEach((result) => {
            if (result?.product) {
              const thumb = getProductThumbnailUrl(result.product);
              if (thumb) {
                next[result.id] = thumb;
              }
            }
          });
          return next;
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

  useEffect(() => {
    if (!order?.userId) return;
    const missingUsername = !usernamesById[order.userId];
    if (missingUsername) {
      fetchUsernames();
    }
  }, [order?.userId, usernamesById, fetchUsernames]);

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

  if (user && !permissions?.canViewAllOrders) {
    return null;
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
  const canUpdateStatus = !!permissions?.canViewAllOrders;
  const canCancel = !!permissions?.canCancelOrders;
  const canFulfill = !!permissions?.canFulfillOrders;
          const canRefund = !!permissions?.canProcessRefunds;

  const availableStatusChanges = (nextStatusOptions[order.status] || []).filter((status) => {
    if (!canUpdateStatus) return false;
    if (status === 'CANCELLED') return canCancel;
    if (status === 'REFUNDED') return canRefund;
    if (['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(status)) return canFulfill;
    return true;
  });
  const orderCode = order.orderNumber || order.orderCode
    ? formatOrderNumber(order.orderNumber || order.orderCode || '')
    : order.id.slice(0, 8).toUpperCase();

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
              Order {orderCode}
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
              {order.items?.map((item) => (
                <div key={getItemKey(item)} className="p-6 flex items-center gap-4">
                  <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-gray-400 text-xs">
                    {itemImages[item.productId] ? (
                      <Image
                        src={itemImages[item.productId]}
                        alt={item.productName}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
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
                    <p className="font-medium text-gray-900">{formatCurrency(item.subtotal)}</p>
                    <p className="text-sm text-gray-500">{formatCurrency(item.priceAtOrder)} each</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

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

          {order.shippingAddress && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <h2 className="font-semibold text-gray-900">Shipping Address</h2>
              </div>
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

              {order.status === 'PROCESSING' && canFulfill && (
                <Button
                  className="w-full"
                  onClick={handleFulfill}
                  isLoading={isUpdating}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Fulfill Order
                </Button>
              )}

              {order.status === 'SHIPPED' && canFulfill && (
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
            <p className="text-gray-600 mb-1">
              {order.customerUsername ||
                order.userUsername ||
                order.customerName ||
                order.guestName ||
                order.guestEmail ||
                usernamesById[order.userId] ||
                order.userId}
            </p>
            {order.guestEmail ? (
              <div className="text-xs text-gray-500 space-y-1">
                {order.guestName && <p>Name: {order.guestName}</p>}
                <p>Email: {order.guestEmail}</p>
                <p>Guest checkout</p>
              </div>
            ) : (
              <Link
                href={`/admin/customers`}
                className="text-sm text-primary hover:underline"
              >
                View Customer
              </Link>
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
              <p>
                <span className="text-gray-500">Order Code:</span>{' '}
                {orderCode}
              </p>
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
