# World Genius E-Commerce Frontend - API Test Documentation

**Audit Note (2026-01-21):** For architecture and setup, see `README.md`.

## Test Environment
- **Frontend URL:** http://localhost:3000
- **Backend URL:** http://localhost:8080/api/v1
- **Date:** 2026-01-16

---

## Issues Fixed

### 1. Products Page TypeError (Fixed)
**Issue:** `TypeError: Cannot read properties of undefined (reading 'length')` on `/products` page
**Cause:** API response structure not properly handled when `response.data.data.content` was undefined
**Fix:** Added null checks: `const content = response.data.data?.content || [];`
**File:** `src/app/(store)/products/page.tsx:50-51`

### 2. Auth Store Security Model Update (Fixed)
**Issue:** Tokens were stored in client-side state (localStorage)
**Change:** Updated to HttpOnly cookie model per security requirements
**Changes Made:**
- Removed `accessToken` from client state (tokens are now HttpOnly cookies)
- Login response now only contains `{ expires_in, scope }` not tokens
- After login, user info is fetched from `/auth/me`
- Cookies are sent automatically with `withCredentials: true`
**Files:**
- `src/lib/stores/auth-store.ts`
- `src/lib/api/client.ts`
- `src/types/index.ts`
- `src/middleware.ts`

### 3. Cookie Name Fix (Fixed)
**Issue:** Middleware was checking for `accessToken` cookie
**Fix:** Changed to `access_token` to match backend cookie name
**File:** `src/middleware.ts:18`

---

## API Test Cases

### Authentication Tests

#### Test 1: User Registration
```
POST http://localhost:8080/api/v1/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "testuser@example.com",
  "password": "TestPass123",
  "fullName": "Test User"
}

Expected Response:
{
  "status": true,
  "data": {
    "id": "<uuid>",
    "username": "testuser",
    "email": "testuser@example.com",
    "fullName": "Test User",
    "roles": ["ROLE_USER"],
    "emailVerified": false,
    "createdAt": "<timestamp>"
  },
  "message": "Registration successful"
}
```

#### Test 2: User Login
```
POST http://localhost:8080/api/v1/auth/login
Content-Type: application/json

{
  "usernameOrEmail": "testuser@example.com",
  "password": "TestPass123"
}

Expected Response:
{
  "status": true,
  "data": {
    "expires_in": 3600,
    "scope": "ROLE_USER"
  },
  "message": "Login successful"
}

Expected Cookies (HttpOnly):
- Set-Cookie: access_token=<jwt>; HttpOnly; Secure; SameSite=Strict; Max-Age=3600
- Set-Cookie: refresh_token=<token>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

#### Test 3: Get Current User
```
GET http://localhost:8080/api/v1/auth/me
Cookie: access_token=<jwt>

Expected Response:
{
  "status": true,
  "data": {
    "id": "<uuid>",
    "username": "testuser",
    "email": "testuser@example.com",
    "fullName": "Test User",
    "roles": ["ROLE_USER"],
    "emailVerified": false,
    "createdAt": "<timestamp>"
  },
  "message": "Success"
}
```

#### Test 4: Logout
```
POST http://localhost:8080/api/v1/auth/logout
Cookie: access_token=<jwt>

Expected Response:
{
  "status": true,
  "data": null,
  "message": "Logout successful"
}

Expected: Cookies should be cleared
```

#### Test 5: Verify Email
```
GET http://localhost:8080/api/v1/auth/verify-email?token=<verification-token>

Expected Response (Success):
{
  "status": true,
  "data": null,
  "message": "Email verified successfully"
}

Expected Response (Invalid/Expired Token):
{
  "status": false,
  "data": null,
  "message": "Invalid or expired verification token"
}

Frontend Page: /verify-email?token=xxx
```

---

### Store/Product Tests

#### Test 5: Get All Categories
```
GET http://localhost:8080/api/v1/store/categories

Expected Response:
{
  "status": true,
  "data": [
    {
      "id": "<uuid>",
      "name": "Tops",
      "slug": "tops",
      "description": "...",
      "displayOrder": 0,
      "active": true,
      "createdAt": "<timestamp>"
    },
    ...
  ],
  "message": "Success"
}
```

#### Test 6: Search Products
```
GET http://localhost:8080/api/v1/store/products/search?page=0&size=20&sortBy=createdAt&sortDirection=desc

Expected Response:
{
  "status": true,
  "data": {
    "content": [
      {
        "id": "<uuid>",
        "name": "Gothic Sweatshirt",
        "slug": "gothic-sweatshirt",
        "price": 280.00,
        "categoryId": "<uuid>",
        "categoryName": "Tops",
        "stockQuantity": 50,
        ...
      },
      ...
    ],
    "totalElements": 20,
    "totalPages": 1,
    "size": 20,
    "number": 0,
    "first": true,
    "last": true,
    "empty": false
  },
  "message": "Success"
}
```

#### Test 7: Get Product by Slug
```
GET http://localhost:8080/api/v1/store/products/slug/gothic-sweatshirt

