import { create } from 'zustand';
import { Cart, CartItem } from '@/types';
import { apiClient } from '@/lib/api/client';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;

  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
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

  addItem: async (productId, quantity) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<{ status: boolean; data: Cart; message: string }>('/store/cart/items', {
        productId,
        quantity,
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

  updateQuantity: async (productId, quantity) => {
    const previousCart = get().cart;

    // Optimistic update
    if (previousCart) {
      const optimisticCart: Cart = {
        ...previousCart,
        items: previousCart.items.map((item) =>
          item.productId === productId
            ? { ...item, quantity, subtotal: item.unitPrice * quantity }
            : item
        ),
        subtotal: previousCart.items.reduce((sum, item) => {
          if (item.productId === productId) {
            return sum + item.unitPrice * quantity;
          }
          return sum + item.subtotal;
        }, 0),
      };
      set({ cart: optimisticCart });
    }

    try {
      const response = await apiClient.put<{ status: boolean; data: Cart; message: string }>(
        `/store/cart/items/${productId}`,
        { quantity }
      );
      set({ cart: response.data.data });
    } catch (error) {
      set({ cart: previousCart, error: 'Failed to update quantity' });
      throw error;
    }
  },

  removeItem: async (productId) => {
    const previousCart = get().cart;

    // Optimistic update
    if (previousCart) {
      const filteredItems = previousCart.items.filter((item) => item.productId !== productId);
      set({
        cart: {
          ...previousCart,
          items: filteredItems,
          itemCount: filteredItems.length,
          subtotal: filteredItems.reduce((sum, item) => sum + item.subtotal, 0),
        },
      });
    }

    try {
      const response = await apiClient.delete<{ status: boolean; data: Cart; message: string }>(
        `/store/cart/items/${productId}`
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
