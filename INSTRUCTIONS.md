# World Genius E-Commerce Frontend - User Instructions

**Audit Note (2026-01-21):** For architecture and current setup, see `README.md`.

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Backend API running on `http://localhost:8080` (optional - app works with dummy data)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000` (or the next available port).

---

## Application Overview

### Public Storefront (No Login Required)

| Page | URL | Description |
|------|-----|-------------|
| Homepage | `/` | Hero section, featured products, categories, new arrivals |
| All Products | `/products` | Browse all products with filters and sorting |
| Product Detail | `/products/[slug]` | View product details, add to cart |
| Category Products | `/categories/[slug]` | Browse products by category |
| Search | `/search?q=query` | Search for products |
| About Us | `/about` | Brand story and values |
| FAQ | `/faq` | Frequently asked questions |
| Contact | `/contact` | Contact form and business info |
| Shipping | `/shipping` | Shipping rates and delivery times |
| Returns | `/returns` | Return policy and process |
| Size Guide | `/size-guide` | Size charts for clothing |
| Privacy Policy | `/privacy` | Privacy policy |
| Terms of Service | `/terms` | Terms and conditions |

### Authentication Pages

| Page | URL | Description |
|------|-----|-------------|
| Login | `/login` | Sign in to your account |
| Register | `/register` | Create a new account |
| Forgot Password | `/forgot-password` | Request password reset |
| Reset Password | `/reset-password?token=xxx` | Set new password |

### User Account (Login Required)

| Page | URL | Description |
|------|-----|-------------|
| Account Overview | `/account` | Dashboard with quick stats |
| My Orders | `/account/orders` | View order history |
| Order Detail | `/account/orders/[id]` | View single order details |
| Profile Settings | `/account/profile` | Update name, email, password |
| Saved Addresses | `/account/addresses` | Manage shipping addresses |

### Shopping

| Page | URL | Description |
|------|-----|-------------|
| Cart | `/cart` | View cart, update quantities |
| Checkout | `/checkout` | Enter shipping details, complete order |

### Admin Dashboard (Admin Login Required)

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/admin` | Key metrics, recent orders, alerts |
| Products | `/admin/products` | Manage products, pricing, images |
| Categories | `/admin/categories` | Manage product categories |
| Orders | `/admin/orders` | View and process orders |
| Inventory | `/admin/inventory` | Manage stock levels |
| Payments | `/admin/payments` | View payment transactions |
| Customers | `/admin/customers` | View customer information |
| Analytics | `/admin/analytics` | Sales reports, charts, exports |
| Notifications | `/admin/notifications` | System alerts and notifications |

---

## User Roles

The system supports multiple user roles with different permissions:

| Role | Access |
|------|--------|
| `ROLE_USER` | Storefront, account, orders |
| `ROLE_SUPPORT_AGENT` | + View orders, payments, customers |
| `ROLE_WAREHOUSE` | + Manage inventory, fulfill orders |
| `ROLE_CONTENT_MANAGER` | + Manage products, categories |
| `ROLE_SUPER_ADMIN` | Full access to everything |

---

## How to Use

### As a Customer

1. **Browse Products**
   - Visit the homepage or `/products` to see all items
   - Use filters to narrow by category or price
   - Click a product to view details

2. **Create an Account**
   - Click "Sign In" in the header
   - Click "Create an account"
   - Fill in your details and register
   - Verify your email (if backend is connected)

3. **Add to Cart**
   - On a product page, select quantity
   - Click "Add to Cart"
   - View cart by clicking the cart icon

4. **Checkout**
   - Go to cart and click "Proceed to Checkout"
   - Enter your shipping address
   - Select payment method
   - Complete payment (redirects to payment gateway)

5. **Track Orders**
   - Go to `/account/orders` to view all orders
   - Click an order to see full details and status

### As an Admin

1. **Access Admin Panel**
   - Login with an admin account
   - Navigate to `/admin` or click your profile > Admin

2. **Manage Products**
   - Go to `/admin/products`
   - Click "Add Product" to create new items
   - Edit existing products or set discounts

3. **Process Orders**
   - Go to `/admin/orders`
   - Filter by status (Pending, Confirmed, etc.)
   - Update order status as items are processed

4. **Monitor Inventory**
   - Go to `/admin/inventory`
   - View low stock warnings
   - Adjust stock levels as needed

5. **View Analytics**
   - Go to `/admin/analytics`
   - See revenue, orders, and trends
   - Export data as CSV

---

## Demo Mode

When the backend API is not available, the app operates in **demo mode**:

- Products and categories are loaded from dummy data
- Cart operations work locally (not persisted)
- Authentication shows login forms but uses demo responses
- Admin pages show sample data

To connect to a real backend:
1. Start your backend on `http://localhost:8080`
2. The API client automatically connects
3. All data will be fetched from your backend

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State:** Zustand
- **Forms:** React Hook Form + Zod
- **HTTP:** Axios
- **Icons:** Lucide React

---

## Project Structure

```
src/
├── app/                    # Next.js pages
│   ├── (auth)/            # Login, register, password reset
│   ├── (store)/           # Public storefront pages
│   ├── (account)/         # User account pages
│   └── admin/             # Admin dashboard
├── components/
│   ├── ui/                # Base UI components
│   ├── layout/            # Header, Footer
│   └── ...
├── lib/
│   ├── api/               # API client
│   ├── stores/            # Zustand stores
│   ├── data/              # Dummy data
│   └── utils/             # Helper functions
└── types/                 # TypeScript interfaces
```

---

## Currency

All prices are displayed in **Ghana Cedis (GHS / ₵)**.

---

## Support

For questions or issues:
- Email: support@worldg3nius.com
- Visit: `/contact` for the contact form

---

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

---

**World Genius** - Bold streetwear for the nonconformist.