Expected Response:
{
  "status": true,
  "data": {
    "id": "<uuid>",
    "name": "Gothic Sweatshirt",
    "slug": "gothic-sweatshirt",
    "description": "Premium black sweatshirt...",
    "price": 280.00,
    "compareAtPrice": 350.00,
    "sku": "WG-GS-001",
    "categoryId": "<uuid>",
    "categoryName": "Tops",
    "imageUrl": "...",
    "active": true,
    "featured": true,
    "stockQuantity": 50,
    "createdAt": "<timestamp>",
    "updatedAt": "<timestamp>"
  },
  "message": "Success"
}
```

#### Test 8: Get Featured Products
```
GET http://localhost:8080/api/v1/store/products/featured

Expected Response:
{
  "status": true,
  "data": [
    { "id": "...", "name": "...", "featured": true, ... },
    ...
  ],
  "message": "Success"
}
```

---

### Cart Tests (Requires Authentication)

#### Test 9: Add to Cart
```
POST http://localhost:8080/api/v1/store/cart/items
Cookie: access_token=<jwt>
Content-Type: application/json

{
  "productId": "<product-uuid>",
  "quantity": 2
}

Expected Response:
{
  "status": true,
  "data": {
    "id": "<cart-uuid>",
    "userId": "<user-uuid>",
    "items": [
      {
        "productId": "<product-uuid>",
        "productName": "Gothic Sweatshirt",
        "productSlug": "gothic-sweatshirt",
        "quantity": 2,
        "unitPrice": 280.00,
        "subtotal": 560.00,
        "stockAvailable": 50
      }
    ],
    "itemCount": 2,
    "subtotal": 560.00,
    "updatedAt": "<timestamp>"
  },
  "message": "Item added to cart"
}
```

#### Test 10: Get Cart
```
GET http://localhost:8080/api/v1/store/cart
Cookie: access_token=<jwt>

Expected Response: (same structure as above)
```

#### Test 11: Update Cart Item Quantity
```
PUT http://localhost:8080/api/v1/store/cart/items/<product-uuid>
Cookie: access_token=<jwt>
Content-Type: application/json

{
  "quantity": 3
}

Expected Response: Updated cart with new quantity
```

#### Test 12: Remove from Cart
```
DELETE http://localhost:8080/api/v1/store/cart/items/<product-uuid>
Cookie: access_token=<jwt>

Expected Response: Updated cart without the removed item
```

---

### Order Tests (Requires Authentication)

#### Test 13: Create Order
```
POST http://localhost:8080/api/v1/store/orders
Cookie: access_token=<jwt>
Content-Type: application/json

{
  "shippingAddress": {
    "street": "123 Test Street",
    "city": "Accra",
    "region": "Greater Accra",
    "country": "Ghana",
    "postalCode": "00233",
    "phone": "+233201234567"
  },
  "paymentMethod": "MOBILE_MONEY",
  "notes": "Please call before delivery"
}

Expected Response:
{
  "status": true,
  "data": {
    "id": "<order-uuid>",
    "orderNumber": "ORD-2026-000001",
    "userId": "<user-uuid>",
    "status": "PENDING_PAYMENT",
    "items": [...],
    "subtotal": 560.00,
    "shippingCost": 20.00,
    "totalAmount": 580.00,
    "shippingAddress": {...},
    "paymentMethod": "MOBILE_MONEY",
    "createdAt": "<timestamp>"
  },
  "message": "Order created successfully"
}
```

#### Test 14: Get My Orders
```
GET http://localhost:8080/api/v1/store/orders/my
Cookie: access_token=<jwt>

Expected Response:
{
  "status": true,
  "data": [
    {
      "id": "<order-uuid>",
      "orderNumber": "ORD-2026-000001",
      "status": "PENDING_PAYMENT",
      "itemCount": 2,
      "totalAmount": 580.00,
      "createdAt": "<timestamp>"
    },
    ...
  ],
  "message": "Success"
}
```

#### Test 15: Get Order Details
```
GET http://localhost:8080/api/v1/store/orders/<order-uuid>
Cookie: access_token=<jwt>

Expected Response: Full order details including items, shipping, status history
```

---

### Admin Tests (Requires Admin Authentication)

#### Test 16: Admin Login
```
POST http://localhost:8080/api/v1/auth/login
Content-Type: application/json

{
  "usernameOrEmail": "admin@worldg3nius.com",
  "password": "AdminPass123"
}

Expected: Login with admin cookies set
```

#### Test 17: Get Admin Dashboard Data
```
GET http://localhost:8080/api/v1/admin/analytics/dashboard
Cookie: access_token=<admin-jwt>

