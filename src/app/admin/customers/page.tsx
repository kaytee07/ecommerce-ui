'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores';
import { Button, Skeleton } from '@/components/ui';
import { formatCurrency, cn } from '@/lib/utils';
import {
  Users,
  Search,
  Eye,
  X,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Calendar,
  Shield,
  UserCog,
  Check,
} from 'lucide-react';
import { getPermissions } from '@/lib/auth/permissions';

const AVAILABLE_ROLES = [
  { value: 'ROLE_USER', label: 'Customer', description: 'Regular customer account' },
  { value: 'ROLE_ADMIN', label: 'Admin', description: 'Can manage users and admin operations' },
  { value: 'ROLE_SUPPORT_AGENT', label: 'Support Agent', description: 'Can view and help with customer issues' },
  { value: 'ROLE_WAREHOUSE', label: 'Warehouse', description: 'Can manage inventory and fulfill orders' },
  { value: 'ROLE_CONTENT_MANAGER', label: 'Content Manager', description: 'Can manage products and categories' },
  { value: 'ROLE_SUPER_ADMIN', label: 'Super Admin', description: 'Full access to all features' },
];

interface Customer {
  id: string;
  username?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  roles?: string[];
  emailVerified?: boolean;
  totalOrders?: number;
  totalSpent?: number;
  createdAt?: string;
  lastOrderAt?: string;
}

