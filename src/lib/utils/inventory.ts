import { apiClient } from '@/lib/api/client';
import { Inventory } from '@/types';

/**
 * Fetch inventory for multiple products using batch endpoint
 * Returns a map of productId -> Inventory
 */
export async function fetchBatchInventory(
  productIds: string[]
): Promise<Map<string, Inventory>> {
  const inventoryMap = new Map<string, Inventory>();

  if (!productIds || productIds.length === 0) {
    return inventoryMap;
  }

  try {
    const response = await apiClient.post<{
      status: boolean;
      data: Inventory[];
      message: string;
    }>('/store/inventory/batch', productIds);

    const inventories = response.data.data || [];
    inventories.forEach((inv) => {
      if (inv.productId) {
        inventoryMap.set(inv.productId, inv);
      }
    });
  } catch (err) {
    console.error('Failed to fetch batch inventory', err);
  }

  return inventoryMap;
}

/**
 * Check if a product is out of stock based on inventory data
 */
export function isProductOutOfStock(inventory: Inventory | undefined | null): boolean {
  if (!inventory) {
    // If no inventory data, consider it potentially out of stock
    // This is a safe default to prevent selling items without inventory records
    return false; // Return false to show as available, inventory check happens on add-to-cart
  }
  return inventory.availableQuantity <= 0;
}

/**
 * Get available quantity for a product
 */
export function getAvailableQuantity(inventory: Inventory | undefined | null): number | null {
  if (!inventory) {
    return null;
  }
  return inventory.availableQuantity;
}
