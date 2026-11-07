const mockRaw = import.meta.env.VITE_MOCK as string | undefined;
const baseRaw = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';
const defaultRaw = import.meta.env.VITE_DEFAULT_RESTAURANT as string | undefined;

export const MOCK_MODE = mockRaw === 'true';
export const API_BASE_URL = baseRaw || 'http://localhost:8080/api/v1';
export const DEFAULT_RESTAURANT = defaultRaw || (MOCK_MODE ? 'the-spice-house' : 'demo-bistro');
export const IS_SANDBOX_PAYMENT = true;
