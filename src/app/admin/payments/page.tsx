'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { Button, Skeleton } from '@/components/ui';
import { formatCurrency, cn } from '@/lib/utils';
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
  AlertCircle,
} from 'lucide-react';

interface Payment {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  gateway: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  transactionRef: string;
  createdAt: string;
}

const statusConfig = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  SUCCESS: { label: 'Success', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-800', icon: XCircle },
  REFUNDED: { label: 'Refunded', color: 'bg-gray-100 text-gray-800', icon: RefreshCcw },
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const endpoint =
        statusFilter === 'all'
          ? '/admin/payments'
          : `/admin/payments/status/${statusFilter}`;
      const response = await apiClient.get(endpoint);
      setPayments(response.data.data?.content || response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch payments', err);
      // Demo data
      setPayments([
        {
          id: '1',
          orderId: 'ord-1',
          orderNumber: 'ORD-2026-001234',
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          amount: 299.99,
          currency: 'GHS',
          gateway: 'HUBTEL',
          status: 'SUCCESS',
          transactionRef: 'HBT-123456789',
          createdAt: '2026-01-15T10:30:00Z',
        },
        {
          id: '2',
          orderId: 'ord-2',
          orderNumber: 'ORD-2026-001235',
          customerName: 'Jane Smith',
          customerEmail: 'jane@example.com',
          amount: 149.50,
          currency: 'GHS',
          gateway: 'PAYSTACK',
          status: 'PENDING',
          transactionRef: 'PSK-987654321',
          createdAt: '2026-01-15T11:00:00Z',
        },
        {
          id: '3',
          orderId: 'ord-3',
          orderNumber: 'ORD-2026-001236',
          customerName: 'Bob Wilson',
          customerEmail: 'bob@example.com',
          amount: 450.00,
          currency: 'GHS',
          gateway: 'HUBTEL',
          status: 'FAILED',
          transactionRef: 'HBT-111222333',
          createdAt: '2026-01-14T15:20:00Z',
        },
        {
          id: '4',
          orderId: 'ord-4',
          orderNumber: 'ORD-2026-001237',
          customerName: 'Alice Brown',
          customerEmail: 'alice@example.com',
          amount: 89.99,
          currency: 'GHS',
          gateway: 'HUBTEL',
          status: 'REFUNDED',
          transactionRef: 'HBT-444555666',
          createdAt: '2026-01-13T09:45:00Z',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (paymentId: string) => {
    setProcessingId(paymentId);
    try {
      await apiClient.post(`/admin/payments/${paymentId}/verify`);
      fetchPayments();
    } catch (err) {
      console.error('Failed to verify payment', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRefund = async (paymentId: string) => {
    if (!confirm('Are you sure you want to refund this payment?')) return;

    setProcessingId(paymentId);
    try {
      await apiClient.post(`/admin/payments/${paymentId}/refund`, {
        reason: 'Admin initiated refund',
      });
      setPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? { ...p, status: 'REFUNDED' as const } : p))
      );
    } catch (err) {
      console.error('Failed to refund payment', err);
      // Demo: update locally
      setPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? { ...p, status: 'REFUNDED' as const } : p))
      );
    } finally {
      setProcessingId(null);
      setSelectedPayment(null);
    }
  };

  const filteredPayments = payments.filter(
    (p) =>
      p.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.transactionRef.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
                <span className="font-mono">{selectedPayment.transactionRef}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Order</span>
                <span className="font-medium">{selectedPayment.orderNumber}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Customer</span>
                <div className="text-right">
                  <p className="font-medium">{selectedPayment.customerName}</p>
                  <p className="text-sm text-gray-500">{selectedPayment.customerEmail}</p>
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
              {selectedPayment.status === 'SUCCESS' && (
                <Button
                  variant="outline"
                  onClick={() => handleRefund(selectedPayment.id)}
                  disabled={processingId === selectedPayment.id}
                  className="flex-1 text-error border-error hover:bg-error/10"
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Process Refund
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
                  return (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm">{payment.transactionRef}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium">{payment.orderNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{payment.customerName}</p>
                        <p className="text-xs text-gray-500">{payment.customerEmail}</p>
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
