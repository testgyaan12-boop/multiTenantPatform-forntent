import { useAuth } from '@/auth/AuthContext';

export function useCan() {
  const { user } = useAuth();
  const permissions = user?.permissions ?? [];
  return {
    can: (code: string) => permissions.includes(code),
    canAny: (codes: string[]) => codes.some((c) => permissions.includes(c)),
    canAll: (codes: string[]) => codes.every((c) => permissions.includes(c)),
  };
}
