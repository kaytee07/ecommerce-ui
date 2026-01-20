'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { OrderHistory, OrderStatus } from '@/types';
import { StatusBadge, EmptyOrders, Skeleton, Select } from '@/components/ui';
import { formatCurrency, formatDate, formatOrderNumber } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'All Orders' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PENDING_PAYMENT', label: 'Awaiting Payment' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderHistory[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (statusFilter) {
      setFilteredOrders(orders.filter((o) => o.status === statusFilter));
    } else {
      setFilteredOrders(orders);
    }
  }, [orders, statusFilter]);

  const fetchOrders = async () => {
    try {
      const response = await apiClient.get<{ status: boolean; data: OrderHistory[]; message: string }>(
        '/store/orders/my'
      );
      // IMPORTANT: Always use fallback to prevent undefined errors
      setOrders(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
        <Select
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-48"
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : !filteredOrders || filteredOrders.length === 0 ? (
          <EmptyOrders />
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-semibold text-gray-900">
                      {formatOrderNumber(order.orderNumber)}
                    </p>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-sm text-gray-500">
                    {formatDate(order.createdAt)} • {order.itemCount} item{order.itemCount > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(order.totalAmount)}
                  </p>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
