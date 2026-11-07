import { http, request, SESSION_HEADER, IDEMPOTENCY_HEADER } from '@/lib/api-client';
import { savedOrderRefsToTokens } from '@/lib/order-history';
import type {
  CartTotals,
  CheckoutCustomer,
  GuestSessionInfo,
  ItemDetail,
  OrderSummary,
  PublicMenu,
  RestaurantInfo,
  StoreInfo,
  StoreInquiryInput,
  StoreInquiryResult,
  StoreProduct,
  StoreProducts,
} from '@/types';
import type {
  CreateSessionInput,
  PortalService,
  SyncCartLine,
} from './types';

export const realService: PortalService = {
  isMock: false,

  getRestaurant(slug) {
    return request<RestaurantInfo>(() => http.get(`/public/restaurants/${encodeURIComponent(slug)}`));
  },

  getMenu(slug) {
    return request<PublicMenu>(() => http.get(`/public/restaurants/${encodeURIComponent(slug)}/menu`));
  },

  getItem(slug, itemId) {
    return request<ItemDetail>(() =>
      http.get(`/public/restaurants/${encodeURIComponent(slug)}/items/${itemId}`),
    );
  },

  createSession(input: CreateSessionInput) {
    return request<GuestSessionInfo>(() =>
      http.post('/public/guest-sessions', {
        tableCode: input.tableCode ?? null,
        restaurantSlug: input.restaurantSlug ?? null,
      }),
    );
  },

  async prepareCheckout(sessionToken, lines: SyncCartLine[]): Promise<CartTotals> {
    const headers = { [SESSION_HEADER]: sessionToken };
    for (const line of lines) {
      await request(() =>
        http.post(
          '/public/cart/items',
          {
            menuItemId: line.menuItemId,
            variantId: line.variantId ?? null,
            quantity: line.quantity,
            notes: line.notes || null,
            modifierIds: line.modifierIds,
          },
          { headers },
        ),
      );
    }
    return request<CartTotals>(() => http.get('/public/cart', { headers }));
  },

  async clearCart(sessionToken): Promise<void> {
    await request(() =>
      http.delete('/public/cart', { headers: { [SESSION_HEADER]: sessionToken } }),
    );
  },

  createOrder(sessionToken, customer: CheckoutCustomer) {
    return request<OrderSummary>(() =>
      http.post(
        '/public/orders',
        {
          customerName: customer.customerName,
          customerPhone: customer.customerPhone || null,
          customerEmail: customer.customerEmail || null,
          notes: customer.notes || null,
          tipAmount: customer.tipAmount ?? null,
        },
        { headers: { [SESSION_HEADER]: sessionToken } },
      ),
    );
  },

  payOrder(publicToken, idempotencyKey) {
    return request<OrderSummary>(() =>
      http.post(
        `/public/orders/${encodeURIComponent(publicToken)}/pay`,
        {},
        { headers: { [IDEMPOTENCY_HEADER]: idempotencyKey } },
      ),
    );
  },

  trackOrder(publicToken) {
    return request<OrderSummary>(() =>
      http.get(`/public/orders/${encodeURIComponent(publicToken)}`),
    );
  },

  async getMyOrders(): Promise<OrderSummary[]> {
    const tokens = savedOrderRefsToTokens();
    const results = await Promise.allSettled(
      tokens.map((token) => realService.trackOrder(token)),
    );
    return results
      .filter(
        (result): result is PromiseFulfilledResult<OrderSummary> =>
          result.status === 'fulfilled',
      )
      .map((result) => result.value);
  },

  getStore(slug) {
    return request<StoreInfo>(() =>
      http.get(`/public/stores/${encodeURIComponent(slug)}`),
    );
  },

  getStoreProducts(slug) {
    return request<StoreProducts>(() =>
      http.get(`/public/stores/${encodeURIComponent(slug)}/products`),
    );
  },

  getStoreItem(slug, itemId) {
    return request<StoreProduct>(() =>
      http.get(`/public/stores/${encodeURIComponent(slug)}/products/${itemId}`),
    );
  },

  submitInquiry(slug, input: StoreInquiryInput) {
    return request<StoreInquiryResult>(() =>
      http.post(`/public/stores/${encodeURIComponent(slug)}/inquiries`, {
        name: input.name,
        phone: input.phone,
        email: input.email || null,
        message: input.message || null,
        itemId: input.itemId ?? null,
        sourceUrl: input.sourceUrl ?? null,
      }),
    );
  },
};
