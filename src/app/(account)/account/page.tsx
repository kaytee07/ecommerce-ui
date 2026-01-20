'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores';
import { apiClient } from '@/lib/api/client';
import { OrderHistory } from '@/types';
import { StatusBadge, Skeleton } from '@/components/ui';
import { formatCurrency, formatDate, formatOrderNumber } from '@/lib/utils';
import { Package, ArrowRight, ShoppingBag, CreditCard } from 'lucide-react';

export default function AccountOverviewPage() {
  const { user } = useAuthStore();
  const [recentOrders, setRecentOrders] = useState<OrderHistory[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await apiClient.get<{ status: boolean; data: OrderHistory[]; message: string }>(
        '/store/orders/my'
      );
      // IMPORTANT: Always use fallback to prevent undefined errors
      const orders = response.data.data || [];
      setRecentOrders(orders.slice(0, 3));
      setStats({
        total: orders.length,
        pending: orders.filter((o) => ['PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'PROCESSING'].includes(o.status)).length,
      });
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.fullName?.split(' ')[0]}!</h1>
        <p className="text-gray-500">Here&apos;s what&apos;s happening with your account.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-info-bg rounded-lg">
              <Package className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Orders</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning-bg rounded-lg">
              <ShoppingBag className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-sm text-gray-500">In Progress</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Recent Orders</h2>
          <Link href="/account/orders" className="text-sm text-primary hover:underline flex items-center">
            View all <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !recentOrders || recentOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No orders yet</p>
            <Link href="/products" className="text-primary hover:underline text-sm mt-2 inline-block">
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    Order {formatOrderNumber(order.orderNumber)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(order.createdAt)} • {order.itemCount} items
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={order.status} />
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(order.totalAmount)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/products"
          className="bg-white rounded-lg border border-gray-200 p-6 hover:border-primary transition-colors"
        >
          <ShoppingBag className="h-8 w-8 text-primary mb-3" />
          <h3 className="font-semibold text-gray-900">Shop Now</h3>
          <p className="text-sm text-gray-500">Browse our latest products</p>
        </Link>

        <Link
          href="/account/profile"
          className="bg-white rounded-lg border border-gray-200 p-6 hover:border-primary transition-colors"
        >
          <CreditCard className="h-8 w-8 text-primary mb-3" />
          <h3 className="font-semibold text-gray-900">Account Settings</h3>
          <p className="text-sm text-gray-500">Update your profile</p>
        </Link>
      </div>
    </div>
  );
}
