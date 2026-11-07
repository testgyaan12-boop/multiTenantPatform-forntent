import {
  createApiClient,
  createAuthApi,
  createBranchApi,
  createEmployeeApi,
  createInquiryApi,
  createMenuApi,
  createOrderApi,
  createReportApi,
  createTableApi,
  createTableAssignmentApi,
  createTaskApi,
} from '@resto/api-client';
import { STORAGE_KEYS } from '@resto/config';
import type { RestaurantProfile } from '@resto/types';

export const apiClient = createApiClient({
  getAccessToken: () => localStorage.getItem(STORAGE_KEYS.accessToken),
  onUnauthorized: () => {
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    localStorage.removeItem('resto.restaurant-user');
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
export const branchApi = createBranchApi(apiClient);
export const menuApi = createMenuApi(apiClient);
export const tableApi = createTableApi(apiClient);
export const orderApi = createOrderApi(apiClient);
export const reportApi = createReportApi(apiClient);
export const employeeApi = createEmployeeApi(apiClient);
export const taskApi = createTaskApi(apiClient);
export const tableAssignmentApi = createTableAssignmentApi(apiClient);
export const inquiryApi = createInquiryApi(apiClient);

export async function fetchRestaurantProfile(): Promise<RestaurantProfile> {
  const { data } = await apiClient.get<RestaurantProfile>('/restaurant');
  return data;
}

export interface RestaurantUpdatePayload {
  name: string;
  legalName?: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  gallery?: string;
  brandColors?: string;
  timezone?: string;
  currency: string;
  taxRate?: number;
  serviceChargeRate?: number;
  cuisine?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  businessRegistrationNumber?: string;
  taxNumber?: string;
  defaultLanguage?: string;
  socialLinks?: string;
  operatingHours?: string;
}

export async function updateRestaurantProfile(payload: RestaurantUpdatePayload): Promise<RestaurantProfile> {
  const { data } = await apiClient.put<RestaurantProfile>('/restaurant', payload);
  return data;
}

export async function fetchRestaurantSubscription(): Promise<import('@resto/types').RestaurantSubscription> {
  const { data } = await apiClient.get<import('@resto/types').RestaurantSubscription>('/restaurant/subscription');
  return data;
}

export async function uploadRestaurantLogo(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post<{ url: string }>('/restaurant/logo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url;
}

export async function uploadRestaurantMedia(file: File, type: 'cover' | 'gallery'): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  form.append('type', type);
  const { data } = await apiClient.post<{ url: string }>('/restaurant/media', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url;
}
