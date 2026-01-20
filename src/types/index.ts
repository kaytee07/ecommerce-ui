// API Response Types
export interface ApiResponse<T> {
  status: boolean;
  data: T;
  message: string;
}

export interface ApiError {
  code: number;
  message: string;
  errorCode: string;
  details?: Record<string, unknown>;
  traceId?: string;
}

// Pagination
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  roles: string[];
  emailVerified: boolean;
  createdAt: string;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  expires_in: number;
  scope: string;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  discountPercentage?: number;
  discountedPrice?: number;
  discountStartDate?: string;
  discountEndDate?: string;
  sku: string;
  categoryId: string;
  categoryName?: string;
  category?: Category;
  imageUrl?: string;
  images?: ProductImage[];
  active?: boolean;
  isActive?: boolean;
  featured?: boolean;
  isFeatured?: boolean;
  status?: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  stockQuantity: number;
  lowStockThreshold?: number;
  tags?: string[];
  attributes?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface ProductCreateRequest {
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  categoryId: string;
  active?: boolean;
  featured?: boolean;
  attributes?: Record<string, string>;
}

export interface ProductUpdateRequest {
  name?: string;
  description?: string;
  price?: number;
  compareAtPrice?: number;
  sku?: string;
  categoryId?: string;
  active?: boolean;
  featured?: boolean;
  attributes?: Record<string, string>;
}

export interface ProductSearchParams {
  q?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  size?: number;
  sortBy?: 'createdAt' | 'price' | 'name';
  sortDirection?: 'asc' | 'desc';
}

// Category Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  parentName?: string;
  displayOrder: number;
  productCount?: number;
  active?: boolean;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CategoryAdmin extends Category {
  productCount: number;
  childCount: number;
}

export interface CategoryTree extends Category {
  children: CategoryTree[];
}

export interface CategoryCreateRequest {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string;
  displayOrder?: number;
}

// Cart Types
export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  productSlug: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  stockAvailable: number;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

// Order Types
export type OrderStatus =
  | 'PENDING'
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  itemCount: number;
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  trackingNumber?: string;
  carrier?: string;
  notes?: string;
  statusHistory: OrderStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productSlug: string;
  productImage?: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderHistory {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  itemCount: number;
  totalAmount: number;
  createdAt: string;
}

export interface OrderStatusHistory {
  status: OrderStatus;
  reason?: string;
  changedBy?: string;
  changedAt: string;
}

export interface ShippingAddress {
  street: string;
  city: string;
  region: string;
  country: string;
  postalCode?: string;
  phone?: string;
}

export interface CreateOrderRequest {
  shippingAddress: ShippingAddress;
  paymentMethod: 'MOBILE_MONEY' | 'CARD';
  notes?: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  reason?: string;
  trackingNumber?: string;
  carrier?: string;
}

// Payment Types
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
export type PaymentGateway = 'HUBTEL' | 'PAYSTACK';

export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  status: PaymentStatus;
  gateway: PaymentGateway;
  transactionRef: string;
  amount: number;
  currency: string;
  checkoutUrl?: string;
  failureReason?: string;
  refundReason?: string;
  refundAmount?: number;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InitiatePaymentRequest {
  gateway?: PaymentGateway;
  callbackUrl?: string;
}

export interface RefundRequest {
  reason: string;
  amount?: number;
}

// Inventory Types
export interface Inventory {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  updatedAt: string;
}

export interface InventoryAdjustRequest {
  adjustment: number;
  reason: string;
}

// Notification Types
export type NotificationType =
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'ORDER_PLACED'
  | 'ORDER_CANCELLED'
  | 'PAYMENT_FAILED'
  | 'SYSTEM_ALERT'
  | 'INVENTORY_ADJUSTMENT';

export type NotificationSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  severity: NotificationSeverity;
  read: boolean;
  readAt?: string;
  readBy?: string;
  createdAt: string;
}

export interface NotificationSummary {
  totalUnread: number;
  criticalUnread: number;
  warningUnread: number;
  infoUnread: number;
}

// Analytics Types
export interface DashboardData {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  pendingOrders: number;
  lowStockCount: number;
  dailySales: DailySales[];
  topProducts: TopProduct[];
  generatedAt: string;
}

export interface DailySales {
  date: string;
  orderCount: number;
  revenue: number;
  avgOrderValue: number;
  uniqueCustomers: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  totalSold: number;
  totalRevenue: number;
  orderCount: number;
}

export interface SalesFunnel {
  cartCount: number;
  orderCount: number;
  pendingOrders: number;
  successfulOrders: number;
  successfulPayments: number;
  failedPayments: number;
}

export interface CustomerLifetimeValue {
  userId: string;
  orderCount: number;
  totalSpent: number;
  avgOrderValue: number;
  firstOrderDate: string;
  lastOrderDate: string;
  customerTenureDays: number;
}