Expected Response:
{
  "status": true,
  "data": {
    "totalOrders": 150,
    "totalRevenue": 45000.00,
    "avgOrderValue": 300.00,
    "pendingOrders": 12,
    "lowStockCount": 5,
    "dailySales": [...],
    "topProducts": [...],
    "generatedAt": "<timestamp>"
  },
  "message": "Success"
}
```

#### Test 18: Get Admin Products
```
GET http://localhost:8080/api/v1/admin/products?page=0&size=20
Cookie: access_token=<admin-jwt>

Expected Response: Paginated list of all products (including inactive)
```

#### Test 19: Create Product (NO IMAGE - S3 not ready)
```
POST http://localhost:8080/api/v1/admin/products
Cookie: access_token=<admin-jwt>
Content-Type: application/json

{
  "name": "Test Product",
  "description": "A test product for QA",
  "price": 199.99,
  "sku": "TEST-001",
  "categoryId": "<category-uuid>",
  "active": true,
  "featured": false
}

Expected Response: Created product with ID
```

#### Test 20: Update Product
```
PUT http://localhost:8080/api/v1/admin/products/<product-uuid>
Cookie: access_token=<admin-jwt>
Content-Type: application/json

{
  "name": "Updated Test Product",
  "price": 249.99
}

Expected Response: Updated product
```

#### Test 21: Get Admin Orders
```
GET http://localhost:8080/api/v1/admin/orders?page=0&size=20
Cookie: access_token=<admin-jwt>

Expected Response: Paginated list of all orders
```

#### Test 22: Get Admin Order Details
```
GET http://localhost:8080/api/v1/admin/orders/<order-uuid>
Cookie: access_token=<admin-jwt>

Expected Response:
{
  "status": true,
  "data": {
    "id": "<order-uuid>",
    "orderNumber": "ORD-2026-000001",
    "userId": "<user-uuid>",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "status": "CONFIRMED",
    "items": [
      {
        "productId": "<product-uuid>",
        "productName": "Gothic Sweatshirt",
        "productSlug": "gothic-sweatshirt",
        "quantity": 2,
        "unitPrice": 280.00,
        "subtotal": 560.00
      }
    ],
    "subtotal": 560.00,
    "shippingCost": 20.00,
    "totalAmount": 580.00,
    "shippingAddress": {
      "street": "123 Test Street",
      "city": "Accra",
      "region": "Greater Accra",
      "country": "Ghana",
      "postalCode": "00233",
      "phone": "+233201234567"
    },
    "paymentMethod": "MOBILE_MONEY",
    "paymentStatus": "PAID",
    "notes": "Please call before delivery",
    "statusHistory": [
      {
        "status": "PENDING_PAYMENT",
        "timestamp": "<timestamp>",
        "updatedBy": "system"
      },
      {
        "status": "CONFIRMED",
        "timestamp": "<timestamp>",
        "updatedBy": "admin@worldg3nius.com",
        "reason": "Payment verified"
      }
    ],
    "createdAt": "<timestamp>",
    "updatedAt": "<timestamp>"
  },
  "message": "Success"
}

Frontend Page: /admin/orders/[id]
```

#### Test 23: Update Order Status
```
PUT http://localhost:8080/api/v1/admin/orders/<order-uuid>/status
Cookie: access_token=<admin-jwt>
Content-Type: application/json

{
  "status": "CONFIRMED",
  "reason": "Payment verified"
}

Expected Response: Updated order with new status
```

#### Test 23: Get Inventory
```
GET http://localhost:8080/api/v1/admin/inventory
Cookie: access_token=<admin-jwt>

Expected Response: List of all product inventories
```

#### Test 24: Adjust Inventory
```
POST http://localhost:8080/api/v1/admin/inventory/<product-uuid>/adjust
Cookie: access_token=<admin-jwt>
Content-Type: application/json

{
  "adjustment": 10,
  "reason": "Stock replenishment"
}

Expected Response: Updated inventory
```

#### Test 25: Get Admin Categories
```
GET http://localhost:8080/api/v1/admin/categories
Cookie: access_token=<admin-jwt>

Expected Response: All categories including inactive ones
```

#### Test 26: Create Category
```
POST http://localhost:8080/api/v1/admin/categories
Cookie: access_token=<admin-jwt>
Content-Type: application/json

{
  "name": "Test Category",
  "slug": "test-category",
  "description": "A test category",
  "displayOrder": 10
}

Expected Response: Created category
```

#### Test 27: Get Admin Notifications
```
GET http://localhost:8080/api/v1/admin/notifications
Cookie: access_token=<admin-jwt>

