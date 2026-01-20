'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { Button, Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  Bell,
  AlertTriangle,
  Package,
  ShoppingCart,
  CreditCard,
  Users,
  CheckCircle,
  Info,
  X,
  Filter,
  CheckCheck,
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'ORDER_PLACED' | 'PAYMENT_RECEIVED' | 'NEW_CUSTOMER' | 'SYSTEM';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  read: boolean;
  entityId?: string;
  entityType?: string;
  createdAt: string;
}

const typeConfig = {
  LOW_STOCK: { icon: Package, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  OUT_OF_STOCK: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
  ORDER_PLACED: { icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-50' },
  PAYMENT_RECEIVED: { icon: CreditCard, color: 'text-green-500', bg: 'bg-green-50' },
  NEW_CUSTOMER: { icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
  SYSTEM: { icon: Info, color: 'text-gray-500', bg: 'bg-gray-50' },
};

const severityConfig = {
  INFO: { label: 'Info', color: 'bg-blue-100 text-blue-800' },
  WARNING: { label: 'Warning', color: 'bg-yellow-100 text-yellow-800' },
  CRITICAL: { label: 'Critical', color: 'bg-red-100 text-red-800' },
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [typeFilter, severityFilter, showUnreadOnly]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      let endpoint = '/admin/notifications';
      if (showUnreadOnly) {
        endpoint = '/admin/notifications/unread';
      } else if (typeFilter !== 'all') {
        endpoint = `/admin/notifications/type/${typeFilter}`;
      } else if (severityFilter !== 'all') {
        endpoint = `/admin/notifications/severity/${severityFilter}`;
      }
      const response = await apiClient.get(endpoint);
      setNotifications(response.data.data?.content || response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
      // Demo data
      setNotifications([
        {
          id: '1',
          type: 'ORDER_PLACED',
          severity: 'INFO',
          title: 'New Order Received',
          message: 'Order #ORD-2026-001250 has been placed by John Doe',
          read: false,
          entityId: 'ord-1',
          entityType: 'ORDER',
          createdAt: '2026-01-16T10:30:00Z',
        },
        {
          id: '2',
          type: 'LOW_STOCK',
          severity: 'WARNING',
          title: 'Low Stock Alert',
          message: 'Gothic Sweatshirt (Size M) is running low - only 3 items left',
          read: false,
          entityId: 'prod-1',
          entityType: 'PRODUCT',
          createdAt: '2026-01-16T09:15:00Z',
        },
        {
          id: '3',
          type: 'OUT_OF_STOCK',
          severity: 'CRITICAL',
          title: 'Out of Stock',
          message: 'Bone Shaker Tee (Size XL) is now out of stock',
          read: false,
          entityId: 'prod-2',
          entityType: 'PRODUCT',
          createdAt: '2026-01-16T08:45:00Z',
        },
        {
          id: '4',
          type: 'PAYMENT_RECEIVED',
          severity: 'INFO',
          title: 'Payment Confirmed',
          message: 'Payment of GHS 299.99 received for Order #ORD-2026-001248',
          read: true,
          entityId: 'pay-1',
          entityType: 'PAYMENT',
          createdAt: '2026-01-15T16:20:00Z',
        },
        {
          id: '5',
          type: 'NEW_CUSTOMER',
          severity: 'INFO',
          title: 'New Customer Registration',
          message: 'Alice Brown has created a new account',
          read: true,
          entityId: 'user-1',
          entityType: 'USER',
          createdAt: '2026-01-15T14:00:00Z',
        },
        {
          id: '6',
          type: 'SYSTEM',
          severity: 'INFO',
          title: 'System Update',
          message: 'The system has been updated to version 2.1.0',
          read: true,
          createdAt: '2026-01-15T02:00:00Z',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient.post(`/admin/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark as read', err);
      // Demo: update locally
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.post('/admin/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
      // Demo: update locally
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const getEntityLink = (notification: Notification) => {
    if (!notification.entityType || !notification.entityId) return null;
    switch (notification.entityType) {
      case 'ORDER':
        return `/admin/orders`;
      case 'PRODUCT':
        return `/admin/products`;
      case 'PAYMENT':
        return `/admin/payments`;
      case 'USER':
        return `/admin/customers`;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (showUnreadOnly && n.read) return false;
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    if (severityFilter !== 'all' && n.severity !== severityFilter) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-1 bg-primary text-white text-xs rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          >
            <option value="all">All Types</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
            <option value="ORDER_PLACED">Orders</option>
            <option value="PAYMENT_RECEIVED">Payments</option>
            <option value="NEW_CUSTOMER">Customers</option>
            <option value="SYSTEM">System</option>
          </select>
        </div>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
        >
          <option value="all">All Severity</option>
          <option value="INFO">Info</option>
          <option value="WARNING">Warning</option>
          <option value="CRITICAL">Critical</option>
        </select>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showUnreadOnly}
            onChange={(e) => setShowUnreadOnly(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm text-gray-700">Unread only</span>
        </label>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500">
              {showUnreadOnly
                ? "You've read all your notifications"
                : 'No notifications to display'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const config = typeConfig[notification.type];
            const Icon = config.icon;
            const link = getEntityLink(notification);

            return (
              <div
                key={notification.id}
                className={cn(
                  'bg-white rounded-lg border p-4 transition-all',
                  notification.read
                    ? 'border-gray-200'
                    : 'border-primary/30 bg-primary/5'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn('p-2 rounded-lg', config.bg)}>
                    <Icon className={cn('h-5 w-5', config.color)} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">{notification.title}</h3>
                          <span
                            className={cn(
                              'px-2 py-0.5 text-xs rounded-full',
                              severityConfig[notification.severity].color
                            )}
                          >
                            {severityConfig[notification.severity].label}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">{notification.message}</p>
                        <p className="text-gray-400 text-xs mt-2">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {link && (
                          <Link
                            href={link}
                            className="px-3 py-1 text-sm text-primary hover:bg-primary/10 rounded-lg"
                          >
                            View
                          </Link>
                        )}
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100"
                            title="Mark as read"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
