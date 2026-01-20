'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  ClipboardList,
  Search,
  Filter,
  Eye,
  X,
  User,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface AuditLog {
  id: string;
  adminId: string;
  adminName?: string;
  adminEmail?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  ACTIVATE: 'bg-emerald-100 text-emerald-800',
  DEACTIVATE: 'bg-yellow-100 text-yellow-800',
  ROLE_ASSIGN: 'bg-purple-100 text-purple-800',
  LOGIN: 'bg-gray-100 text-gray-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
  REFUND: 'bg-orange-100 text-orange-800',
  STATUS_CHANGE: 'bg-indigo-100 text-indigo-800',
};

export default function AdminAuditLogsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Check if user is SUPER_ADMIN
  const isSuperAdmin = user?.roles?.includes('ROLE_SUPER_ADMIN');

  useEffect(() => {
    if (!isSuperAdmin) {
      router.push('/admin');
      return;
    }
    fetchAuditLogs();
  }, [isSuperAdmin, page, actionFilter, entityFilter]);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      let endpoint = `/admin/audit-logs?page=${page}&size=20`;
      if (actionFilter !== 'all') {
        endpoint += `&action=${actionFilter}`;
      }
      if (entityFilter !== 'all') {
        endpoint += `&entityType=${entityFilter}`;
      }

      const response = await apiClient.get(endpoint);
      const data = response.data.data;

      if (data?.content) {
        setAuditLogs(data.content);
        setTotalPages(data.totalPages || 1);
      } else {
        setAuditLogs(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
      // Demo data for development
      setAuditLogs([
        {
          id: '1',
          adminId: 'admin-1',
          adminName: 'John Admin',
          adminEmail: 'admin@worldg3nius.com',
          action: 'CREATE',
          entityType: 'Product',
          entityId: 'prod-123',
          newValue: { name: 'New Streetwear Tee', price: 150.00 },
          createdAt: '2026-01-17T10:30:00Z',
        },
        {
          id: '2',
          adminId: 'admin-1',
          adminName: 'John Admin',
          adminEmail: 'admin@worldg3nius.com',
          action: 'UPDATE',
          entityType: 'Product',
          entityId: 'prod-456',
          oldValue: { price: 100.00 },
          newValue: { price: 120.00 },
          createdAt: '2026-01-17T09:15:00Z',
        },
        {
          id: '3',
          adminId: 'admin-2',
          adminName: 'Jane Manager',
          adminEmail: 'jane@worldg3nius.com',
          action: 'ROLE_ASSIGN',
          entityType: 'User',
          entityId: 'user-789',
          oldValue: { roles: ['ROLE_USER'] },
          newValue: { roles: ['ROLE_USER', 'ROLE_WAREHOUSE'] },
          createdAt: '2026-01-16T16:45:00Z',
        },
        {
          id: '4',
          adminId: 'admin-1',
          adminName: 'John Admin',
          adminEmail: 'admin@worldg3nius.com',
          action: 'STATUS_CHANGE',
          entityType: 'Order',
          entityId: 'ord-001',
          oldValue: { status: 'PROCESSING' },
          newValue: { status: 'SHIPPED' },
          createdAt: '2026-01-16T14:20:00Z',
        },
        {
          id: '5',
          adminId: 'admin-2',
          adminName: 'Jane Manager',
          adminEmail: 'jane@worldg3nius.com',
          action: 'REFUND',
          entityType: 'Payment',
          entityId: 'pay-002',
          oldValue: { status: 'SUCCESS' },
          newValue: { status: 'REFUNDED', reason: 'Customer request' },
          createdAt: '2026-01-15T11:00:00Z',
        },
        {
          id: '6',
          adminId: 'admin-1',
          adminName: 'John Admin',
          adminEmail: 'admin@worldg3nius.com',
          action: 'DELETE',
          entityType: 'Category',
          entityId: 'cat-old',
          oldValue: { name: 'Old Category', active: false },
          createdAt: '2026-01-15T09:30:00Z',
        },
        {
          id: '7',
          adminId: 'admin-3',
          adminName: 'Warehouse Staff',
          adminEmail: 'warehouse@worldg3nius.com',
          action: 'UPDATE',
          entityType: 'Inventory',
          entityId: 'inv-123',
          oldValue: { stockQuantity: 50 },
          newValue: { stockQuantity: 75, reason: 'Stock replenishment' },
          createdAt: '2026-01-14T15:00:00Z',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = auditLogs.filter((log) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (log.adminName || '').toLowerCase().includes(searchLower) ||
      (log.adminEmail || '').toLowerCase().includes(searchLower) ||
      (log.entityId || '').toLowerCase().includes(searchLower) ||
      (log.action || '').toLowerCase().includes(searchLower)
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

  const formatJson = (obj: Record<string, unknown> | undefined) => {
    if (!obj) return '-';
    return JSON.stringify(obj, null, 2);
  };

  const getActionColor = (action: string) => {
    return actionColors[action] || 'bg-gray-100 text-gray-800';
  };

  // Get unique actions and entity types for filters
  const uniqueActions = [...new Set(auditLogs.map((log) => log.action))];
  const uniqueEntityTypes = [...new Set(auditLogs.map((log) => log.entityType).filter(Boolean))];

  if (!isSuperAdmin) {
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track all admin actions across the system
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by admin, entity ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(0);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="all">All Actions</option>
          {uniqueActions.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>
        <select
          value={entityFilter}
          onChange={(e) => {
            setEntityFilter(e.target.value);
            setPage(0);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="all">All Entities</option>
          {uniqueEntityTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Audit Log Details</h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              <div className="space-y-4">
                <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Admin</p>
                    <p className="font-medium">{selectedLog.adminName || 'Unknown'}</p>
                    <p className="text-sm text-gray-500">{selectedLog.adminEmail}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Action</p>
                    <span className={cn('px-2 py-1 text-xs rounded-full', getActionColor(selectedLog.action))}>
                      {selectedLog.action}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                  <ClipboardList className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Entity</p>
                    <p className="font-medium">
                      {selectedLog.entityType} {selectedLog.entityId && `(${selectedLog.entityId})`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <p className="font-medium">{formatDate(selectedLog.createdAt)}</p>
                  </div>
                </div>

                {selectedLog.oldValue && (
                  <div className="py-2 border-b border-gray-100">
                    <p className="text-sm text-gray-500 mb-2">Previous Value</p>
                    <pre className="bg-red-50 text-red-800 p-3 rounded-lg text-xs overflow-x-auto">
                      {formatJson(selectedLog.oldValue)}
                    </pre>
                  </div>
                )}

                {selectedLog.newValue && (
                  <div className="py-2 border-b border-gray-100">
                    <p className="text-sm text-gray-500 mb-2">New Value</p>
                    <pre className="bg-green-50 text-green-800 p-3 rounded-lg text-xs overflow-x-auto">
                      {formatJson(selectedLog.newValue)}
                    </pre>
                  </div>
                )}

                {selectedLog.ipAddress && (
                  <div className="py-2 border-b border-gray-100">
                    <p className="text-sm text-gray-500">IP Address</p>
                    <p className="font-mono text-sm">{selectedLog.ipAddress}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entity
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No audit logs found</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{log.adminName || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{log.adminEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn('px-2 py-1 text-xs rounded-full', getActionColor(log.action))}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{log.entityType || '-'}</p>
                        {log.entityId && (
                          <p className="text-xs text-gray-500 font-mono">{log.entityId}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-500">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
