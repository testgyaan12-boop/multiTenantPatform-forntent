import type { ApiClient } from './client';
import type {
  ActivityItem,
  ActivityQuery,
  AssignableRole,
  AuditHistoryEntry,
  AuthTokens,
  AuthUser,
  Branch,
  BranchRequest,
  Cart,
  ChangePasswordPayload,
  CheckoutRequest,
  CustomerSummary,
  DiningTable,
  DiningTableRequest,
  Employee,
  EmployeePerformance,
  EmployeeStats,
  GuestSession,
  Inquiry,
  InquiryListQuery,
  InquiryUpdateRequest,
  LoginRequest,
  MenuCategory,
  MenuCategoryRequest,
  MenuItem,
  MenuItemRequest,
  Order,
  OrderCountsResponse,
  OrderTimelineEntry,
  PageQuery,
  PageResponse,
  Payment,
  PublicMenu,
  RegistrationResponse,
  RestaurantRegistrationRequest,
  SalesSummary,
  StaffTask,
  StaffTaskRequest,
  SubscriptionPlan,
  TableAssignment,
  TenantCreateRequest,
  TenantSummary,
  UpdateProfilePayload,
  UserPreferences,
  UserSession,
} from '@resto/types';

export function createAuthApi(client: ApiClient) {
  return {
    login: async (payload: LoginRequest) =>
      (await client.post<AuthTokens>('/auth/login', payload)).data,
    logout: async () => {
      await client.post('/auth/logout');
    },
    me: async () => (await client.get<AuthUser>('/auth/me')).data,
    updateMe: async (payload: UpdateProfilePayload) =>
      (await client.put<AuthUser>('/auth/me', payload)).data,
    changePassword: async (payload: ChangePasswordPayload) => {
      await client.post('/auth/me/change-password', payload);
    },
    listSessions: async () => (await client.get<UserSession[]>('/auth/me/sessions')).data,
    revokeSession: async (id: number) => {
      await client.delete(`/auth/me/sessions/${id}`);
    },
    revokeOtherSessions: async () => {
      await client.post('/auth/me/sessions/revoke-others');
    },
    getPreferences: async () => (await client.get<UserPreferences>('/auth/me/preferences')).data,
    savePreferences: async (payload: UserPreferences) =>
      (await client.put<UserPreferences>('/auth/me/preferences', payload)).data,
    getActivity: async (query: ActivityQuery = {}) =>
      (await client.get<PageResponse<ActivityItem>>('/auth/me/activity', { params: query })).data,
    registerRestaurant: async (payload: RestaurantRegistrationRequest) =>
      (await client.post<RegistrationResponse>('/auth/register-restaurant', payload)).data,
    acceptInvite: async (payload: { token: string; password: string }) => {
      await client.post('/auth/accept-invite', payload);
    },
  };
}

export function createTenantApi(client: ApiClient) {
  return {
    list: async (query: PageQuery = {}) =>
      (await client.get<PageResponse<TenantSummary>>('/superadmin/tenants', { params: query }))
        .data,
    get: async (id: number) =>
      (await client.get<TenantSummary>(`/superadmin/tenants/${id}`)).data,
    create: async (payload: TenantCreateRequest) =>
      (await client.post<TenantSummary>('/superadmin/tenants', payload)).data,
    suspend: async (id: number) => {
      await client.post(`/superadmin/tenants/${id}/suspend`);
    },
    activate: async (id: number) => {
      await client.post(`/superadmin/tenants/${id}/activate`);
    },
    verify: async (id: number) => {
      await client.post(`/superadmin/tenants/${id}/verify`);
    },
    reject: async (id: number) => {
      await client.post(`/superadmin/tenants/${id}/reject`);
    },
  };
}

export function createBranchApi(client: ApiClient) {
  return {
    list: async () => (await client.get<Branch[]>('/branches')).data,
    get: async (id: number) => (await client.get<Branch>(`/branches/${id}`)).data,
    create: async (payload: BranchRequest) =>
      (await client.post<Branch>('/branches', payload)).data,
    update: async (id: number, payload: BranchRequest) =>
      (await client.put<Branch>(`/branches/${id}`, payload)).data,
    updateStatus: async (id: number, status: 'ACTIVE' | 'PAUSED' | 'INACTIVE') =>
      (await client.put<Branch>(`/branches/${id}/status`, { status })).data,
    remove: async (id: number) => {
      await client.delete(`/branches/${id}`);
    },
  };
}

