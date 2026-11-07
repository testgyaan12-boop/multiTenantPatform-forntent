import { describe, expect, it } from 'vitest';
import { mockService } from '@/services/mock';
import { MOCK_ORDERS, MOCK_RESTAURANT } from '@/services/mock/data';

describe('mock portal service', () => {
  it('exposes the sample restaurant', async () => {
    const restaurant = await mockService.getRestaurant('the-spice-house');
    expect(restaurant.slug).toBe(MOCK_RESTAURANT.slug);
    expect(restaurant.currency).toBe('INR');
    expect(restaurant.taxRate).toBeGreaterThan(0);
  });

  it('builds a menu with categories and sold-out state', async () => {
    const menu = await mockService.getMenu('the-spice-house');
    expect(menu.restaurantSlug).toBe('the-spice-house');
    expect(menu.currency).toBe('INR');
    const items = menu.categories.flatMap((category) => category.items);
    expect(items.length).toBeGreaterThanOrEqual(5);
    expect(items.some((item) => item.name === 'Masala Chai' && !item.isAvailable)).toBe(true);
    expect(items.some((item) => item.isVegetarian)).toBe(true);
  });

  it('returns item details with variants and modifier groups', async () => {
    const item = await mockService.getItem('the-spice-house', 2);
    expect(item.name).toBe('Chicken Biryani');
    expect(item.variants.length).toBeGreaterThan(0);
    expect(item.modifierGroups.some((group) => group.modifiers.length > 0)).toBe(true);
  });

  it('rejects unknown items', async () => {
    await expect(mockService.getItem('the-spice-house', 9999)).rejects.toMatchObject({
      status: 404,
    });
  });

  it('creates a pickup session for restaurant slug', async () => {
    const session = await mockService.createSession({ restaurantSlug: 'the-spice-house' });
    expect(session.sessionToken).toMatch(/^mock-session-/);
    expect(session.restaurantSlug).toBe('the-spice-house');
    expect(session.tableNumber).toBeUndefined();
  });

  it('creates a dine-in session from a valid table code', async () => {
    const session = await mockService.createSession({ tableCode: 'table-7' });
    expect(session.tableNumber).toBe('7');
  });

  it('rejects an invalid table code', async () => {
    await expect(mockService.createSession({ tableCode: 'invalid' })).rejects.toMatchObject({
      status: 404,
    });
  });

  it('prices a checkout with tax', async () => {
    const session = await mockService.createSession({ restaurantSlug: 'the-spice-house' });
    const totals = await mockService.prepareCheckout(session.sessionToken, [
      { menuItemId: 2, variantId: 21, quantity: 1, modifierIds: [9111] },
      { menuItemId: 4, quantity: 2, modifierIds: [] },
    ]);
    expect(totals.subtotal).toBe(299 + 30 + 49 * 2);
    expect(totals.taxTotal).toBe(Math.round((299 + 30 + 98) * 0.05 * 100) / 100);
    expect(totals.grandTotal).toBeGreaterThan(totals.subtotal);
  });

  it('blocks checkout with an unavailable item', async () => {
    const session = await mockService.createSession({ restaurantSlug: 'the-spice-house' });
    await expect(
      mockService.prepareCheckout(session.sessionToken, [{ menuItemId: 6, quantity: 1, modifierIds: [] }]),
    ).rejects.toMatchObject({ code: 'item_unavailable' });
  });

  it('runs the full order + payment + tracking lifecycle', async () => {
    const session = await mockService.createSession({ tableCode: 'table-3' });
    await mockService.prepareCheckout(session.sessionToken, [
      { menuItemId: 1, quantity: 1, modifierIds: [9102] },
    ]);

    const order = await mockService.createOrder(session.sessionToken, { customerName: 'Aarav' });
    expect(order.status).toBe('PLACED');
    expect(order.paymentStatus).toBe('PENDING');
    expect(order.source).toBe('QR');
    expect(order.tableNumber).toBe('3');
    expect(order.customerName).toBe('Aarav');
    expect(order.items[0]?.modifiers[0]?.name).toBe('Medium');

    const paid = await mockService.payOrder(order.publicToken, 'idem-1');
    expect(paid.paymentStatus).toBe('PAID');

    const tracked = await mockService.trackOrder(order.publicToken);
    expect(tracked.publicToken).toBe(order.publicToken);
    expect(['PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED']).toContain(
      tracked.status,
    );
  });

  it('lists seeded history orders newest first', async () => {
    const orders = await mockService.getMyOrders();
    expect(orders.length).toBeGreaterThanOrEqual(MOCK_ORDERS.length);
    const dates = orders.map((order) => new Date(order.placedAt ?? order.createdAt ?? 0).getTime());
    expect([...dates].sort((a, b) => b - a)).toEqual(dates);
  });

  it('404s on unknown tracking tokens', async () => {
    await expect(mockService.trackOrder('missing-token')).rejects.toMatchObject({ status: 404 });
  });
});
