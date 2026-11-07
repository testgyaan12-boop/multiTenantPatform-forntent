import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartModifier, OrderType } from '@/types';

export interface StoredCartItem {
  key: string;
  menuItemId: number;
  name: string;
  imageUrl?: string;
  basePrice: number;
  variantId?: number;
  variantName?: string;
  modifiers: CartModifier[];
  quantity: number;
  notes?: string;
}

export interface RestaurantContext {
  slug: string;
  name: string;
  currency: string;
}

interface CartState {
  restaurant: RestaurantContext | null;
  orderType: OrderType;
  items: StoredCartItem[];
  setRestaurant: (restaurant: RestaurantContext) => void;
  setOrderType: (orderType: OrderType) => void;
  addItem: (item: Omit<StoredCartItem, 'key'>) => string;
  updateQuantity: (key: string, quantity: number) => void;
  updateNotes: (key: string, notes: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
}

function lineKey(input: Omit<StoredCartItem, 'key'>): string {
  const modifiers = [...input.modifiers]
    .map((modifier) => modifier.modifierId)
    .sort((a, b) => a - b)
    .join(',');
  return [input.menuItemId, input.variantId ?? '-', modifiers, input.notes?.trim() ?? '-'].join('|');
}

export function estimateItemTotal(item: StoredCartItem): number {
  const modifierTotal = item.modifiers.reduce((sum, modifier) => sum + modifier.priceDelta, 0);
  return (item.basePrice + modifierTotal) * item.quantity;
}

export function estimateSubtotal(items: StoredCartItem[]): number {
  return items.reduce((sum, item) => sum + estimateItemTotal(item), 0);
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      restaurant: null,
      orderType: 'pickup',
      items: [],
      setRestaurant: (restaurant) => {
        const current = get().restaurant;
        if (current && current.slug !== restaurant.slug) {
          set({ restaurant, items: [], orderType: 'pickup' });
          return;
        }
        if (!current) set({ restaurant });
      },
      setOrderType: (orderType) => set({ orderType }),
      addItem: (input) => {
        const key = lineKey(input);
        const existing = get().items.find((item) => item.key === key);
        if (existing) {
          set({
            items: get().items.map((item) =>
              item.key === key ? { ...item, quantity: item.quantity + input.quantity } : item,
            ),
          });
          return key;
        }
        set({ items: [...get().items, { ...input, key }] });
        return key;
      },
      updateQuantity: (key, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((item) => item.key !== key) });
          return;
        }
        set({
          items: get().items.map((item) => (item.key === key ? { ...item, quantity } : item)),
        });
      },
      updateNotes: (key, notes) =>
        set({
          items: get().items.map((item) => (item.key === key ? { ...item, notes } : item)),
        }),
      removeItem: (key) => set({ items: get().items.filter((item) => item.key !== key) }),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'resto-cart-v1',
      partialize: (state) => ({
        restaurant: state.restaurant,
        orderType: state.orderType,
        items: state.items,
      }),
    },
  ),
);

export function selectCartCount(state: CartState): number {
  return state.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function selectSubtotal(state: CartState): number {
  return estimateSubtotal(state.items);
}
