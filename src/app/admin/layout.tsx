'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/lib/stores';
import { isAdmin, getPermissions } from '@/lib/auth/permissions';
import { apiClient } from '@/lib/api/client';
import { NotificationSummary } from '@/types';
import { FullPageSpinner } from '@/components/ui';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Warehouse,
  CreditCard,
  Users,
  BarChart3,
  Bell,
  ClipboardList,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Settings,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, permission: null },
  { href: '/admin/products', label: 'Products', icon: Package, permission: 'canViewAdminProducts' },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree, permission: 'canManageCategories' },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart, permission: 'canViewAllOrders' },
  { href: '/admin/inventory', label: 'Inventory', icon: Warehouse, permission: 'canViewInventory' },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard, permission: 'canViewPayments' },
  { href: '/admin/customers', label: 'Customers', icon: Users, permission: 'canViewUsers' },
  { href: '/admin/storefront', label: 'Storefront', icon: ImageIcon, permission: 'canManageStorefront' },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, permission: 'canViewAnalytics' },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell, permission: 'canViewNotifications' },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: ClipboardList, permission: 'canViewAuditLogs' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationSummary, setNotificationSummary] = useState<NotificationSummary | null>(null);

  useEffect(() => {
    // Call checkAuth only once on mount
    useAuthStore.getState().checkAuth();
  }, []); // Empty dependency array - only run once

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await apiClient.get<{ status: boolean; data: NotificationSummary }>(
          '/admin/notifications/summary'
        );
        setNotificationSummary(response.data.data || null);
      } catch {
        setNotificationSummary(null);
      }
    };
    if (isAuthenticated) {
      fetchSummary();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login?redirect=/admin');
      } else if (user && !isAdmin(user.roles)) {
        router.push('/');
      }
    }
  }, [isLoading, isAuthenticated, user]);

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (!isAuthenticated || !user || !isAdmin(user.roles)) {
    return null;
  }

  const permissions = getPermissions(user.roles);

  const filteredNavItems = navItems.filter((item) => {
    if (!item.permission) return true;
    return permissions[item.permission as keyof typeof permissions];
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-primary text-white transform transition-transform duration-200 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          <Link href="/admin" className="flex items-center">
            <Image
              src="/weblogo.png"
              alt="World Genius"
              width={120}
              height={32}
              className="h-8 w-auto brightness-0 invert"
            />
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

            const unreadCount = item.href === '/admin/notifications'
              ? notificationSummary?.totalUnread || 0
              : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  isActive ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1">{item.label}</span>
                {unreadCount > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 text-xs rounded-full bg-white text-primary flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Back to Store */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 text-white/70 hover:text-white transition-colors"
          >
            <Settings className="h-5 w-5" />
            Back to Store
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:text-primary"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex-1" />

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {user.fullName?.charAt(0) || 'A'}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {user.fullName}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <Link
                      href="/account"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Account Settings
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-error hover:bg-gray-50"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
