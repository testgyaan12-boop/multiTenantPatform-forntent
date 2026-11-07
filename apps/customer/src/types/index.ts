export interface RestaurantInfo {
  slug: string;
  name: string;
  description?: string;
  logoUrl?: string;
  currency: string;
  taxRate: number;
  serviceChargeRate: number;
}

export interface MenuItemView {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  isFeatured: boolean;
  isVegetarian: boolean;
}

export interface CategoryGroup {
  id: number;
  name: string;
  description?: string;
  items: MenuItemView[];
}

export interface PublicMenu {
  restaurantName: string;
  restaurantSlug: string;
  currency: string;
  categories: CategoryGroup[];
}

export interface VariantView {
  id: number;
  name: string;
  priceDelta: number;
  isDefault: boolean;
}

export interface ModifierView {
  id: number;
  name: string;
  priceDelta: number;
}

export interface ModifierGroupView {
  id: number;
  name: string;
  selectionType: 'SINGLE' | 'MULTI';
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  modifiers: ModifierView[];
}

export interface ItemDetail extends MenuItemView {
  categoryId?: number;
  prepTimeMinutes?: number;
  calories?: number;
  variants: VariantView[];
  modifierGroups: ModifierGroupView[];
}

export interface GuestSessionInfo {
  sessionToken: string;
  expiresAt: string;
  tableId?: number;
  tableNumber?: string;
  branchId: number;
  branchName: string;
  tenantId: number;
  restaurantSlug?: string;
  restaurantName?: string;
}

export interface CartModifier {
  modifierId: number;
  name: string;
  priceDelta: number;
}

export interface CartLine {
  id: number | string;
  menuItemId: number;
  name: string;
  variantId?: number;
  variantName?: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  modifierTotal: number;
  lineTotal: number;
  notes?: string;
  modifiers: CartModifier[];
}

export interface CartTotals {
  currency: string;
  subtotal: number;
  taxTotal: number;
  serviceCharge: number;
  tipTotal: number;
  discountTotal: number;
  grandTotal: number;
  items: CartLine[];
}

export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface OrderItemView {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  status: string;
  notes?: string;
  modifiers: { name: string; priceDelta: number }[];
}

export interface OrderSummary {
  id: number;
  orderNumber: string;
  publicToken: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  source?: string;
  tableNumber?: string;
  currency: string;
  subtotal: number;
  taxTotal: number;
  serviceCharge: number;
  tipTotal: number;
  grandTotal: number;
  customerName?: string;
  notes?: string;
  placedAt?: string;
  createdAt?: string;
  items: OrderItemView[];
}

export interface CheckoutCustomer {
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  notes?: string;
  tipAmount?: number;
}

export interface PortalError {
  status: number;
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

export type OrderType = 'dine-in' | 'pickup';

export interface StoreBookingConfig {
  enabled: boolean;
  amount: number;
}

export interface StoreInfo {
  slug: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  cuisine: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  currency: string;
  timezone: string;
  businessType: string;
  socialLinks: string | null;
  operatingHours: string | null;
  publicUrl: string;
  bookingPayment: StoreBookingConfig;
}

export interface StoreAttribute {
  key: string;
  value: string;
}

export interface StoreVariant {
  id: number;
  name: string;
  priceDelta: number;
  isDefault: boolean;
}

export interface StoreProduct {
  id: number;
  categoryId: number | null;
  sku: string | null;
  name: string;
  description: string | null;
  price: number;
  currency: string | null;
  imageUrl: string | null;
  available: boolean;
  featured: boolean;
  stockQty: number | null;
  attributes: StoreAttribute[];
  variants: StoreVariant[];
}

export interface StoreCategory {
  id: number;
  name: string;
  items: StoreProduct[];
}

export interface StoreProducts {
  slug: string;
  storeName: string;
  businessType: string;
  currency: string;
  logoUrl: string | null;
  categories: StoreCategory[];
}

export interface StoreInquiryInput {
  name: string;
  phone: string;
  email?: string;
  message?: string;
  itemId?: number;
  sourceUrl?: string;
}

export interface StoreInquiryResult {
  id: number;
  status: string;
  booking: {
    required: boolean;
    amount: number;
    orderPublicToken: string | null;
  };
}
