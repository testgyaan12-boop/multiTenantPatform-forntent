import axios, { AxiosError } from 'axios';
import type { PortalError } from '@/types';
import { API_BASE_URL, MOCK_MODE } from '@/lib/env';

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

export const SESSION_HEADER = 'X-Guest-Session';
export const IDEMPOTENCY_HEADER = 'Idempotency-Key';

function toPortalError(error: unknown): PortalError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{
      detail?: string;
      message?: string;
      code?: string;
      fieldErrors?: Record<string, string>;
    }>;
    const status = axiosError.response?.status ?? 0;
    const data = axiosError.response?.data;
    if (!axiosError.response) {
      return {
        status: 0,
        code: navigator.onLine ? 'network_error' : 'offline',
        message: navigator.onLine
          ? 'Could not reach the server. Check your connection and try again.'
          : 'You appear to be offline.',
      };
    }
    return {
      status,
      code: data?.code || `http_${status}`,
      message: data?.detail || data?.message || 'Something went wrong. Please try again.',
      fieldErrors: data?.fieldErrors,
    };
  }
  return { status: 0, code: 'unknown', message: 'Something went wrong. Please try again.' };
}

export async function request<T>(
  fn: () => Promise<{ data: T }>,
): Promise<T> {
  try {
    const response = await fn();
    return response.data;
  } catch (error) {
    if (MOCK_MODE) throw toPortalError(error);
    throw toPortalError(error);
  }
}

export function isPortalError(error: unknown): error is PortalError {
  return typeof error === 'object' && error !== null && 'code' in error && 'status' in error;
}

export function errorMessage(error: unknown): string {
  if (isPortalError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
