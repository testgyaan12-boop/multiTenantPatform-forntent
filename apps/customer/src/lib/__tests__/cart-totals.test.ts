import { describe, expect, it } from 'vitest';
import { estimateTotals, round, serviceLabel, taxLabel } from '@/lib/cart-totals';
import type { StoredCartItem } from '@/stores/cart.store';

const items: StoredCartItem[] = [
  {
    key: 'a',
    menuItemId: 1,
    name: 'Paneer Tikka',
    basePrice: 249,
    modifiers: [{ modifierId: 9101, name: 'Mild', priceDelta: 0 }],
    quantity: 2,
  },
  {
    key: 'b',
    menuItemId: 4,
    name: 'Butter Naan',
    basePrice: 49,
    modifiers: [],
    quantity: 3,
  },
];

describe('estimateTotals', () => {
  it('computes subtotal from base price + modifiers × quantity', () => {
    const totals = estimateTotals({ items, currency: 'INR' });
    expect(totals.subtotal).toBe(249 * 2 + 49 * 3);
    expect(totals.grandTotal).toBe(totals.subtotal);
  });

  it('applies tax and service rates and rounds to 2 decimals', () => {
    const totals = estimateTotals({ items, taxRate: 0.05, serviceChargeRate: 0.1, currency: 'USD' });
    const subtotal = 249 * 2 + 49 * 3;
    expect(totals.taxTotal).toBe(round(subtotal * 0.05));
    expect(totals.serviceCharge).toBe(round(subtotal * 0.1));
    expect(totals.grandTotal).toBe(round(subtotal + subtotal * 0.05 + subtotal * 0.1));
    expect(totals.currency).toBe('USD');
  });

  it('handles an empty cart', () => {
    const totals = estimateTotals({ items: [], taxRate: 0.05 });
    expect(totals.subtotal).toBe(0);
    expect(totals.grandTotal).toBe(0);
  });
});

describe('labels', () => {
  it('includes percentage when rate is set', () => {
    expect(taxLabel({ taxRate: 0.05 } as never)).toBe('Taxes (5%)');
    expect(serviceLabel({ serviceChargeRate: 0.1 } as never)).toBe('Service charge (10%)');
  });

  it('falls back to plain labels without rates', () => {
    expect(taxLabel(undefined)).toBe('Taxes');
    expect(serviceLabel(undefined)).toBe('Service charge');
  });
});