export function createMenuApi(client: ApiClient) {
  return {
    categories: async () => (await client.get<MenuCategory[]>('/menu/categories')).data,
    createCategory: async (payload: MenuCategoryRequest) =>
      (await client.post<MenuCategory>('/menu/categories', payload)).data,
    updateCategory: async (id: number, payload: MenuCategoryRequest) =>
      (await client.put<MenuCategory>(`/menu/categories/${id}`, payload)).data,
    removeCategory: async (id: number) => {
      await client.delete(`/menu/categories/${id}`);
    },
    items: async (params: { categoryId?: number; search?: string } = {}) =>
      (await client.get<MenuItem[]>('/menu/items', { params })).data,
    createItem: async (payload: MenuItemRequest) =>
      (await client.post<MenuItem>('/menu/items', payload)).data,
    updateItem: async (id: number, payload: MenuItemRequest) =>
      (await client.put<MenuItem>(`/menu/items/${id}`, payload)).data,
    removeItem: async (id: number) => {
      await client.delete(`/menu/items/${id}`);
    },
  };
}

export function createTableApi(client: ApiClient) {
  return {
    list: async (branchId: number) =>
      (await client.get<DiningTable[]>('/tables', { params: { branchId } })).data,
    create: async (branchId: number, payload: DiningTableRequest) =>
      (await client.post<DiningTable>('/tables', payload, { params: { branchId } })).data,
    update: async (id: number, payload: DiningTableRequest) =>
      (await client.put<DiningTable>(`/tables/${id}`, payload)).data,
    rotateQr: async (id: number) =>
      (await client.post<DiningTable>(`/tables/${id}/rotate-qr`)).data,
    remove: async (id: number) => {
      await client.delete(`/tables/${id}`);
    },
  };
}

export function createOrderApi(client: ApiClient) {
  return {
    list: async (
      query: {
        branchId?: number;
        status?: string;
        paymentStatus?: string;
        source?: string;
        search?: string;
        days?: number;
        page?: number;
        size?: number;
      } = {},
    ) => (await client.get<PageResponse<Order>>('/orders', { params: query })).data,
    counts: async (branchId?: number | null, days?: number | null) =>
      (
        await client.get<OrderCountsResponse>('/orders/counts', {
          params: branchId == null && days == null
            ? {}
            : { branchId: branchId ?? undefined, days: days ?? undefined },
        })
      ).data,
    get: async (id: number) => (await client.get<Order>(`/orders/${id}`)).data,
    timeline: async (id: number) =>
      (await client.get<OrderTimelineEntry[]>(`/orders/${id}/timeline`)).data,
    updateStatus: async (id: number, status: string) =>
      (await client.post<Order>(`/orders/${id}/status`, null, { params: { status } })).data,
  };
}

export function createReportApi(client: ApiClient) {
  return {
    sales: async (days = 30, branchId?: number | null) =>
      (
        await client.get<SalesSummary>('/reports/sales', {
          params: branchId == null ? { days } : { days, branchId },
        })
      ).data,
    customers: async (days = 30, branchId?: number | null) =>
      (
        await client.get<CustomerSummary>('/reports/customers', {
          params: branchId == null ? { days } : { days, branchId },
        })
      ).data,
  };
}

export function createPublicApi(client: ApiClient) {
  return {
    plans: async () => (await client.get<SubscriptionPlan[]>('/public/plans')).data,
    menu: async (tableCode: string) =>
      (await client.get<PublicMenu>(`/public/menu/${tableCode}`)).data,
    startSession: async (tableCode: string) =>
      (await client.post<GuestSession>('/public/guest-sessions', { tableCode })).data,
    cart: async (sessionToken: string) =>
      (await client.get<Cart>('/public/cart', { headers: { 'X-Guest-Session': sessionToken } }))
        .data,
    addCartItem: async (
      sessionToken: string,
      payload: { menuItemId: number; quantity: number; notes?: string },
    ) =>
      (
        await client.post<Cart>('/public/cart/items', payload, {
          headers: { 'X-Guest-Session': sessionToken },
        })
      ).data,
    updateCartItem: async (sessionToken: string, itemId: number, quantity: number) =>
      (
        await client.put<Cart>(
          `/public/cart/items/${itemId}`,
          { quantity },
          { headers: { 'X-Guest-Session': sessionToken } },
        )
      ).data,
    removeCartItem: async (sessionToken: string, itemId: number) =>
      (
        await client.delete<Cart>(`/public/cart/items/${itemId}`, {
          headers: { 'X-Guest-Session': sessionToken },
        })
      ).data,
    checkout: async (sessionToken: string, payload: CheckoutRequest) =>
      (
        await client.post<Order>('/public/orders', payload, {
          headers: { 'X-Guest-Session': sessionToken },
        })
      ).data,
    pay: async (publicToken: string, idempotencyKey: string, method = 'card') =>
      (
        await client.post<Payment>(
          `/public/orders/${publicToken}/pay`,
          { method },
          { headers: { 'Idempotency-Key': idempotencyKey } },
        )
      ).data,
    trackOrder: async (publicToken: string) =>
      (await client.get<Order>(`/public/orders/${publicToken}`)).data,
  };
}

