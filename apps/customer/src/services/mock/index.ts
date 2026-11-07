import type {
  CartTotals,
  GuestSessionInfo,
  ItemDetail,
  OrderStatus,
  OrderSummary,
  PublicMenu,
  StoreInfo,
  StoreInquiryResult,
  StoreProduct,
  StoreProducts,
} from '@/types';
import type { CreateSessionInput, PortalService, SyncCartLine } from '../types';
import { MOCK_CATEGORIES, MOCK_ITEMS, MOCK_ORDERS, MOCK_RESTAURANT } from './data';

interface MockCart {
  lines: SyncCartLine[];
}

interface CreatedOrder extends OrderSummary {
  paidAt?: string;
}

const carts = new Map<string, MockCart>();
const sessionMeta = new Map<string, { tableNumber?: string }>();
const createdOrders: CreatedOrder[] = [];
let sessionCounter = 0;
let orderCounter = 9000;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fail(status: number, code: string, message: string): never {
  throw { status, code, message };
}

function priceLine(line: SyncCartLine): {
  unitPrice: number;
  modifierTotal: number;
  name: string;
  imageUrl?: string;
} {
  const item = MOCK_ITEMS.find((candidate) => candidate.id === line.menuItemId);
  if (!item) fail(404, 'not_found', 'This item is no longer on the menu.');
  if (!item.isAvailable) fail(409, 'item_unavailable', `${item.name} is currently unavailable.`);

  let unitPrice = item.price;
  if (line.variantId != null) {
    const variant = item.variants.find((candidate) => candidate.id === line.variantId);
    if (!variant) fail(404, 'not_found', 'Selected size is not available.');
    unitPrice += variant.priceDelta;
  }

  let modifierTotal = 0;
  for (const modifierId of line.modifierIds) {
    const modifier = item.modifierGroups
      .flatMap((group) => group.modifiers)
      .find((candidate) => candidate.id === modifierId);
    if (!modifier) fail(400, 'invalid_modifier', 'Selected add-on is not available.');
    modifierTotal += modifier.priceDelta;
  }

  return { unitPrice, modifierTotal, name: item.name, imageUrl: item.imageUrl };
}

