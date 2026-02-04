import { create } from 'zustand';
import { Cart, CartItem } from '@/types';
import { apiClient } from '@/lib/api/client';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;

  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity: number, selectedOptions?: Record<string, string>) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, itemKey?: string, selectedOptions?: Record<string, string>) => Promise<void>;
  removeItem: (productId: string, itemKey?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  clearError: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isLoading: false,
  error: null,

  fetchCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<{ status: boolean; data: Cart; message: string }>('/store/cart');
      set({ cart: response.data.data });
    } catch (error) {
      set({ error: 'Failed to load cart' });
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (productId, quantity, selectedOptions) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<{ status: boolean; data: Cart; message: string }>('/store/cart/items', {
        productId,
        quantity,
        selectedOptions,
      });
      set({ cart: response.data.data });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { data?: { errorCode?: string } } } };
      const errorCode = err.response?.data?.data?.errorCode;
      if (errorCode === 'INSUFFICIENT_STOCK') {
        set({ error: 'Not enough stock available' });
      } else {
        set({ error: 'Failed to add item' });
      }
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateQuantity: async (productId, quantity, itemKey, selectedOptions) => {
    const previousCart = get().cart;
    const matchesItem = (item: CartItem) =>
      itemKey ? item.itemKey === itemKey : item.productId === productId;

    // Optimistic update
    if (previousCart) {
      const optimisticCart: Cart = {
        ...previousCart,
        items: previousCart.items.map((item) =>
          matchesItem(item)
            ? { ...item, quantity, subtotal: item.priceAtAdd * quantity }
            : item
        ),
        totalAmount: previousCart.items.reduce((sum, item) => {
          if (matchesItem(item)) {
            return sum + item.priceAtAdd * quantity;
          }
          return sum + item.subtotal;
        }, 0),
      };
      set({ cart: optimisticCart });
    }

    try {
      const response = await apiClient.put<{ status: boolean; data: Cart; message: string }>(
        `/store/cart/items/${productId}`,
        { quantity, itemKey, selectedOptions }
      );
      set({ cart: response.data.data });
    } catch (error) {
      set({ cart: previousCart, error: 'Failed to update quantity' });
      throw error;
    }
  },

  removeItem: async (productId, itemKey) => {
    const previousCart = get().cart;
    const matchesItem = (item: CartItem) =>
      itemKey ? item.itemKey === itemKey : item.productId === productId;

    // Optimistic update
    if (previousCart) {
      const filteredItems = previousCart.items.filter((item) => !matchesItem(item));
      set({
        cart: {
          ...previousCart,
          items: filteredItems,
          itemCount: filteredItems.length,
          totalAmount: filteredItems.reduce((sum, item) => sum + item.subtotal, 0),
        },
      });
    }

    try {
      const query = itemKey ? `?itemKey=${encodeURIComponent(itemKey)}` : '';
      const response = await apiClient.delete<{ status: boolean; data: Cart; message: string }>(
        `/store/cart/items/${productId}${query}`
      );
      set({ cart: response.data.data });
    } catch (error) {
      set({ cart: previousCart, error: 'Failed to remove item' });
      throw error;
    }
  },

  clearCart: async () => {
    try {
      await apiClient.post('/store/cart/clear');
      set({ cart: null });
    } catch (error) {
      set({ error: 'Failed to clear cart' });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
