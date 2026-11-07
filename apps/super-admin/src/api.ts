import {
  createApiClient,
  createAuthApi,
  createPublicApi,
  createTenantApi,
} from '@resto/api-client';
import { STORAGE_KEYS } from '@resto/config';

export const apiClient = createApiClient({
  getAccessToken: () => localStorage.getItem(STORAGE_KEYS.accessToken),
  onUnauthorized: () => {
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    localStorage.removeItem('resto.auth-user');
    if (!window.location.pathname.startsWith('/login')) {
      sessionStorage.setItem('resto.session-expired', '1');
      window.location.assign('/login');
    }
  },
  onTokensRefreshed: (tokens) => {
    localStorage.setItem(STORAGE_KEYS.accessToken, tokens.accessToken);
  },
});

export const authApi = createAuthApi(apiClient);
export const tenantApi = createTenantApi(apiClient);
export const publicApi = createPublicApi(apiClient);

export const profileApi = {
  me: () => authApi.me(),
  update: (payload: import('@resto/types').UpdateProfilePayload) => authApi.updateMe(payload),
  changePassword: (payload: import('@resto/types').ChangePasswordPayload) => authApi.changePassword(payload),
  sessions: () => authApi.listSessions(),
  revokeSession: (id: number) => authApi.revokeSession(id),
  revokeOtherSessions: () => authApi.revokeOtherSessions(),
  preferences: () => authApi.getPreferences(),
  savePreferences: (payload: import('@resto/types').UserPreferences) => authApi.savePreferences(payload),
  activity: (query: import('@resto/types').ActivityQuery = {}) => authApi.getActivity(query),
};

// ---------- platform response types ----------

export interface StatsBucket {
  total: number;
  active: number;
  paused: number;
  inactive: number;
  trial: number;
  suspended: number;
  pending: number;
  cancelled: number;
  trialing: number;
  expiringSoon: number;
}

export interface StatsResponse {
  tenants: StatsBucket;
  branches: StatsBucket;
  users: StatsBucket;
  subscriptions: StatsBucket;
  mrr: number;
  invoiceOpen: number;
  outstandingAmount: number;
  paidThisMonth: number;
  planDistribution: { code: string; name: string; subscribers: number; mrr: number }[];
  revenueLast12Months: { month: string; amount: number }[];
}

export interface MonthAmount {
  month: string;
  amount: number;
}

export interface SalesReportResponse {
  days: number;
  gross: number;
  orders: number;
  cancelled: number;
  avgTicket: number;
  daily: { date: string; gross: number; orders: number }[];
}

export interface CustomersReportResponse {
  total: number;
  createdInRange: number;
  rangeDays: number;
}

export interface UsageResponse {
  tenantId: number;
  tenantName: string;
  branches: { used: number; limit: number | null };
  employees: { used: number; limit: number | null };
  menuItems: { used: number; limit: number | null };
  orders: number;
  customers: number;
  planCode: string | null;
  subscriptionStatus: string | null;
}

export interface SubscriptionView {
  id: number;
  tenantId: number;
  tenantName: string;
  planId: number;
  planCode: string;
  planName: string;
  status: string;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  priceMonthly: number | null;
  createdAt: string;
}