export function createInquiryApi(client: ApiClient) {
  return {
    list: async (query: InquiryListQuery = {}) =>
      (await client.get<PageResponse<Inquiry>>('/inquiries', { params: query })).data,
    update: async (id: number, payload: InquiryUpdateRequest) =>
      (await client.patch<Inquiry>(`/inquiries/${id}`, payload)).data,
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
export type TenantApi = ReturnType<typeof createTenantApi>;
export type BranchApi = ReturnType<typeof createBranchApi>;
export type MenuApi = ReturnType<typeof createMenuApi>;
export type TableApi = ReturnType<typeof createTableApi>;
export type OrderApi = ReturnType<typeof createOrderApi>;
export type ReportApi = ReturnType<typeof createReportApi>;
export type PublicApi = ReturnType<typeof createPublicApi>;
export type EmployeeApi = ReturnType<typeof createEmployeeApi>;
export type InquiryApi = ReturnType<typeof createInquiryApi>;
export type TaskApi = ReturnType<typeof createTaskApi>;
export type TableAssignmentApi = ReturnType<typeof createTableAssignmentApi>;

export interface EmployeeListQuery {
  branchId?: number;
  search?: string;
  status?: string;
  role?: string;
  onDuty?: boolean;
  page?: number;
  size?: number;
}

export function createEmployeeApi(client: ApiClient) {
  return {
    list: async (query: EmployeeListQuery = {}) =>
      (await client.get<PageResponse<Employee>>('/employees', { params: query })).data,
    get: async (id: number) => (await client.get<Employee>(`/employees/${id}`)).data,
    stats: async (branchId?: number) =>
      (await client.get<EmployeeStats>('/employees/stats', { params: { branchId } })).data,
    roles: async () => (await client.get<AssignableRole[]>('/employees/roles')).data,
    create: async (payload: Record<string, unknown>) =>
      (await client.post<Employee>('/employees', payload)).data,
    update: async (id: number, payload: Record<string, unknown>) =>
      (await client.put<Employee>(`/employees/${id}`, payload)).data,
    setDuty: async (id: number, onDuty: boolean) =>
      (await client.post<Employee>(`/employees/${id}/duty`, { onDuty })).data,
    performance: async (id: number, from: string, to: string) =>
      (await client.get<EmployeePerformance>(`/employees/${id}/performance`, { params: { from, to } })).data,
    history: async (id: number) =>
      (await client.get<AuditHistoryEntry[]>(`/employees/${id}/history`)).data,
    taskSummary: async (params: { branchId?: number; from: string; to: string; employeeId?: number }) =>
      (
        await client.get<{ pending: number; completed: number; total: number }>(
          '/employees/tasks/summary',
          { params },
        )
      ).data,
  };
}

export interface TaskListQuery {
  branchId?: number;
  employeeId?: number;
  status?: string;
  priority?: string;
  taskType?: string;
  tableId?: number;
  from?: string;
  to?: string;
}

export function createTaskApi(client: ApiClient) {
  return {
    list: async (query: TaskListQuery = {}) =>
      (await client.get<StaffTask[]>('/tasks', { params: query })).data,
    overdue: async () => (await client.get<StaffTask[]>('/tasks/overdue')).data,
    create: async (payload: StaffTaskRequest) =>
      (await client.post<StaffTask>('/tasks', payload)).data,
    update: async (id: number, payload: StaffTaskRequest) =>
      (await client.put<StaffTask>(`/tasks/${id}`, payload)).data,
    updateStatus: async (id: number, status: string, note?: string) =>
      (await client.post<StaffTask>(`/tasks/${id}/status`, { status, note })).data,
  };
}

export function createTableAssignmentApi(client: ApiClient) {
  return {
    list: async (branchId?: number) =>
      (await client.get<TableAssignment[]>('/table-assignments', { params: { branchId } })).data,
    assign: async (payload: { tableId: number; employeeId: number; branchId: number }) =>
      (await client.post<TableAssignment>('/table-assignments', payload)).data,
    release: async (tableId: number) => {
      await client.delete(`/table-assignments/${tableId}`);
    },
  };
}
