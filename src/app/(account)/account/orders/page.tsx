'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import Image from 'next/image';
import { StatusBadge, EmptyOrders, Skeleton, Select } from '@/components/ui';
import { formatCurrency, formatDate, getProductThumbnailUrl } from '@/lib/utils';
import { OrderHistory, OrderStatus, Product } from '@/types';
import { ChevronRight } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'All Orders' },
  { value: 'PENDING', label: 'Pending' },
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
  const [itemImages, setItemImages] = useState<Record<string, string>>({});

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

  useEffect(() => {
    if (!orders || orders.length === 0) return;
    const missingIds = orders
      .map((order) => order.previewProductId)
      .filter((id): id is string => !!id && !itemImages[id]);
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
  }, [orders, itemImages]);

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
        <Select
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-48"
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
                className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="relative w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-gray-400 text-xs">
                    {order.previewProductId && itemImages[order.previewProductId] ? (
                      <Image
                        src={itemImages[order.previewProductId]}
                        alt={order.previewProductName || 'Order item'}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      'No Image'
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 truncate">
                        {order.statusDisplayName || order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {formatDate(order.createdAt)} • {order.itemCount} item{order.itemCount > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
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
