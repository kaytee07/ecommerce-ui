'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { Notification, NotificationSeverity, NotificationType } from '@/types';
import { Button, Skeleton, Input } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  Bell,
  AlertTriangle,
  Package,
  ShoppingCart,
  CreditCard,
  CheckCircle,
  Info,
  XCircle,
  X,
  Filter,
  CheckCheck,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores';
import { getPermissions } from '@/lib/auth/permissions';

const typeConfig = {
  LOW_STOCK: { icon: Package, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  OUT_OF_STOCK: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
  ORDER_PLACED: { icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-50' },
  ORDER_CANCELLED: { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-100' },
  PAYMENT_FAILED: { icon: CreditCard, color: 'text-red-500', bg: 'bg-red-50' },
  ANNOUNCEMENT: { icon: Info, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  SYSTEM_ALERT: { icon: AlertTriangle, color: 'text-gray-500', bg: 'bg-gray-50' },
  INVENTORY_ADJUSTMENT: { icon: Package, color: 'text-blue-500', bg: 'bg-blue-50' },
};

const severityConfig = {
  INFO: { label: 'Info', color: 'bg-blue-100 text-blue-800' },
  WARNING: { label: 'Warning', color: 'bg-yellow-100 text-yellow-800' },
  CRITICAL: { label: 'Critical', color: 'bg-red-100 text-red-800' },
};

export default function AdminNotificationsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const permissions = useMemo(
    () => (user ? getPermissions(user.roles) : null),
    [user?.roles?.join('|')]
  );
  const lastFetchKeyRef = useRef<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<NotificationSeverity | 'all'>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [isSendingAnnouncement, setIsSendingAnnouncement] = useState(false);
  const [announcementStatus, setAnnouncementStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'notifications' | 'announcements'>('notifications');

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setActionError(null);
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
      setNotifications([]);
      setActionError('Failed to load notifications.');
    } finally {
      setIsLoading(false);
    }
  }, [showUnreadOnly, typeFilter, severityFilter]);

  useEffect(() => {
    if (!user) return;
    if (!permissions?.canViewNotifications) {
      router.push('/admin');
      return;
    }
    const key = `${user.id || user.username || 'user'}:${typeFilter}:${severityFilter}:${showUnreadOnly ? 'unread' : 'all'}`;
    if (lastFetchKeyRef.current === key) return;
    lastFetchKeyRef.current = key;
    fetchNotifications();
  }, [typeFilter, severityFilter, showUnreadOnly, user, permissions?.canViewNotifications, router, fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    setActionError(null);
    try {
      await apiClient.post(`/admin/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark as read', err);
      setActionError('Failed to mark notification as read.');
    }
  };

  const handleMarkAllAsRead = async () => {
    setActionError(null);
    try {
      await apiClient.post('/admin/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
      setActionError('Failed to mark all notifications as read.');
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementMessage.trim()) {
      setAnnouncementStatus('Title and message are required.');
      return;
    }
    setIsSendingAnnouncement(true);
    setAnnouncementStatus(null);
    try {
      const response = await apiClient.post('/admin/notifications/announcements', {
        title: announcementTitle.trim(),
        message: announcementMessage.trim(),
      });
      const queued = response.data.data?.emailsQueued;
      setAnnouncementStatus(
        typeof queued === 'number'
          ? `Announcement queued for ${queued} customers.`
          : 'Announcement queued successfully.'
      );
      setAnnouncementTitle('');
      setAnnouncementMessage('');
    } catch (err) {
      console.error('Failed to send announcement', err);
      setAnnouncementStatus('Failed to send announcement.');
    } finally {
      setIsSendingAnnouncement(false);
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

  if (user && !permissions?.canViewNotifications) {
    return null;
  }

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

      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium',
            activeTab === 'notifications'
              ? 'bg-primary text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          )}
        >
          Notifications
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('announcements')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium',
            activeTab === 'announcements'
              ? 'bg-primary text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          )}
        >
          Broadcast Announcement
        </button>
      </div>

      {activeTab === 'announcements' && permissions?.canSendAnnouncements && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Broadcast Announcement</h2>
            <p className="text-sm text-gray-500">Send an email announcement to all customers.</p>
          </div>
          <div className="grid gap-4">
            <Input
              label="Title"
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
              placeholder="Announcement title"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <textarea
                value={announcementMessage}
                onChange={(e) => setAnnouncementMessage(e.target.value)}
                placeholder="Write your announcement message..."
                className="w-full min-h-[120px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            {announcementStatus && (
              <div className="text-sm text-gray-600">{announcementStatus}</div>
            )}
            <Button onClick={handleSendAnnouncement} disabled={isSendingAnnouncement}>
              {isSendingAnnouncement ? 'Sending...' : 'Send Announcement'}
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'announcements' && !permissions?.canSendAnnouncements && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
          You do not have permission to send announcements.
        </div>
      )}

      {activeTab === 'notifications' && (
        <>
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
            <option value="ORDER_PLACED">Order Placed</option>
            <option value="ORDER_CANCELLED">Order Cancelled</option>
            <option value="PAYMENT_FAILED">Payment Failed</option>
            <option value="ANNOUNCEMENT">Announcement</option>
            <option value="SYSTEM_ALERT">System Alert</option>
            <option value="INVENTORY_ADJUSTMENT">Inventory Adjustment</option>
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
            const config = typeConfig[notification.type] || {
              icon: Info,
              color: 'text-gray-500',
              bg: 'bg-gray-50',
            };
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
        </>
      )}
    </div>
  );
}