Expected Response: Paginated list of notifications
```

#### Test 28: Mark Notification as Read
```
POST http://localhost:8080/api/v1/admin/notifications/<notification-uuid>/read
Cookie: access_token=<admin-jwt>

Expected Response: Success
```

#### Test 29: Get Admin Users
```
GET http://localhost:8080/api/v1/admin/users?page=0&size=20
Cookie: access_token=<admin-jwt>

Expected Response:
{
  "status": true,
  "data": {
    "content": [
      {
        "id": "<user-uuid>",
        "username": "johndoe",
        "email": "john@example.com",
        "fullName": "John Doe",
        "phone": "+233201234567",
        "roles": ["ROLE_USER"],
        "emailVerified": true,
        "totalOrders": 12,
        "totalSpent": 2450.00,
        "createdAt": "<timestamp>",
        "lastOrderAt": "<timestamp>"
      },
      ...
    ],
    "totalElements": 50,
    "totalPages": 3,
    "size": 20,
    "number": 0
  },
  "message": "Success"
}

Frontend Page: /admin/customers
```

#### Test 30: Assign Roles to User (SUPER_ADMIN only)
```
POST http://localhost:8080/api/v1/admin/users/<user-uuid>/roles
Cookie: access_token=<super-admin-jwt>
Content-Type: application/json

{
  "roles": ["ROLE_USER", "ROLE_CONTENT_MANAGER"]
}

Expected Response:
{
  "status": true,
  "data": "Roles assigned",
  "message": "Roles assigned successfully"
}

Notes:
- Requires ROLE_SUPER_ADMIN permission
- Available roles: ROLE_USER, ROLE_SUPPORT_AGENT, ROLE_WAREHOUSE, ROLE_CONTENT_MANAGER, ROLE_SUPER_ADMIN
- Action is logged in audit trail

Frontend: Role assignment modal in /admin/customers (only visible to SUPER_ADMIN)
```

---

## Features NOT Tested (External Dependencies)

### Skipped - S3 Not Ready
- Image upload for products: `POST /admin/products/{id}/image`

### Skipped - Payment Gateway Not Ready
- Payment initiation: `POST /store/payments/{orderId}/initiate`
- Payment verification: `GET /store/payments/{id}/verify`
- Refunds: `POST /admin/payments/{id}/refund`

---

## How to Run Tests

1. Start the backend:
   ```bash
   cd /path/to/backend
   ./mvnw spring-boot:run
   ```

2. Ensure backend is running on http://localhost:8080

3. Start the frontend:
   ```bash
   cd /Users/kofitaylor/business/ecommerce-engine-frontend
   npm run dev
   ```

4. Test via browser at http://localhost:3000

5. Use curl or Postman to test individual endpoints using the examples above

---

## Test Execution Log

| Test # | Endpoint | Status | Notes |
|--------|----------|--------|-------|
| 1 | POST /auth/register | PENDING | |
| 2 | POST /auth/login | PENDING | |
| 3 | GET /auth/me | PENDING | |
| 4 | POST /auth/logout | PENDING | |
| 5 | GET /auth/verify-email | PENDING | Email verification |
| 6 | GET /store/categories | PENDING | |
| 7 | GET /store/products/search | PENDING | |
| 8 | GET /store/products/slug/{slug} | PENDING | |
| 9 | GET /store/products/featured | PENDING | |
| 10 | POST /store/cart/items | PENDING | |
| 11 | GET /store/cart | PENDING | |
| 12 | PUT /store/cart/items/{id} | PENDING | |
| 13 | DELETE /store/cart/items/{id} | PENDING | |
| 14 | POST /store/orders | PENDING | |
| 15 | GET /store/orders/my | PENDING | |
| 16 | GET /store/orders/{id} | PENDING | |
| 17 | POST /auth/login (admin) | PENDING | |
| 18 | GET /admin/analytics/dashboard | PENDING | |
| 19 | GET /admin/products | PENDING | |
| 20 | POST /admin/products | PENDING | |
| 21 | PUT /admin/products/{id} | PENDING | |
| 22 | GET /admin/orders | PENDING | |
| 23 | GET /admin/orders/{id} | PENDING | Admin order detail |
| 24 | PUT /admin/orders/{id}/status | PENDING | |
| 25 | GET /admin/inventory | PENDING | |
| 26 | POST /admin/inventory/{id}/adjust | PENDING | |
| 27 | GET /admin/categories | PENDING | |
| 28 | POST /admin/categories | PENDING | |
| 29 | GET /admin/notifications | PENDING | |
| 30 | POST /admin/notifications/{id}/read | PENDING | |
| 31 | GET /admin/users | PENDING | Admin customers list |
| 32 | POST /admin/users/{id}/roles | PENDING | Role assignment (SUPER_ADMIN) |

---

**Document Created:** 2026-01-16
**Frontend Version:** 1.0.0
**Author:** Claude Code
