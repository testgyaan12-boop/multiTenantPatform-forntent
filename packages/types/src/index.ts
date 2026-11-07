export interface PageMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface PageResponse<T> {
  content: T[];
  page: PageMeta;
}

export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  code?: string;
  fieldErrors?: Record<string, string>;
  timestamp?: string;
}

export interface ApiEnvelope<T> {
  data: T;
}

export type SortDirection = 'asc' | 'desc';

export interface PageQuery {
  page?: number;
  size?: number;
  sort?: string;
  direction?: SortDirection;
  search?: string;
}

export type UserRole =
  | 'SUPER_ADMIN'
  | 'TENANT_OWNER'
  | 'TENANT_MANAGER'
  | 'BRANCH_MANAGER'
  | 'STAFF'
  | 'KITCHEN'
  | 'CUSTOMER';

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  permissions: string[];
  tenantId: number | null;
  tenantName: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  displayName?: string | null;
  bio?: string | null;
  emailVerified?: boolean;
  status?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RestaurantRegistrationRequest {
  name: string;
  ownerFirstName: string;
  ownerLastName: string;
  email: string;
  password: string;
  timezone?: string;
  currency?: string;
}

export interface RegistrationResponse {
  status: string;
  message: string;
}

export interface TenantSummary {
  id: number;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'CANCELLED' | 'PENDING_VERIFICATION';
  createdAt: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  timezone?: string | null;
  currency?: string | null;
  trialEndsAt?: string | null;
  businessType?: string | null;
}

export type OrderStatus =
  | 'DRAFT'
  | 'PLACED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'AUTHORIZED' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface TenantCreateRequest {
  name: string;
  slug: string;
  ownerEmail: string;
  ownerFirstName: string;
  ownerLastName: string;
  planCode: string;
  timezone?: string;
  currency?: string;
  businessType?: 'RESTAURANT' | 'ELECTRONICS' | 'VEHICLE' | 'REAL_ESTATE';
}

export interface Branch {
  id: number;
  code: string;
  name: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  isDefault: boolean;
  status: 'ACTIVE' | 'PAUSED' | 'INACTIVE';
  timezone?: string | null;
  openingHours?: string | null;
  updatedAt?: string | null;
  managerId?: number | null;
  managerName?: string | null;
  currency?: string | null;
}

export interface BranchRequest {
  restaurantId: number;
  code: string;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  isDefault?: boolean;
  status?: string;
  timezone?: string;
  openingHours?: string;
  managerId?: number | null;
  currency?: string | null;
}

export interface MenuCategory {
  id: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
}

export interface MenuCategoryRequest {
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
}

export interface MenuItem {
  id: number;
  categoryId: number;
  sku: string;
  name: string;
  description?: string | null;
  price: number;
  cost?: number | null;
  currency: string;
  imageUrl?: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  prepTimeMinutes?: number | null;
  calories?: number | null;
  sortOrder: number;
  stockQty?: number | null;
  attributes?: MenuItemAttribute[] | null;
  updatedAt?: string | null;
}

export interface MenuItemAttribute {
  key: string;
  value: string;
}

export interface MenuItemRequest {
  categoryId: number;
  sku: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  imageUrl?: string;
  isAvailable?: boolean;
  isFeatured?: boolean;
  prepTimeMinutes?: number;
  calories?: number;
  sortOrder?: number;
  stockQty?: number;
  attributes?: MenuItemAttribute[];
}

export interface DiningTable {
  id: number;
  branchId: number;
  sectionId?: number | null;
  tableNumber: string;
  name?: string | null;
  capacity: number;
  status: string;
  qrToken: string;
}

export interface DiningTableRequest {
  tableNumber: string;
  name?: string;
  capacity?: number;
  sectionId?: number;
}

export interface PublicMenuItem {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
}

export interface PublicMenuCategory {
  id: number;
  name: string;
  description?: string | null;
  items: PublicMenuItem[];
}

export interface PublicMenu {
  restaurantName: string;
  currency: string;
  categories: PublicMenuCategory[];
}

export interface GuestSession {
  sessionToken: string;
  expiresAt: string;
  tableId: number;
  tableNumber: string;
  branchId: number;
  branchName: string;
  tenantId: number;
}

export interface CartItem {
  id: number;
  menuItemId: number;
  name: string;
  variantId?: number | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  notes?: string | null;
}

export interface Cart {
  id: number;
  status: string;
  currency: string;
  subtotal: number;
  taxTotal: number;
  serviceCharge: number;
  tipTotal: number;
  discountTotal: number;
  grandTotal: number;
  items: CartItem[];
}

export interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  status: string;
  notes?: string | null;
  modifiers?: { name: string; priceDelta: number }[] | null;
}

export interface OrderTimelineEntry {
  fromStatus: string | null;
  toStatus: string;
  changedAt: string;
  changedBy?: string | null;
}

export interface OrderCountsResponse {
  total: number;
  byStatus: Record<string, number>;
}

export interface Order {
  id: number;
  orderNumber: string;
  publicToken: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  source?: string | null;
  tableId?: number | null;
  tableNumber?: string | null;
  currency: string;
  subtotal: number;
  taxTotal: number;
  serviceCharge: number;
  tipTotal: number;
  discountTotal?: number;
  grandTotal: number;
  customerName?: string | null;
  customerPhone?: string | null;
  notes?: string | null;
  placedAt?: string | null;
  acceptedAt?: string | null;
  readyAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  items: OrderItem[];
}

