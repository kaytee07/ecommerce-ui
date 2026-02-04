'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { Button, Skeleton } from '@/components/ui';
import { formatCurrency, formatOrderNumber, cn } from '@/lib/utils';
import {
  CreditCard,
  Search,
  Filter,
  Eye,
  RefreshCcw,
  X,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores';
import { getPermissions } from '@/lib/auth/permissions';

interface Payment {
  id: string;
  orderId: string;
  orderNumber?: string;
  orderCode?: string;
  userId: string;
  customerUsername?: string;
  customerName?: string;
  amount: number;
  currency: string;
  gateway: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  transactionRef?: string;
  createdAt: string;
}

const statusConfig = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  SUCCESS: { label: 'Success', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-800', icon: XCircle },
  REFUNDED: { label: 'Refunded', color: 'bg-gray-100 text-gray-800', icon: RefreshCcw },
};

export default function AdminPaymentsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const permissions = useMemo(
    () => (user ? getPermissions(user.roles) : null),
    [user?.roles?.join('|')]
  );
  const lastFetchKeyRef = useRef<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [usernamesById, setUsernamesById] = useState<Record<string, string>>({});
  const usersFetchedRef = useRef(false);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const endpoint =
        statusFilter === 'all'
          ? '/admin/payments'
          : `/admin/payments/status/${statusFilter}`;
      const response = await apiClient.get(endpoint);
      setPayments(response.data.data?.content || response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch payments', err);
      setPayments([]);
      setActionError('Failed to load payments.');
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
      console.error('Failed to fetch users for payment display', err);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!permissions?.canViewPayments) {
      router.push('/admin');
      return;
    }
    const key = `${user.id || user.username || 'user'}:${statusFilter}`;
    if (lastFetchKeyRef.current === key) return;
    lastFetchKeyRef.current = key;
    fetchPayments();
  }, [statusFilter, user, permissions?.canViewPayments, router, fetchPayments]);

  useEffect(() => {
    const hasMissingUsernames = payments.some(
      (payment) => payment.userId && !usernamesById[payment.userId]
    );
    if (hasMissingUsernames) {
      fetchUsernames();
    }
  }, [payments, usernamesById, fetchUsernames]);

  const handleVerify = async (paymentId: string) => {
    setProcessingId(paymentId);
    setActionError(null);
    try {
      await apiClient.post(`/admin/payments/${paymentId}/verify`);
      fetchPayments();
    } catch (err) {
      console.error('Failed to verify payment', err);
      setActionError('Failed to verify payment.');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const q = searchQuery.toLowerCase();
    const customerLabel =
      p.customerUsername ||
      p.customerName ||
      usernamesById[p.userId] ||
      p.userId;
    return (
      p.orderId.toLowerCase().includes(q) ||
      customerLabel.toLowerCase().includes(q) ||
      (p.transactionRef || '').toLowerCase().includes(q)
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (user && !permissions?.canViewPayments) {
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
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
      </div>

      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order, customer, or reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </div>

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Payment Details</h2>
              <button
                onClick={() => setSelectedPayment(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Transaction Ref</span>
                <span className="font-mono">{selectedPayment.transactionRef || '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Order</span>
                <span className="font-medium">
                  {selectedPayment.orderNumber || selectedPayment.orderCode
                    ? formatOrderNumber(selectedPayment.orderNumber || selectedPayment.orderCode || '')
                    : selectedPayment.orderId.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Customer</span>
                <div className="text-right">
                  <p className="font-medium">
                    {selectedPayment.customerUsername ||
                      selectedPayment.customerName ||
                      usernamesById[selectedPayment.userId] ||
                      selectedPayment.userId}
                  </p>
                </div>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Amount</span>
                <span className="font-semibold text-lg">
                  {formatCurrency(selectedPayment.amount)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Gateway</span>
                <span>{selectedPayment.gateway}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Status</span>
                <span
                  className={cn(
                    'px-2 py-1 text-xs rounded-full',
                    statusConfig[selectedPayment.status].color
                  )}
                >
                  {statusConfig[selectedPayment.status].label}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Date</span>
                <span>{formatDate(selectedPayment.createdAt)}</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {selectedPayment.status === 'PENDING' && (
                <Button
                  onClick={() => handleVerify(selectedPayment.id)}
                  disabled={processingId === selectedPayment.id}
                  className="flex-1"
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Verify Payment
                </Button>
              )}
              <Button variant="outline" onClick={() => setSelectedPayment(null)} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gateway
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No payments found</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => {
                  const StatusIcon = statusConfig[payment.status].icon;
                  const orderCode = payment.orderNumber || payment.orderCode
                    ? formatOrderNumber(payment.orderNumber || payment.orderCode || '')
                    : payment.orderId.slice(0, 8).toUpperCase();
                  return (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm">{payment.transactionRef || '—'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium">
                          {orderCode}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {payment.customerUsername ||
                            payment.customerName ||
                            usernamesById[payment.userId] ||
                            payment.userId}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm">{payment.gateway}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full',
                            statusConfig[payment.status].color
                          )}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig[payment.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-500">
                        {formatDate(payment.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedPayment(payment)}
                          className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
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
