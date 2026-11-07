import type { OrderSummary } from '@/types';

const KEY = 'resto-orders-v1';

interface SavedOrderRef {
  publicToken: string;
  orderNumber: string;
  restaurantSlug: string;
  restaurantName: string;
  savedAt: number;
}

export function rememberOrder(ref: Omit<SavedOrderRef, 'savedAt'>): void {
  try {
    const raw = localStorage.getItem(KEY);
    const list: SavedOrderRef[] = raw ? (JSON.parse(raw) as SavedOrderRef[]) : [];
    const next = [ { ...ref, savedAt: Date.now() }, ...list.filter((entry) => entry.publicToken !== ref.publicToken) ].slice(0, 50);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage unavailable
  }
}

export function listSavedOrderRefs(restaurantSlug?: string): SavedOrderRef[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list: SavedOrderRef[] = raw ? (JSON.parse(raw) as SavedOrderRef[]) : [];
    return restaurantSlug ? list.filter((entry) => entry.restaurantSlug === restaurantSlug) : list;
  } catch {
    return [];
  }
}

export function savedOrderRefsToTokens(restaurantSlug?: string): string[] {
  return listSavedOrderRefs(restaurantSlug).map((entry) => entry.publicToken);
}

export function filterOrdersForRestaurant(
  orders: OrderSummary[],
  restaurantSlug: string,
): OrderSummary[] {
  const refs = listSavedOrderRefs(restaurantSlug);
  const tokens = new Set(refs.map((ref) => ref.publicToken));
  return orders.filter((order) => tokens.has(order.publicToken));
}