export interface Payment {
  id: number;
  orderId: number;
  provider: string;
  status: string;
  amount: number;
  currency: string;
  paymentMethod?: string | null;
  capturedAt?: string | null;
  failureReason?: string | null;
}

export interface CheckoutRequest {
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  notes?: string;
  tipAmount?: number;
}

export interface SalesSummary {
  orderCount: number;
  grossRevenue: number;
  averageTicket: number;
  topItems: { name: string; quantity: number; revenue: number }[];
}

export interface CustomerSummary {
  customers: number;
  previousCustomers: number;
  registeredCustomers: number;
}

export interface SubscriptionPlan {
  code: string;
  name: string;
  description?: string | null;
  priceMonthly: number;
  currency: string;
  features?: string[] | null;
}

export interface RestaurantProfile {
  id: number;
  code: string;
  name: string;
  legalName?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  gallery?: string | null;
  brandColors?: string | null;
  timezone: string;
  currency: string;
  taxRate: number;
  serviceChargeRate: number;
  cuisine?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  website?: string | null;
  addressLine?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  businessRegistrationNumber?: string | null;
  taxNumber?: string | null;
  defaultLanguage?: string | null;
  socialLinks?: string | null;
  operatingHours?: string | null;
  publicUrl?: string | null;
  businessType?: string;
  tenantStatus?: string | null;
}

export interface RestaurantSubscription {
  planCode: string | null;
  planName: string | null;
  status: string | null;
  priceMonthly: number | null;
  currency: string | null;
  billingInterval: string | null;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean | null;
  branchLimit: number | null;
  branchUsage: number | null;
  features: string | null;
}

// ---------------------------------------------------------------- account profile

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  displayName?: string;
  bio?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface UserSession {
  id: number;
  device: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  current: boolean;
}

export interface UserPreferences {
  theme: 'SYSTEM' | 'LIGHT' | 'DARK';
  timeZone: string;
  dateFormat: string;
  language: string;
  emailNotifications: boolean;
  inAppNotifications: boolean;
}

export interface ActivityItem {
  id: number;
  timestamp: string;
  action: string;
  module: string;
  actor: string;
  details: string | null;
  result: 'SUCCESS' | 'FAILED';
}

export interface ActivityQuery {
  from?: string;
  to?: string;
  action?: string;
  page?: number;
  size?: number;
}

// ---------------------------------------------------------------- employees

export type StaffRoleCode =
  | 'TENANT_OWNER'
  | 'TENANT_MANAGER'
  | 'BRANCH_MANAGER'
  | 'STAFF'
  | 'KITCHEN'
  | 'ORDER_CONFIRMATION'
  | 'CHEF'
  | 'KITCHEN_HELPER'
  | 'WAITER'
  | 'CASHIER';

export interface Employee {
  id: number;
  userId: number | null;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string | null;
  branchId: number;
  branchName?: string | null;
  roles: string[];
  jobTitle?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  accountStatus: string;
  shiftName?: string | null;
  onDuty: boolean;
  onDutySince?: string | null;
  hiredAt?: string | null;
  lastLoginAt?: string | null;
  inviteUrl?: string | null;
}

export interface EmployeeStats {
  total: number;
  active: number;
  onDuty: number;
  byRole: Record<string, number>;
}

export interface AssignableRole {
  code: string;
  name: string;
  description?: string | null;
}

export interface StaffTask {
  id: number;
  branchId: number;
  branchName?: string | null;
  title: string;
  description?: string | null;
  taskType: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'ASSIGNED' | 'ACCEPTED' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';
  assignedToEmployeeId: number | null;
  assignedToName?: string | null;
  assignedToRole?: string | null;
  tableId?: number | null;
  tableNumber?: string | null;
  orderId?: number | null;
  orderNumber?: string | null;
  dueAt?: string | null;
  acceptedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  instructions?: string | null;
  statusNote?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  overdue: boolean;
}

export interface StaffTaskRequest {
  title: string;
  description?: string;
  taskType?: string;
  priority?: string;
  assignedToEmployeeId?: number;
  branchId?: number;
  tableId?: number | null;
  orderId?: number | null;
  dueAt?: string | null;
  instructions?: string;
}

export interface TableAssignment {
  id: number;
  tableId: number;
  tableNumber?: string | null;
  branchId: number;
  employeeId: number;
  employeeName: string;
  employeeRole?: string | null;
  assignedAt: string;
  releasedAt?: string | null;
}

export interface EmployeePerformance {
  from: string;
  to: string;
  tasksAssigned: number;
  tasksCompleted: number;
  completionRate?: number | null;
  avgCompletionMinutes?: number | null;
  ordersHandled?: number | null;
  avgConfirmationMinutes?: number | null;
  tablesServed?: number | null;
  attendanceTracked: boolean;
  history: { date: string; assigned: number; completed: number }[];
}

export interface AuditHistoryEntry {
  id: number;
  actorEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------- inquiries

export type InquiryStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CLOSED' | 'LOST';

export const INQUIRY_STATUSES: InquiryStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED', 'LOST'];

export interface Inquiry {
  id: number;
  itemId: number | null;
  itemName: string | null;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  sourceUrl: string | null;
  status: InquiryStatus;
  bookingPaymentStatus: string | null;
  bookingAmount: number | null;
  orderId: number | null;
  orderPublicToken: string | null;
  notes: string | null;
  createdAt: string;
}

export interface InquiryListQuery {
  status?: string;
  search?: string;
  page?: number;
  size?: number;
}

export interface InquiryUpdateRequest {
  status?: string;
  notes?: string;
}
