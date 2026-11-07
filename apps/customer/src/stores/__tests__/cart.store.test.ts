import { beforeEach, describe, expect, it } from 'vitest';
import {
  estimateSubtotal,
  selectCartCount,
  useCartStore,
  type StoredCartItem,
} from '@/stores/cart.store';

const paneer: Omit<StoredCartItem, 'key'> = {
  menuItemId: 1,
  name: 'Paneer Tikka',
  imageUrl: 'x.png',
  basePrice: 249,
  modifiers: [{ modifierId: 9101, name: 'Mild', priceDelta: 0 }],
  quantity: 1,
};

describe('cart store', () => {
  beforeEach(() => {
    useCartStore.setState({ restaurant: null, orderType: 'pickup', items: [] });
  });

  it('adds an item and returns its merge key', () => {
    const key = useCartStore.getState().addItem(paneer);
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.key).toBe(key);
    expect(selectCartCount(state)).toBe(1);
  });

  it('merges identical lines instead of duplicating', () => {
    useCartStore.getState().addItem(paneer);
    useCartStore.getState().addItem(paneer);
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.quantity).toBe(2);
    expect(selectCartCount(state)).toBe(2);
  });

  it('keeps different variants/modifiers as separate lines', () => {
    useCartStore.getState().addItem(paneer);
    useCartStore.getState().addItem({
      ...paneer,
      variantId: 22,
      variantName: 'Family',
      basePrice: 499,
    });
    expect(useCartStore.getState().items).toHaveLength(2);
  });

  it('updates quantity and removes at zero', () => {
    const key = useCartStore.getState().addItem(paneer);
    useCartStore.getState().updateQuantity(key, 5);
    expect(useCartStore.getState().items[0]?.quantity).toBe(5);
    expect(estimateSubtotal(useCartStore.getState().items)).toBe(249 * 5);

    useCartStore.getState().updateQuantity(key, 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('clears items when the restaurant changes', () => {
    useCartStore.getState().setRestaurant({ slug: 'a', name: 'A', currency: 'USD' });
    useCartStore.getState().addItem(paneer);
    useCartStore.getState().setRestaurant({ slug: 'b', name: 'B', currency: 'USD' });

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(0);
    expect(state.restaurant?.slug).toBe('b');
    expect(state.orderType).toBe('pickup');
  });

  it('clear() empties the cart', () => {
    useCartStore.getState().addItem(paneer);
    useCartStore.getState().clear();
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
