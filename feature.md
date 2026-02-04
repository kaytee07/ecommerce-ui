# System Features (Ecommerce Engine Frontend)

This file enumerates all user-facing and system-level features implemented or exposed by the frontend, based on repository documentation and routes.

## 1) Public Storefront (No Login Required)

### Core shopping and discovery
- **Homepage (`/`)**: Hero section, featured products, category highlights, and new arrivals.
- **All Products (`/products`)**: Browse catalog; filters and sorting are supported.
- **Category Products (`/categories/[slug]`)**: Browse products scoped to a category.
- **Product Detail (`/products/[slug]`)**: Product media, pricing, stock, and “add to cart”.
- **Search (`/search?q=query`)**: Keyword search across products.

### Informational content pages
- **About Us (`/about`)**: Brand story and values.
- **FAQ (`/faq`)**: Common questions and answers.
- **Contact (`/contact`)**: Contact form and business info.
- **Shipping (`/shipping`)**: Shipping rates and delivery timelines.
- **Returns (`/returns`)**: Return policy and process guidance.
- **Size Guide (`/size-guide`)**: Size charts for apparel.
- **Privacy Policy (`/privacy`)**: Privacy practices and terms.
- **Terms of Service (`/terms`)**: Terms and conditions.

## 2) Authentication and Access

### Auth flows
- **Login (`/login`)**: Sign in; sets HttpOnly cookies from backend.
- **Register (`/register`)**: Create an account.
- **Forgot Password (`/forgot-password`)**: Request password reset.
- **Reset Password (`/reset-password?token=...`)**: Set new password using reset token.
- **Verify Email (`/verify-email`)**: Email verification entry point.

### Auth behavior and protection
- **Session model**: Access/refresh cookies set by backend; frontend retries on 401 via `/auth/refresh`.
- **Route protection**: Middleware guards `/account`, `/checkout`, and `/admin`.
- **Role-based access**: Multiple roles determine admin/back-office access (see Roles section).

## 3) Customer Account (Login Required)

### Account pages
- **Account Overview (`/account`)**: Dashboard-style summary and quick stats.
- **Orders (`/account/orders`)**: Order history list and status.
- **Order Detail (`/account/orders/[id]`)**: Single order details and status timeline.
- **Profile (`/account/profile`)**: Update name, email, and password.
- **Addresses (`/account/addresses`)**: Manage shipping addresses.

## 4) Cart and Checkout

- **Cart (`/cart`)**: View cart contents; update quantities.
- **Checkout (`/checkout`)**: Enter shipping details; complete order; initiates payment.

## 5) Admin Dashboard (Admin Login Required)

### Admin landing
- **Dashboard (`/admin`)**: Key metrics, recent orders, and alerts.

### Products & Catalog
- **Products list (`/admin/products`)**: Manage product catalog, pricing, and images.
- **Product create (`/admin/products/new`)**: Create new product.
- **Product edit/detail (`/admin/products/[id]`)**: Update product details and images; inventory adjustments are accessed here.
- **Categories (`/admin/categories`)**: Manage product categories.

### Orders & Fulfillment
- **Orders list (`/admin/orders`)**: View and process orders; filter by status.
- **Order detail (`/admin/orders/[id]`)**: Review order details and update status.
- **Inventory (`/admin/inventory`)**: Manage stock levels and low-stock visibility.

### Payments, Customers, and Ops
- **Payments (`/admin/payments`)**: View transactions; initiate/verify payments and issue refunds.
- **Customers (`/admin/customers`)**: View customer information.
- **Notifications (`/admin/notifications`)**: System alerts (e.g., low stock, ops notices).
- **Analytics (`/admin/analytics`)**: Revenue, orders, trends, and exports (CSV).
- **Audit Logs (`/admin/audit-logs`)**: Operational audit history and actions.

### Marketing
- **Email broadcast**: Create and send marketing campaigns to customers (e.g., promotions, announcements).

## 6) Inventory and Stock Logic (Admin)

- **Inventory created after product creation** (even if stock = 0).
- **Stock tracking**: Tracks stock, reserved, and available quantities.
- **Stock adjustments**: Uses adjustment types such as RESTOCK, ADJUSTMENT, SALE, RESERVE, RELEASE.
- **Low stock alerts**: Surface via admin notifications.

## 7) Orders and Status Flow

- **Order status pipeline**: PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED.
- **Order history**: Customers can view history and detail pages.
- **Admin order management**: Status updates and processing flow are supported.

## 8) Payments

- **Payment initiation**: Triggered from checkout; admin can initiate and verify.
- **Refunds**: Issued from admin payments area.
- **Payment providers**: Supports gateway integration (e.g., Paystack/Hubtel credentials referenced in troubleshooting).

## 9) Content, UX, and UI Components

- **Shared layout**: Header, footer, and base layout across storefront/auth/account/admin.
- **Product UI**: Product cards, price display, stock badge, and image handling.
- **Forms and validation**: React Hook Form + Zod for auth, checkout, product/category validations.
- **UI kit**: Buttons, inputs, selects, badges, cards, modals, toasts, skeletons, empty states, image upload.

## 10) Roles and Permissions

Role-based access gates admin capabilities:
- **ROLE_USER**: Storefront, account, orders.
- **ROLE_SUPPORT_AGENT**: Adds view access to orders, payments, customers.
- **ROLE_WAREHOUSE**: Adds inventory management and fulfillment.
- **ROLE_CONTENT_MANAGER**: Adds product and category management.
- **ROLE_SUPER_ADMIN**: Full access to all admin features.

## 11) Demo Mode (No Backend Required)

When the backend is unavailable:
- **Dummy data**: Products and categories load from local dummy data.
- **Local cart**: Cart operations function locally but are not persisted.
- **Auth demo responses**: Login/register forms are shown with demo responses.
- **Admin sample data**: Admin pages show example data for UI preview.

## 12) System and Data Conventions

- **API base URL**: `NEXT_PUBLIC_API_URL` (default `http://localhost:8080/api/v1`).
- **Response shape**: APIs expected to return `{ status, data, message }`.
- **Product images**: Stored under `attributes.images` with size variants (thumbnail, medium, large, original).
- **Currency**: Displayed in Ghana Cedis (GHS / ₵).

## 13) Accessibility and Routing

- **App Router**: Next.js App Router organizes storefront, auth, account, and admin segments.
- **Protected routes**: Middleware guards private routes for account, checkout, and admin.
- **Redirects**: Auth-required flows use `/login?redirect=/path`.

---

If you want, I can also generate a feature-by-feature matrix (page → inputs → outputs → API endpoints) or a user journey map for each role.
