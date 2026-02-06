'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { DashboardData, OrderHistory } from '@/types';
import { StatusBadge, Skeleton, Card, CardHeader, CardContent } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores';
import { getPermissions } from '@/lib/auth/permissions';

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const permissions = useMemo(
    () => (user ? getPermissions(user.roles) : null),
    [user]
  );
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const requests: Array<Promise<unknown>> = [];
      const shouldFetchAnalytics = !!permissions?.canViewAnalytics;
      const shouldFetchOrders = !!permissions?.canViewAllOrders;

      if (shouldFetchAnalytics) {
        requests.push(
          apiClient.get<{ status: boolean; data: DashboardData; message: string }>(
            '/admin/analytics/dashboard'
          )
        );
      }
      if (shouldFetchOrders) {
        requests.push(
          apiClient.get<{ status: boolean; data: OrderHistory[]; message: string }>(
            '/admin/orders?size=5'
          )
        );
      }

      const results = await Promise.all(requests);
      let resultIndex = 0;
      if (shouldFetchAnalytics) {
        const dashboardRes = results[resultIndex] as { data: { data: DashboardData } };
        setDashboard(dashboardRes.data.data);
        resultIndex += 1;
      } else {
        setDashboard(null);
      }

      if (shouldFetchOrders) {
        const ordersRes = results[resultIndex] as { data: { data: OrderHistory[] } };
        const ordersPayload = ordersRes.data.data as unknown as { content?: OrderHistory[] };
        setRecentOrders(ordersPayload?.content || ordersRes.data.data || []);
      } else {
        setRecentOrders([]);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
      setRecentOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [permissions?.canViewAnalytics, permissions?.canViewAllOrders]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full rounded-lg" />
          <Skeleton className="h-80 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Revenue (30d)',
      value: formatCurrency(dashboard?.monthRevenue || 0),
      icon: DollarSign,
      color: 'bg-green-500',
      href: '/admin/analytics',
    },
    {
      label: 'Total Orders',
      value: (dashboard?.salesFunnel?.orderCount ?? 0).toLocaleString(),
      icon: ShoppingCart,
      color: 'bg-blue-500',
      href: '/admin/orders',
    },
    {
      label: 'Pending Orders',
      value: (dashboard?.salesFunnel?.pendingOrders ?? 0).toLocaleString(),
      icon: Package,
      color: 'bg-yellow-500',
      href: '/admin/orders?status=PENDING',
    },
    {
      label: 'Low Stock Items',
      value: (dashboard?.lowStockAlerts?.length ?? 0).toLocaleString(),
      icon: AlertTriangle,
      color: 'bg-red-500',
      href: '/admin/inventory?lowStock=true',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Last updated: {dashboard?.generatedAt ? formatDate(dashboard.generatedAt) : 'N/A'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card hover className="h-full">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500 truncate">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1 truncate">{stat.value}</p>
                  </div>
                  <div className={cn('p-3 rounded-full text-white shrink-0', stat.color)}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm text-primary hover:underline flex items-center">
              View all <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </CardHeader>
          <div className="divide-y divide-gray-200">
            {recentOrders.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No orders yet</div>
            ) : (
              recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={order.status} />
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="font-semibold text-gray-900">Top Products</h2>
            <Link href="/admin/analytics" className="text-sm text-primary hover:underline flex items-center">
              View analytics <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </CardHeader>
          <div className="divide-y divide-gray-200">
            {!dashboard?.topProducts || dashboard.topProducts.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No data available</div>
            ) : (
              dashboard.topProducts.slice(0, 5).map((product, index) => (
                <div key={product.productId} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                      {index + 1}
                    </span>
                    <p className="font-medium text-gray-900 line-clamp-1">{product.productName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{product.totalSold} sold</p>
                    <p className="text-sm text-gray-500">{formatCurrency(product.totalRevenue)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {dashboard && (dashboard.lowStockAlerts?.length ?? 0) > 0 && (
        <Card className="border-warning bg-warning-bg/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-warning rounded-full text-white">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Low Stock Alert</h3>
                <p className="text-gray-600">
                  {(dashboard.lowStockAlerts?.length ?? 0)} product{(dashboard.lowStockAlerts?.length ?? 0) > 1 ? 's' : ''} are running low on stock
                </p>
              </div>
              <Link
                href="/admin/inventory?lowStock=true"
                className="px-4 py-2 bg-warning text-white rounded-lg hover:bg-warning/90 transition-colors"
              >
                View Items
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