export interface PlanView {
  id: number;
  code: string;
  name: string;
  description: string | null;
  businessType: string;
  priceMonthly: number;
  priceQuarterly: number | null;
  priceYearly: number | null;
  currency: string;
  status: string;
  trialDays: number;
  setupFee: number | null;
  taxPercent: number | null;
  yearlyDiscountPercent: number | null;
  maxBranches: number | null;
  maxEmployees: number | null;
  maxMenuItems: number | null;
  maxOrdersPerMonth: number | null;
  maxStorageGb: number | null;
  maxAdminUsers: number | null;
  maxCustomers: number | null;
  features: string | null;
  isPublic: boolean;
  sortOrder: number;
  subscriberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlanRequest {
  code: string;
  name: string;
  description?: string;
  businessType?: string;
  priceMonthly: number;
  priceQuarterly?: number | null;
  priceYearly?: number | null;
  currency: string;
  status?: string;
  trialDays?: number;
  setupFee?: number | null;
  taxPercent?: number | null;
  yearlyDiscountPercent?: number | null;
  maxBranches?: number | null;
  maxEmployees?: number | null;
  maxMenuItems?: number | null;
  maxOrdersPerMonth?: number | null;
  maxStorageGb?: number | null;
  maxAdminUsers?: number | null;
  maxCustomers?: number | null;
  features?: string;
  isPublic: boolean;
  sortOrder: number;
}

export interface PlanPriceHistoryView {
  id: number;
  oldPriceMonthly: number | null;
  newPriceMonthly: number | null;
  oldPriceQuarterly: number | null;
  newPriceQuarterly: number | null;
  oldPriceYearly: number | null;
  newPriceYearly: number | null;
  currency: string;
  changedBy: string | null;
  createdAt: string;
}

export interface InvoiceView {
  id: number;
  tenantId: number;
  tenantName: string;
  subscriptionId: number;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: string;
  dueAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface UserView {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: string;
  tenantId: number | null;
  tenantName: string;
  lastLoginAt: string | null;
  emailVerified: boolean;
  roles: string[];
  createdAt: string;
}

export interface RoleView {
  id: number;
  code: string;
  name: string;
  description: string | null;
  systemRole: boolean;
  tenantId: number | null;
  permissionIds: number[];
  permissions: string[];
}

export interface PermissionView {
  id: number;
  code: string;
  name: string;
}

export interface BranchView {
  id: number;
  tenantId: number;
  tenantName: string;
  restaurantId: number;
  code: string;
  name: string;
  city: string | null;
  country: string;
  status: string;
  currency: string | null;
  isDefault: boolean;
  createdAt: string;
}

export interface AuditView {
  id: number;
  tenantId: number | null;
  actorId: number | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  ipAddress: string | null;
  requestId: string | null;
  createdAt: string;
}

export interface NotificationView {
  id: number;
  tenantId: number | null;
  userId: number | null;
  channel: string;
  templateCode: string;
  subject: string | null;
  body: string | null;
  status: string;
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface CouponView {
  id: number;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  startsAt: string | null;
  endsAt: string | null;
  maxRedemptions: number | null;
  redeemedCount: number;
  tenantId: number | null;
  createdAt: string;
}

export interface SettingView {
  id: number;
  key: string;
  value: string | null;
  description: string | null;
  category: string;
}

export interface FlagView {
  id: number;
  key: string;
  description: string | null;
  enabled: boolean;
  planCode: string | null;
}

interface Paged<T> {
  content: T[];
  page: { page: number; size: number; totalElements: number; totalPages: number };
}

export interface TenantStoreSettings {
  tenantId: number;
  businessType: string;
  storeName: string;
  slug: string;
  bookingPaymentEnabled: boolean;
  bookingPaymentAmount: number;
}

const pageQuery = (query: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined && value !== ''));

export const platformApi = {
  stats: () => apiClient.get<StatsResponse>('/superadmin/stats').then((r) => r.data),
  revenue: (months = 12) =>
    apiClient.get<MonthAmount[]>('/superadmin/stats/revenue', { params: { months } }).then((r) => r.data),
  sales: (days = 30) =>
    apiClient.get<SalesReportResponse>('/superadmin/reports/sales', { params: { days } }).then((r) => r.data),
  customers: (days = 30) =>
    apiClient.get<CustomersReportResponse>('/superadmin/reports/customers', { params: { days } }).then((r) => r.data),
  usage: (tenantId: number) =>
    apiClient.get<UsageResponse>(`/superadmin/tenants/${tenantId}/usage`).then((r) => r.data),

  subscriptions: (query: Record<string, unknown> = {}) =>
    apiClient.get<Paged<SubscriptionView>>('/superadmin/subscriptions', { params: pageQuery(query) }).then((r) => r.data),
  assignSubscription: (payload: { tenantId: number; planCode: string }) =>
    apiClient.post<SubscriptionView>('/superadmin/subscriptions', payload).then((r) => r.data),
  cancelSubscription: (id: number) =>
    apiClient.post<SubscriptionView>(`/superadmin/subscriptions/${id}/cancel`).then((r) => r.data),
  activateSubscription: (id: number) =>
    apiClient.post<SubscriptionView>(`/superadmin/subscriptions/${id}/activate`).then((r) => r.data),

  plans: () => apiClient.get<PlanView[]>('/superadmin/plans').then((r) => r.data),
  plan: (code: string) => apiClient.get<PlanView>(`/superadmin/plans/${code}`).then((r) => r.data),
  planPriceHistory: (code: string) =>
    apiClient.get<PlanPriceHistoryView[]>(`/superadmin/plans/${code}/price-history`).then((r) => r.data),
  changePlanStatus: (code: string, status: string) =>
    apiClient.post<PlanView>(`/superadmin/plans/${code}/status`, { status }).then((r) => r.data),
  createPlan: (payload: PlanRequest) =>
    apiClient.post<PlanView>('/superadmin/plans', payload).then((r) => r.data),
  updatePlan: (code: string, payload: PlanRequest) =>
    apiClient.put<PlanView>(`/superadmin/plans/${code}`, payload).then((r) => r.data),
  deletePlan: (code: string) => apiClient.delete(`/superadmin/plans/${code}`),

  invoices: (query: Record<string, unknown> = {}) =>
    apiClient.get<Paged<InvoiceView>>('/superadmin/invoices', { params: pageQuery(query) }).then((r) => r.data),
  markInvoicePaid: (id: number) =>
    apiClient.post<InvoiceView>(`/superadmin/invoices/${id}/mark-paid`).then((r) => r.data),
  voidInvoice: (id: number) =>
    apiClient.post<InvoiceView>(`/superadmin/invoices/${id}/void`).then((r) => r.data),

  users: (query: Record<string, unknown> = {}) =>
    apiClient.get<Paged<UserView>>('/superadmin/users', { params: pageQuery(query) }).then((r) => r.data),
  suspendUser: (id: number) =>
    apiClient.post<UserView>(`/superadmin/users/${id}/suspend`).then((r) => r.data),
  activateUser: (id: number) =>
    apiClient.post<UserView>(`/superadmin/users/${id}/activate`).then((r) => r.data),
  resendInvite: (id: number) =>
    apiClient
      .post<{ user: UserView; inviteToken: string; inviteExpiresAt: string }>(`/superadmin/users/${id}/resend-invite`)
      .then((r) => r.data),

  roles: () => apiClient.get<RoleView[]>('/superadmin/roles').then((r) => r.data),
  permissions: () => apiClient.get<PermissionView[]>('/superadmin/permissions').then((r) => r.data),
  updateRolePermissions: (id: number, permissionIds: number[]) =>
    apiClient.put<RoleView>(`/superadmin/roles/${id}/permissions`, { permissionIds }).then((r) => r.data),

  branches: (query: Record<string, unknown> = {}) =>
    apiClient.get<Paged<BranchView>>('/superadmin/branches', { params: pageQuery(query) }).then((r) => r.data),
  updateBranchStatus: (id: number, status: string) =>
    apiClient.put<BranchView>(`/superadmin/branches/${id}/status`, { status }).then((r) => r.data),

  auditLogs: (query: Record<string, unknown> = {}) =>
    apiClient.get<Paged<AuditView>>('/superadmin/audit-logs', { params: pageQuery(query) }).then((r) => r.data),

  notifications: (query: Record<string, unknown> = {}) =>
    apiClient.get<Paged<NotificationView>>('/superadmin/notifications', { params: pageQuery(query) }).then((r) => r.data),
  markNotificationRead: (id: number) =>
    apiClient.post<NotificationView>(`/superadmin/notifications/${id}/read`).then((r) => r.data),
  broadcast: (payload: { subject: string; body: string }) =>
    apiClient.post<{ recipients: number }>('/superadmin/notifications/broadcast', payload).then((r) => r.data),

  coupons: () => apiClient.get<CouponView[]>('/superadmin/coupons').then((r) => r.data),
  createCoupon: (payload: Record<string, unknown>) =>
    apiClient.post<CouponView>('/superadmin/coupons', payload).then((r) => r.data),
  updateCoupon: (id: number, payload: Record<string, unknown>) =>
    apiClient.put<CouponView>(`/superadmin/coupons/${id}`, payload).then((r) => r.data),
  deleteCoupon: (id: number) => apiClient.delete(`/superadmin/coupons/${id}`),

  settings: (category?: string) =>
    apiClient.get<SettingView[]>('/superadmin/settings', { params: category ? { category } : {} }).then((r) => r.data),
  upsertSettings: (settings: { key: string; value: string }[]) =>
    apiClient.put<SettingView[]>('/superadmin/settings', { settings }).then((r) => r.data),
  integrations: () => apiClient.get<SettingView[]>('/superadmin/integrations').then((r) => r.data),
  upsertIntegrations: (settings: { key: string; value: string }[]) =>
    apiClient.put<SettingView[]>('/superadmin/integrations', { settings }).then((r) => r.data),

  flags: () => apiClient.get<FlagView[]>('/superadmin/feature-flags').then((r) => r.data),
  toggleFlag: (key: string, enabled: boolean) =>
    apiClient.put<FlagView>('/superadmin/feature-flags', { key, enabled }).then((r) => r.data),

  tenantStoreSettings: (tenantId: number) =>
    apiClient.get<TenantStoreSettings>(`/superadmin/tenants/${tenantId}/store-settings`).then((r) => r.data),
  updateTenantStoreSettings: (
    tenantId: number,
    payload: { bookingPaymentEnabled: boolean; bookingPaymentAmount: number },
  ) =>
    apiClient
      .put<TenantStoreSettings>(`/superadmin/tenants/${tenantId}/store-settings`, payload)
      .then((r) => r.data),
};