function totalsFor(lines: SyncCartLine[]): CartTotals {
  const items = lines.map((line, index) => {
    const priced = priceLine(line);
    const unitWithModifiers = priced.unitPrice + priced.modifierTotal;
    return {
      id: index + 1,
      menuItemId: line.menuItemId,
      name: priced.name,
      variantId: line.variantId,
      imageUrl: priced.imageUrl,
      quantity: line.quantity,
      unitPrice: priced.unitPrice,
      modifierTotal: priced.modifierTotal,
      lineTotal: unitWithModifiers * line.quantity,
      notes: line.notes,
      modifiers: line.modifierIds.map((modifierId) => {
        const modifier = MOCK_ITEMS.flatMap((item) => item.modifierGroups)
          .flatMap((group) => group.modifiers)
          .find((candidate) => candidate.id === modifierId)!;
        return { modifierId, name: modifier.name, priceDelta: modifier.priceDelta };
      }),
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const taxTotal = round(subtotal * MOCK_RESTAURANT.taxRate);
  const serviceCharge = round(subtotal * MOCK_RESTAURANT.serviceChargeRate);
  return {
    currency: MOCK_RESTAURANT.currency,
    subtotal: round(subtotal),
    taxTotal,
    serviceCharge,
    tipTotal: 0,
    discountTotal: 0,
    grandTotal: round(subtotal + taxTotal + serviceCharge),
    items,
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildMenu(): PublicMenu {
  return {
    restaurantName: MOCK_RESTAURANT.name,
    restaurantSlug: MOCK_RESTAURANT.slug,
    currency: MOCK_RESTAURANT.currency,
    categories: MOCK_CATEGORIES.map((category) => ({
      ...category,
      items: MOCK_ITEMS.filter((item) => item.categoryId === category.id).map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        isAvailable: item.isAvailable,
        isFeatured: item.isFeatured,
        isVegetarian: item.isVegetarian,
      })),
    })).filter((category) => category.items.length > 0),
  };
}

function statusAfterElapsed(order: CreatedOrder): OrderStatus {
  const placedAt = new Date(order.placedAt ?? Date.now()).getTime();
  const minutes = (Date.now() - placedAt) / 60_000;
  if (order.status === 'CANCELLED') return 'CANCELLED';
  if (order.paymentStatus === 'FAILED') return 'CANCELLED';
  if (minutes < 2) return 'PLACED';
  if (minutes < 5) return 'CONFIRMED';
  if (minutes < 12) return 'PREPARING';
  if (minutes < 20) return 'READY';
  if (minutes < 30) return 'SERVED';
  return 'COMPLETED';
}

function progressOrder(order: CreatedOrder): OrderSummary {
  return { ...order, status: statusAfterElapsed(order) };
}

export const mockService: PortalService = {
  isMock: true,

  async getRestaurant() {
    await wait(120);
    return MOCK_RESTAURANT;
  },

  async getMenu() {
    await wait(220);
    return buildMenu();
  },

  async getItem(_slug, itemId): Promise<ItemDetail> {
    await wait(180);
    const item = MOCK_ITEMS.find((candidate) => candidate.id === itemId);
    if (!item) fail(404, 'not_found', 'This dish could not be found.');
    return item;
  },

  async createSession(input: CreateSessionInput): Promise<GuestSessionInfo> {
    await wait(150);
    sessionCounter += 1;
    const token = `mock-session-${sessionCounter}`;
    const base = {
      sessionToken: token,
      expiresAt: new Date(Date.now() + 8 * 3600_000).toISOString(),
      branchId: 1,
      branchName: 'Main Branch',
      tenantId: 1,
      restaurantSlug: MOCK_RESTAURANT.slug,
      restaurantName: MOCK_RESTAURANT.name,
    };
    const isTable = Boolean(input.tableCode);
    if (isTable && input.tableCode !== 'invalid') {
      const tableNumber = input.tableCode!.replace(/^table-/, '') || '7';
      sessionMeta.set(token, { tableNumber });
      return { ...base, tableId: sessionCounter, tableNumber };
    }
    if (isTable) fail(404, 'not_found', 'Table QR code is not valid');
    sessionMeta.set(token, {});
    return base;
  },

  async clearCart(sessionToken): Promise<void> {
    carts.delete(sessionToken);
  },

  async prepareCheckout(sessionToken, lines): Promise<CartTotals> {
    await wait(320);
    if (lines.length === 0) fail(409, 'cart_empty', 'Add at least one item before checkout');
    carts.set(sessionToken, { lines });
    return totalsFor(lines);
  },

  async createOrder(sessionToken, customer): Promise<OrderSummary> {
    await wait(350);
    const cart = carts.get(sessionToken);
    if (!cart || cart.lines.length === 0) {
      fail(409, 'cart_empty', 'Add at least one item before checkout');
    }
    const totals = totalsFor(cart.lines);
    const meta = sessionMeta.get(sessionToken);
    orderCounter += 1;
    const order: CreatedOrder = {
      id: orderCounter,
      orderNumber: `SH-${String(orderCounter).slice(-4)}`,
      publicToken: `mock-created-${orderCounter}-${Date.now()}`,
      status: 'PLACED',
      paymentStatus: 'PENDING',
      source: meta?.tableNumber ? 'QR' : 'PICKUP',
      ...(meta?.tableNumber ? { tableNumber: meta.tableNumber } : {}),
      currency: totals.currency,
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      serviceCharge: totals.serviceCharge,
      tipTotal: totals.tipTotal,
      grandTotal: totals.grandTotal,
      customerName: customer.customerName || 'Guest',
      placedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      items: totals.items.map((item, index) => ({
        id: orderCounter * 100 + index,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        status: 'PLACED',
        notes: item.notes,
        modifiers: item.modifiers.map((modifier) => ({
          name: modifier.name,
          priceDelta: modifier.priceDelta,
        })),
      })),
    };
    createdOrders.unshift(order);
    carts.delete(sessionToken);
    return order;
  },

  async payOrder(publicToken): Promise<OrderSummary> {
    await wait(700);
    const order = createdOrders.find((candidate) => candidate.publicToken === publicToken);
    if (!order) fail(404, 'not_found', 'Order not found');
    order.paymentStatus = 'PAID';
    order.paidAt = new Date().toISOString();
    return progressOrder(order);
  },

  async trackOrder(publicToken): Promise<OrderSummary> {
    await wait(140);
    const created = createdOrders.find((candidate) => candidate.publicToken === publicToken);
    if (created) return progressOrder(created);
    const seeded = MOCK_ORDERS.find((candidate) => candidate.publicToken === publicToken);
    if (seeded) return seeded;
    fail(404, 'not_found', 'We could not find this order. Check your link and try again.');
  },

  async getMyOrders(): Promise<OrderSummary[]> {
    await wait(260);
    return [...createdOrders.map(progressOrder), ...MOCK_ORDERS].sort(
      (a, b) =>
        new Date(b.placedAt ?? b.createdAt ?? 0).getTime() -
        new Date(a.placedAt ?? a.createdAt ?? 0).getTime(),
    );
  },

  async getStore(slug): Promise<StoreInfo> {
    await wait(140);
    return {
      slug,
      name: 'Demo Store',
      description: null,
      logoUrl: null,
      cuisine: null,
      contactEmail: null,
      contactPhone: null,
      currency: 'USD',
      timezone: 'UTC',
      businessType: 'RESTAURANT',
      socialLinks: null,
      operatingHours: null,
      publicUrl: `http://localhost:5175/s/${slug}`,
      bookingPayment: { enabled: false, amount: 50 },
    };
  },

  async getStoreProducts(slug): Promise<StoreProducts> {
    await wait(160);
    return {
      slug,
      storeName: 'Demo Store',
      businessType: 'RESTAURANT',
      currency: 'USD',
      logoUrl: null,
      categories: [],
    };
  },

  async getStoreItem(_slug, _itemId): Promise<StoreProduct> {
    await wait(140);
    fail(404, 'not_found', 'This product is no longer available.');
    return undefined as never;
  },

  async submitInquiry(_slug, input): Promise<StoreInquiryResult> {
    await wait(220);
    if (!input.name) fail(400, 'name_required', 'Name is required');
    if (!input.phone) fail(400, 'phone_required', 'Phone number is required');
    return { id: 9001, status: 'NEW', booking: { required: false, amount: 50, orderPublicToken: null } };
  },
};
