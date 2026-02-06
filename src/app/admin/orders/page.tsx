'use client';

import { useEffect, useState, Suspense, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { Order, OrderStatus } from '@/types';
import { StatusBadge, Skeleton, Select } from '@/components/ui';
import { formatCurrency, formatDate, formatOrderNumber } from '@/lib/utils';
import { ChevronRight, Eye } from 'lucide-react';
import { useAuthStore } from '@/lib/stores';
import { getPermissions } from '@/lib/auth/permissions';

const STATUS_OPTIONS = [
  { value: '', label: 'All Orders' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'REFUNDED', label: 'Refunded' },
];

function OrdersContent() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status') || '';
  const router = useRouter();
  const { user } = useAuthStore();
  const permissions = useMemo(
    () => (user ? getPermissions(user.roles) : null),
    [user]
  );
  const lastFetchKeyRef = useRef<string | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState(statusParam);
  const [isLoading, setIsLoading] = useState(true);
  const [usernamesById, setUsernamesById] = useState<Record<string, string>>({});
  const usersFetchedRef = useRef(false);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const endpoint = statusFilter
        ? `/admin/orders/status/${statusFilter}`
        : '/admin/orders';
      const response = await apiClient.get<{ status: boolean; data: Order[]; message: string }>(
        `${endpoint}?size=50`
      );
      setOrders(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch orders', err);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

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
    const hasMissingUsernames = orders.some(
      (order) => order.userId && !usernamesById[order.userId]
    );
    if (hasMissingUsernames) {
      fetchUsernames();
    }
  }, [orders, usernamesById, fetchUsernames]);

  useEffect(() => {
    if (!user) return;
    if (!permissions?.canViewAllOrders) {
      router.push('/admin');
      return;
    }
    const key = `${user.id || user.username || 'user'}:${statusFilter || 'all'}`;
    if (lastFetchKeyRef.current === key) return;
    lastFetchKeyRef.current = key;
    fetchOrders();
  }, [statusFilter, user, permissions?.canViewAllOrders, router, fetchOrders]);

  if (user && !permissions?.canViewAllOrders) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <Select
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-48"
        />
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-6 py-4">
                      <Skeleton className="h-12 w-full" />
                    </td>
                  </tr>
                ))
              ) : !orders || orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const orderCode = order.orderNumber || order.orderCode
                    ? formatOrderNumber(order.orderNumber || order.orderCode || '')
                    : order.id.slice(0, 8).toUpperCase();
                  const customerLabel =
                    order.customerUsername ||
                    order.userUsername ||
                    order.customerName ||
                    order.guestName ||
                    order.guestEmail ||
                    usernamesById[order.userId] ||
                    order.userId;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          {orderCode}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {customerLabel}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {order.itemCount} item{order.itemCount > 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center text-primary hover:underline text-sm"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="space-y-6"><Skeleton className="h-96 w-full" /></div>}>
      <OrdersContent />
    </Suspense>
  );
}
