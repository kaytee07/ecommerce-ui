'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { Button, Skeleton } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Download,
  Calendar,
  ArrowRight,
} from 'lucide-react';

// Matches AnalyticsDashboardDTO from backend
interface DashboardMetrics {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  pendingOrders: number;
  lowStockCount: number;
  dailySales: DailySales[];
  topProducts: TopProduct[];
  generatedAt: string;
}

// Matches DailySalesDTO from backend
interface DailySales {
  saleDate: string;
  orderCount: number;
  totalRevenue: number;
  avgOrderValue: number;
  uniqueCustomers: number;
}

// Matches TopProductDTO from backend
interface TopProduct {
  productId: string;
  productName: string;
  totalSold: number;
  totalRevenue: number;
  orderCount: number;
}

// Matches SalesFunnelDTO from backend
interface SalesFunnel {
  cartCount: number;
  orderCount: number;
  pendingOrders: number;
  successfulOrders: number;
  successfulPayments: number;
  failedPayments: number;
}

// Matches LowStockProductDTO from backend
interface LowStockProduct {
  inventoryId: string;
  productId: string;
  productName: string;
  sku: string;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
}

export default function AdminAnalyticsPage() {
  const [dashboard, setDashboard] = useState<DashboardMetrics | null>(null);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [funnel, setFunnel] = useState<SalesFunnel | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  // Calculate date range for API
  const getDateRange = () => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - (dateRange === '7d' ? 7 : 30));
    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    };
  };

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    const { from, to } = getDateRange();

    try {
      // Fetch dashboard which includes dailySales and topProducts
      const dashboardRes = await apiClient.get<{ status: boolean; data: DashboardMetrics }>(
        '/admin/analytics/dashboard'
      );

      // IMPORTANT: Always use fallback to prevent undefined errors
      const dashboardData = dashboardRes.data.data;
      setDashboard(dashboardData);
      setDailySales(dashboardData?.dailySales || []);
      setTopProducts(dashboardData?.topProducts || []);

      // Fetch additional data in parallel
      const [funnelRes, lowStockRes] = await Promise.all([
        apiClient.get<{ status: boolean; data: SalesFunnel }>('/admin/analytics/sales-funnel'),
        apiClient.get<{ status: boolean; data: LowStockProduct[] }>('/admin/analytics/low-stock?threshold=5'),
      ]);

      setFunnel(funnelRes.data.data || null);
      setLowStockProducts(lowStockRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
      setError('Failed to load analytics data. Please ensure the backend is running.');
      // Set empty states instead of dummy data
      setDashboard(null);
      setDailySales([]);
      setTopProducts([]);
      setFunnel(null);
      setLowStockProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (type: 'orders' | 'payments' | 'inventory' | 'daily-sales') => {
    const { from, to } = getDateRange();
    try {
      // Build URL with date range for applicable exports
      let url = `/admin/analytics/export/${type}`;
      if (type === 'orders' || type === 'payments' || type === 'daily-sales') {
        url += `?from=${from}&to=${to}`;
      }

      const response = await apiClient.get(url, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${type}-export-${from}-to-${to}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Failed to export', err);
      setError('Failed to export data. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  };

  const maxRevenue = Math.max(...dailySales.map((d) => d.totalRevenue), 1);

  // Calculate conversion rate from funnel data
  const conversionRate = funnel && funnel.cartCount > 0
    ? ((funnel.successfulPayments / funnel.cartCount) * 100).toFixed(1)
    : '0';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <div className="flex items-center gap-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-error-bg text-error rounded-lg">
          {error}
        </div>
      )}

      {/* Metrics Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(dashboard.totalRevenue)}
            icon={DollarSign}
          />
          <MetricCard
            title="Total Orders"
            value={dashboard.totalOrders.toString()}
            icon={ShoppingCart}
          />
          <MetricCard
            title="Pending Orders"
            value={dashboard.pendingOrders.toString()}
            icon={Package}
          />
          <MetricCard
            title="Avg Order Value"
            value={formatCurrency(dashboard.avgOrderValue)}
            icon={BarChart3}
          />
        </div>
      )}

      {/* Low Stock Alert */}
      {dashboard && dashboard.lowStockCount > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
          <Package className="h-5 w-5 text-yellow-600" />
          <div>
            <p className="font-medium text-yellow-800">Low Stock Alert</p>
            <p className="text-sm text-yellow-700">
              {dashboard.lowStockCount} products are running low on stock
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Daily Sales</h2>
            <div className="text-sm text-gray-500">
              {dateRange === '7d' ? 'Last 7 days' : 'Last 30 days'}
            </div>
          </div>

          {/* Simple Bar Chart */}
          {!dailySales || dailySales.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No sales data available for this period
            </div>
          ) : (
            <>
              <div className="h-64 flex items-end gap-2">
                {dailySales.map((day, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-gray-100 rounded-t relative" style={{ height: '200px' }}>
                      <div
                        className="absolute bottom-0 w-full bg-primary rounded-t transition-all duration-300"
                        style={{ height: `${(day.totalRevenue / maxRevenue) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(day.saleDate)}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(dailySales.reduce((sum, d) => sum + d.totalRevenue, 0))}
                  </p>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {dailySales.reduce((sum, d) => sum + d.orderCount, 0)}
                  </p>
                  <p className="text-sm text-gray-500">Total Orders</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {dailySales.reduce((sum, d) => sum + d.uniqueCustomers, 0)}
                  </p>
                  <p className="text-sm text-gray-500">Unique Customers</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sales Funnel */}
        {funnel && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Sales Funnel</h2>
            <div className="space-y-4">
              <FunnelStep label="Carts Created" value={funnel.cartCount} percentage={100} />
              <FunnelStep
                label="Orders Placed"
                value={funnel.orderCount}
                percentage={funnel.cartCount > 0 ? (funnel.orderCount / funnel.cartCount) * 100 : 0}
              />
              <FunnelStep
                label="Successful Payments"
                value={funnel.successfulPayments}
                percentage={funnel.cartCount > 0 ? (funnel.successfulPayments / funnel.cartCount) * 100 : 0}
              />
              {funnel.failedPayments > 0 && (
                <FunnelStep
                  label="Failed Payments"
                  value={funnel.failedPayments}
                  percentage={funnel.orderCount > 0 ? (funnel.failedPayments / funnel.orderCount) * 100 : 0}
                  isNegative
                />
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <p className="text-3xl font-bold text-primary">{conversionRate}%</p>
              <p className="text-sm text-gray-500">Conversion Rate</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Top Products</h2>
          {!topProducts || topProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No sales data yet
            </div>
          ) : (
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.productId} className="flex items-center gap-4">
                  <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{product.productName}</p>
                    <p className="text-sm text-gray-500">{product.totalSold} sold in {product.orderCount} orders</p>
                  </div>
                  <span className="font-semibold">{formatCurrency(product.totalRevenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Export Options */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Export Data</h2>
          <div className="space-y-4">
            <button
              onClick={() => handleExport('orders')}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-5 w-5 text-gray-400" />
                <div className="text-left">
                  <p className="font-medium">Orders Export</p>
                  <p className="text-sm text-gray-500">Download all orders as CSV</p>
                </div>
              </div>
              <Download className="h-5 w-5 text-gray-400" />
            </button>

            <button
              onClick={() => handleExport('payments')}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-gray-400" />
                <div className="text-left">
                  <p className="font-medium">Payments Export</p>
                  <p className="text-sm text-gray-500">Download payment history as CSV</p>
                </div>
              </div>
              <Download className="h-5 w-5 text-gray-400" />
            </button>

            <button
              onClick={() => handleExport('inventory')}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-gray-400" />
                <div className="text-left">
                  <p className="font-medium">Inventory Export</p>
                  <p className="text-sm text-gray-500">Download inventory snapshot as CSV</p>
                </div>
              </div>
              <Download className="h-5 w-5 text-gray-400" />
            </button>

            <button
              onClick={() => handleExport('daily-sales')}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-gray-400" />
                <div className="text-left">
                  <p className="font-medium">Daily Sales Export</p>
                  <p className="text-sm text-gray-500">Download daily sales report as CSV</p>
                </div>
              </div>
              <Download className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Low Stock Products Table */}
      {lowStockProducts && lowStockProducts.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Low Stock Products</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Reserved</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Available</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {lowStockProducts.map((item) => (
                  <tr key={item.inventoryId}>
                    <td className="px-4 py-3 font-medium">{item.productName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{item.sku}</td>
                    <td className="px-4 py-3 text-center">{item.stockQuantity}</td>
                    <td className="px-4 py-3 text-center">{item.reservedQuantity}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={item.availableQuantity === 0 ? 'text-error font-medium' : 'text-yellow-600'}>
                        {item.availableQuantity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: { value: number; label: string };
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">{title}</span>
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>
      {trend && (
        <div className={`flex items-center gap-1 text-sm ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend.value >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          <span>{Math.abs(trend.value)}% {trend.label}</span>
        </div>
      )}
    </div>
  );
}

function FunnelStep({
  label,
  value,
  percentage,
  isNegative = false,
}: {
  label: string;
  value: number;
  percentage: number;
  isNegative?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{label}</span>
        <span className={`font-medium ${isNegative ? 'text-error' : ''}`}>{value.toLocaleString()}</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${isNegative ? 'bg-error' : 'bg-primary'}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
