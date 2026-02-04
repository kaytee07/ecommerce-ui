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
  mustChangePassword?: boolean;
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
  // Storefront discount fields (backend ProductDTO)
  currentDiscountPercentage?: number;
  effectivePrice?: number;
  // Admin discount fields (backend ProductAdminDTO)
  discountPercentage?: number;
  discountStart?: string;
  discountEnd?: string;
  discountActive?: boolean;
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
  stockQuantity?: number;
  lowStockThreshold?: number;
  tags?: string[];
  attributes?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ProductOption {
  name: string;
  values: string[];
  required?: boolean;
}

export interface ProductOptionsAttribute {
  options: ProductOption[];
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
  attributes?: Record<string, unknown>;
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
  attributes?: Record<string, unknown>;
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

// Storefront Types
export interface StorefrontBanner {
  id: string;
  slot: 'PRIMARY' | 'SECONDARY';
  eyebrow?: string | null;
  headline?: string | null;
  subheadline?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
  imageUrl?: string | null;
  active: boolean;
  updatedAt?: string | null;
}

// Cart Types
export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  itemCount: number;
  totalAmount: number;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  itemKey?: string;
  productName: string;
  quantity: number;
  priceAtAdd: number;
  subtotal: number;
  selectedOptions?: Record<string, string>;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
  selectedOptions?: Record<string, string>;
}

export interface UpdateCartItemRequest {
  quantity: number;
  itemKey?: string;
  selectedOptions?: Record<string, string>;
}

// Order Types
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface Order {
  id: string;
  userId: string;
  guestEmail?: string;
  guestName?: string;
  userUsername?: string;
  customerUsername?: string;
  customerName?: string;
  orderNumber?: string;
  orderCode?: string;
  status: OrderStatus;
  items: OrderItem[];
  itemCount: number;
  totalAmount: number;
  notes?: string;
  shippingAddress?: ShippingAddress;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  priceAtOrder: number;
  selectedOptions?: Record<string, string>;
  subtotal: number;
}

export interface OrderHistory {
  id: string;
  orderNumber?: string;
  orderCode?: string;
  status: OrderStatus;
  statusDisplayName?: string;
  guestEmail?: string;
  guestName?: string;
  itemCount: number;
  totalAmount: number;
  createdAt: string;
  previewProductId?: string;
  previewProductName?: string;
  shippingAddress?: ShippingAddress;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  reason?: string;
}

export interface ShippingAddress {
  street?: string;
  city?: string;
  region?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  gps?: string;
}

// Payment Types
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
export type PaymentGateway = 'HUBTEL' | 'PAYSTACK';

export interface Payment {
  id: string;
  orderId: string;
  orderNumber?: string;
  orderCode?: string;
  userId: string;
  customerUsername?: string;
  customerName?: string;
  status: PaymentStatus;
  gateway: PaymentGateway;
  transactionRef: string;
  idempotencyKey?: string;
  amount: number;
  currency: string;
  checkoutUrl?: string;
  failureReason?: string;
  refundReason?: string;
  refundedBy?: string;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InitiatePaymentRequest {
  orderId: string;
  idempotencyKey: string;
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
  productName?: string;
  sku?: string;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  updatedAt: string;
}

export interface InventoryAdjustRequest {
  quantity: number;
  adjustmentType: string;
  reason: string;
}

// Notification Types
export type NotificationType =
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'ORDER_PLACED'
  | 'ORDER_CANCELLED'
  | 'PAYMENT_FAILED'
  | 'ANNOUNCEMENT'
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
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  todayOrderCount: number;
  weekOrderCount: number;
  monthOrderCount: number;
  salesFunnel: SalesFunnel | null;
  topProducts: TopProduct[];
  lowStockAlerts: LowStockProduct[];
  successfulPayments: number;
  failedPayments: number;
  totalPaymentVolume: number;
  generatedAt: string;
}

export interface DailySales {
  saleDate: string;
  orderCount: number;
  totalRevenue: number;
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
  successfulPayments: number;
  failedPayments: number;
  pendingOrders: number;
  successfulOrders: number;
  cartToOrderRate: number;
  orderToPaidRate: number;
}

export interface LowStockProduct {
  inventoryId: string;
  productId: string;
  productName: string;
  sku: string;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
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
