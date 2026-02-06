'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores';
import { Input, Select, Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { getPermissions } from '@/lib/auth/permissions';

interface AuditLog {
  id: string;
  adminId?: string;
  adminUsername: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

const actionStyles: Record<string, string> = {
  CREATE: 'bg-green-50 text-green-700 border-green-200',
  UPDATE: 'bg-blue-50 text-blue-700 border-blue-200',
  DELETE: 'bg-red-50 text-red-700 border-red-200',
  REFUND: 'bg-orange-50 text-orange-700 border-orange-200',
  STATUS_CHANGE: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

export default function AdminAuditLogsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const permissions = useMemo(
    () => (user ? getPermissions(user.roles) : null),
    [user]
  );
  const lastFetchKeyRef = useRef<string | null>(null);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [adminUsernameFilter, setAdminUsernameFilter] = useState('');

  const fetchAuditLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        size: '20',
        sortBy: 'createdAt',
        sortDirection: 'desc',
      });
      if (actionFilter) params.set('action', actionFilter);
      if (entityTypeFilter) params.set('entityType', entityTypeFilter);
      if (adminUsernameFilter) params.set('adminUsername', adminUsernameFilter);

      const response = await apiClient.get(`/admin/audit-logs?${params.toString()}`);
      const data = response.data.data;

      if (data?.content) {
        setAuditLogs(data.content || []);
        setTotalPages(data.totalPages || 1);
      } else {
        setAuditLogs(data || []);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
      setAuditLogs([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [page, actionFilter, entityTypeFilter, adminUsernameFilter]);

  useEffect(() => {
    if (!user) return;
    if (!permissions?.canViewAuditLogs) {
      router.push('/admin');
      return;
    }
    const key = [
      user.id || user.username || 'user',
      page,
      actionFilter || 'all',
      entityTypeFilter || 'all',
      adminUsernameFilter || 'any',
    ].join(':');
    if (lastFetchKeyRef.current === key) return;
    lastFetchKeyRef.current = key;
    void fetchAuditLogs();
  }, [
    page,
    actionFilter,
    entityTypeFilter,
    adminUsernameFilter,
    user,
    permissions?.canViewAuditLogs,
    router,
    fetchAuditLogs,
  ]);

  const filteredLogs = useMemo(() => {
    if (!searchQuery) return auditLogs;
    const searchLower = searchQuery.toLowerCase();
    return auditLogs.filter((log) =>
      [
        log.adminUsername,
        log.action,
        log.entityType,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchLower))
    );
  }, [auditLogs, searchQuery]);

  const uniqueActions = useMemo(
    () => Array.from(new Set(auditLogs.map((log) => log.action).filter(Boolean))),
    [auditLogs]
  );

  const uniqueEntityTypes = useMemo(
    () => Array.from(new Set(auditLogs.map((log) => log.entityType).filter(Boolean))),
    [auditLogs]
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

  const formatJson = (value?: Record<string, unknown>) => {
    if (!value || Object.keys(value).length === 0) return '-';
    return JSON.stringify(value, null, 2);
  };

  if (user && !permissions?.canViewAuditLogs) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-500">Review admin actions, actors, and changes across the system.</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by admin, action, or entity type"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-9 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 lg:w-[480px]">
            <Select
              options={[{ value: '', label: 'All Actions' }, ...uniqueActions.map((action) => ({ value: action, label: action }))]}
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            />
            <Select
              options={[{ value: '', label: 'All Entities' }, ...uniqueEntityTypes.map((type) => ({ value: type, label: type }))]}
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Filter by admin username"
            value={adminUsernameFilter}
            onChange={(e) => setAdminUsernameFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-4">
                      <Skeleton className="h-12 w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedId === log.id;
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
                            actionStyles[log.action] || 'bg-gray-100 text-gray-700 border-gray-200'
                          )}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{log.entityType}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{log.adminUsername}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(log.createdAt)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{log.ipAddress || '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : log.id)}
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          {isExpanded ? 'Hide' : 'View'}
                          <ChevronDown className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && filteredLogs.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing page {page + 1} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                disabled={page === 0}
                className={cn(
                  'inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50',
                  page === 0 && 'opacity-50 cursor-not-allowed'
                )}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                disabled={page >= totalPages - 1}
                className={cn(
                  'inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50',
                  page >= totalPages - 1 && 'opacity-50 cursor-not-allowed'
                )}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {!isLoading && expandedId && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {filteredLogs
            .filter((log) => log.id === expandedId)
            .map((log) => (
              <div key={log.id} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Previous Value
                  </p>
                  <pre className="text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3 whitespace-pre-wrap">
                    {formatJson(log.oldValue)}
                  </pre>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    New Value
                  </p>
                  <pre className="text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3 whitespace-pre-wrap">
                    {formatJson(log.newValue)}
                  </pre>
                </div>
                <div className="lg:col-span-2 text-xs text-gray-500">
                  User agent: {log.userAgent || '—'}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
