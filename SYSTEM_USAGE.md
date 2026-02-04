# System Usage Guide

**Audit Note (2026-01-21):** For architecture, setup, and auth/error conventions, see `README.md`.

This guide explains how to use the Ghana e-commerce system across storefront and admin.

## Storefront (Customer)
- Browse products: Use Home, Products, or Category pages.
- Product details: Open a product to see price, images, and stock availability.
- Cart: Add products to cart, adjust quantities, then proceed to checkout.
- Checkout: Creates an order from the current cart and initiates payment (guest checkout supported).
- Orders: View order history and status in the Account area.

## Admin (Back Office)
### Products
- Create product: Provide name, price, SKU, category.
- Inventory is created after product creation (even if stock = 0).
- Edit product: Upload images (thumbnails shown in admin lists and storefront cards).
- Adjust stock in the Edit Product page under Inventory.

### Inventory
- Track stock levels per product (stock, reserved, available).
- Adjust stock using RESTOCK/ADJUSTMENT/SALE/RESERVE/RELEASE types.

### Orders
- View and manage order status transitions (PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED).

### Payments
- Initiate and verify payments.

### Notifications
- Low stock alerts and operational notifications appear in Admin Notifications.

## Key API Notes
- Product images are stored under `attributes.images` with sizes: thumbnail, medium, large, original.
- Inventory is separate from product creation and must exist to show stock.

## Common Troubleshooting
- Missing images: Ensure S3 bucket/object is public or use signed URLs.
- Stock not showing: Confirm inventory record exists for the product.
- Payment initiation errors: Check Paystack/Hubtel credentials.