export default function AdminCustomersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const permissions = useMemo(
    () => (user ? getPermissions(user.roles) : null),
    [user]
  );
  const lastFetchKeyRef = useRef<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Role assignment state (SUPER_ADMIN only)
  const [roleModalCustomer, setRoleModalCustomer] = useState<Customer | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isAssigningRoles, setIsAssigningRoles] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  // Check if current user is SUPER_ADMIN
  const isSuperAdmin = user?.roles?.includes('ROLE_SUPER_ADMIN');

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/admin/users');
      setCustomers(response.data.data?.content || response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch customers', err);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!permissions?.canViewUsers) {
      router.push('/admin');
      return;
    }
    const key = `${user.id || user.username || 'user'}`;
    if (lastFetchKeyRef.current === key) return;
    lastFetchKeyRef.current = key;
    fetchCustomers();
  }, [user, permissions?.canViewUsers, router, fetchCustomers]);

  // Open role assignment modal
  const openRoleModal = (customer: Customer) => {
    setRoleModalCustomer(customer);
    setSelectedRoles(customer.roles && customer.roles.length > 0 ? customer.roles : ['ROLE_USER']);
    setRoleError(null);
  };

  // Toggle role selection
  const toggleRole = (role: string) => {
    setSelectedRoles((prev) => {
      if (prev.includes(role)) {
        // Don't allow removing all roles - must have at least ROLE_USER
        const newRoles = prev.filter((r) => r !== role);
        return newRoles.length === 0 ? ['ROLE_USER'] : newRoles;
      }
      return [...prev, role];
    });
  };

  // Assign roles to user
  const assignRoles = async () => {
    if (!roleModalCustomer) return;

    setIsAssigningRoles(true);
    setRoleError(null);

    try {
      await apiClient.post(`/admin/users/${roleModalCustomer.id}/roles`, {
        roles: selectedRoles,
      });

      // Update customer in local state
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === roleModalCustomer.id ? { ...c, roles: selectedRoles } : c
        )
      );

      // Update selected customer if viewing details
      if (selectedCustomer?.id === roleModalCustomer.id) {
        setSelectedCustomer({ ...selectedCustomer, roles: selectedRoles });
      }

      setRoleModalCustomer(null);
    } catch (err: unknown) {
      console.error('Failed to assign roles', err);
      const error = err as { response?: { data?: { message?: string } } };
      setRoleError(error.response?.data?.message || 'Failed to assign roles. Please try again.');
    } finally {
      setIsAssigningRoles(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      (c.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.username || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getRoleBadge = (roles: string[] | undefined) => {
    if (!roles || roles.length === 0) {
      return { label: 'User', color: 'bg-gray-100 text-gray-800' };
    }
    if (roles.includes('ROLE_SUPER_ADMIN')) {
      return { label: 'Super Admin', color: 'bg-purple-100 text-purple-800' };
    }
    if (roles.includes('ROLE_CONTENT_MANAGER')) {
      return { label: 'Content Manager', color: 'bg-blue-100 text-blue-800' };
    }
    if (roles.includes('ROLE_WAREHOUSE')) {
      return { label: 'Warehouse', color: 'bg-orange-100 text-orange-800' };
    }
    if (roles.includes('ROLE_SUPPORT_AGENT')) {
      return { label: 'Support', color: 'bg-green-100 text-green-800' };
    }
    return { label: 'Customer', color: 'bg-gray-100 text-gray-800' };
  };

  if (user && !permissions?.canViewUsers) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full mb-2" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <div className="text-sm text-gray-500">
          {customers.length} total customers
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email, or username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Customer Details</h2>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-semibold">
                {(selectedCustomer.fullName || selectedCustomer.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-semibold">{selectedCustomer.fullName || selectedCustomer.username || 'Unknown'}</h3>
                <p className="text-gray-500">@{selectedCustomer.username}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                <Mail className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <span>{selectedCustomer.email || '-'}</span>
                  {selectedCustomer.emailVerified === true ? (
                    <span className="ml-2 text-xs text-green-600">(Verified)</span>
                  ) : selectedCustomer.emailVerified === false ? (
                    <span className="ml-2 text-xs text-yellow-600">(Unverified)</span>
                  ) : null}
                </div>
              </div>

              {selectedCustomer.phone && (
                <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <span>{selectedCustomer.phone}</span>
                </div>
              )}

              <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                <Shield className="h-5 w-5 text-gray-400" />
                <span
                  className={cn(
                    'px-2 py-1 text-xs rounded-full',
                    getRoleBadge(selectedCustomer.roles).color
                  )}
                >
                  {getRoleBadge(selectedCustomer.roles).label}
                </span>
              </div>

              <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                <ShoppingBag className="h-5 w-5 text-gray-400" />
                <div>
                  <span className="font-medium">{selectedCustomer.totalOrders ?? 0}</span>
                  <span className="text-gray-500 ml-1">orders</span>
                  <span className="mx-2 text-gray-300">|</span>
                  <span className="font-medium">{formatCurrency(selectedCustomer.totalSpent ?? 0)}</span>
                  <span className="text-gray-500 ml-1">total spent</span>
                </div>
              </div>

              <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <span className="text-gray-500">Joined </span>
                  <span>{formatDate(selectedCustomer.createdAt)}</span>
                </div>
              </div>

              {selectedCustomer.lastOrderAt && (
                <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                  <ShoppingBag className="h-5 w-5 text-gray-400" />
                  <div>
                    <span className="text-gray-500">Last order </span>
                    <span>{formatDate(selectedCustomer.lastOrderAt)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              {isSuperAdmin && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCustomer(null);
                    openRoleModal(selectedCustomer);
                  }}
                  className="flex-1"
                >
                  <UserCog className="h-4 w-4 mr-2" />
                  Manage Roles
                </Button>
              )}
              <Button variant="outline" onClick={() => setSelectedCustomer(null)} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Role Assignment Modal (SUPER_ADMIN only) */}
      {roleModalCustomer && isSuperAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Manage Roles</h2>
              <button
                onClick={() => setRoleModalCustomer(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-1">Assigning roles to:</p>
              <p className="font-medium">{roleModalCustomer.fullName || roleModalCustomer.username || 'Unknown'}</p>
              <p className="text-sm text-gray-500">{roleModalCustomer.email || '-'}</p>
            </div>

            {roleError && (
              <div className="mb-4 p-3 bg-error-bg text-error rounded-lg text-sm">
                {roleError}
              </div>
            )}

            <div className="space-y-3 mb-6">
              {AVAILABLE_ROLES.map((role) => (
                <label
                  key={role.value}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    selectedRoles.includes(role.value)
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="pt-0.5">
                    <div
                      className={cn(
                        'w-5 h-5 rounded border flex items-center justify-center',
                        selectedRoles.includes(role.value)
                          ? 'bg-primary border-primary text-white'
                          : 'border-gray-300'
                      )}
                    >
                      {selectedRoles.includes(role.value) && (
                        <Check className="h-3 w-3" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role.value)}
                      onChange={() => toggleRole(role.value)}
                      className="sr-only"
                    />
                    <p className="font-medium text-sm">{role.label}</p>
                    <p className="text-xs text-gray-500">{role.description}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setRoleModalCustomer(null)}
                className="flex-1"
                disabled={isAssigningRoles}
              >
                Cancel
              </Button>
              <Button
                onClick={assignRoles}
                className="flex-1"
                isLoading={isAssigningRoles}
              >
                Save Roles
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Customers Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No customers found</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const roleBadge = getRoleBadge(customer.roles);
                  return (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-medium">
                            {(customer.fullName || customer.username || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{customer.fullName || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">@{customer.username || 'unknown'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{customer.email || '-'}</span>
                          {customer.emailVerified && (
                            <span className="text-green-500" title="Verified">
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-medium">{customer.totalOrders ?? 0}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {formatCurrency(customer.totalSpent ?? 0)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn('px-2 py-1 text-xs rounded-full', roleBadge.color)}>
                          {roleBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-500">
                        {formatDate(customer.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedCustomer(customer)}
                            className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {isSuperAdmin && (
                            <button
                              onClick={() => openRoleModal(customer)}
                              className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100"
                              title="Manage roles"
                            >
                              <UserCog className="h-4 w-4" />
                            </button>
                          )}
                        </div>
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
