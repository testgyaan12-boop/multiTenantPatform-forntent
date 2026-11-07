import type { CartTotals, RestaurantInfo } from '@/types';
import type { StoredCartItem } from '@/stores/cart.store';
import { estimateSubtotal } from '@/stores/cart.store';

export interface EstimateInput {
  items: StoredCartItem[];
  taxRate?: number;
  serviceChargeRate?: number;
  currency?: string;
}

export function estimateTotals({
  items,
  taxRate = 0,
  serviceChargeRate = 0,
  currency = 'USD',
}: EstimateInput): CartTotals {
  const subtotal = round(estimateSubtotal(items));
  const taxTotal = round(subtotal * taxRate);
  const serviceCharge = round(subtotal * serviceChargeRate);
  return {
    currency,
    subtotal,
    taxTotal,
    serviceCharge,
    tipTotal: 0,
    discountTotal: 0,
    grandTotal: round(subtotal + taxTotal + serviceCharge),
    items: [],
  };
}

export function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function taxLabel(restaurant: RestaurantInfo | undefined): string {
  if (!restaurant || !restaurant.taxRate) return 'Taxes';
  return `Taxes (${(restaurant.taxRate * 100).toFixed(0)}%)`;
}

export function serviceLabel(restaurant: RestaurantInfo | undefined): string {
  if (!restaurant || !restaurant.serviceChargeRate) return 'Service charge';
  return `Service charge (${(restaurant.serviceChargeRate * 100).toFixed(0)}%)`;
}
