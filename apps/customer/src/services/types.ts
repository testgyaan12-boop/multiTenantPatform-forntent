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

export interface SyncCartLine {
  menuItemId: number;
  variantId?: number;
  quantity: number;
  notes?: string;
  modifierIds: number[];
}

export interface CreateSessionInput {
  tableCode?: string;
  restaurantSlug?: string;
}

export interface PortalService {
  readonly isMock: boolean;
  getRestaurant(slug: string): Promise<RestaurantInfo>;
  getMenu(slug: string): Promise<PublicMenu>;
  getItem(slug: string, itemId: number): Promise<ItemDetail>;
  createSession(input: CreateSessionInput): Promise<GuestSessionInfo>;
  prepareCheckout(sessionToken: string, lines: SyncCartLine[]): Promise<CartTotals>;
  clearCart(sessionToken: string): Promise<CartTotals | void>;
  createOrder(sessionToken: string, customer: CheckoutCustomer): Promise<OrderSummary>;
  payOrder(publicToken: string, idempotencyKey: string): Promise<OrderSummary>;
  trackOrder(publicToken: string): Promise<OrderSummary>;
  getMyOrders(): Promise<OrderSummary[]>;
  getStore(slug: string): Promise<StoreInfo>;
  getStoreProducts(slug: string): Promise<StoreProducts>;
  getStoreItem(slug: string, itemId: number): Promise<StoreProduct>;
  submitInquiry(slug: string, input: StoreInquiryInput): Promise<StoreInquiryResult>;
}
