import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCan } from '@/auth/useCan';
import { accessibleRoutes } from '@/layout/navAccess';

export function RequirePermission({ children, code }: { children: ReactNode; code: string }) {
  const { can } = useCan();
  const navigate = useNavigate();
  const location = useLocation();

  if (!can(code)) {
    const first = accessibleRoutes(can)[0];
    if (!first) return null;
    if (location.pathname !== first) {
      navigate(first, { replace: true });
    }
    return null;
  }
  return <>{children}</>;
}

export function RequireAnyPermission({ children, codes }: { children: ReactNode; codes: string[] }) {
  const { canAny } = useCan();
  const navigate = useNavigate();
  const location = useLocation();

  if (!canAny(codes)) {
    const first = accessibleRoutes((c: string) => codes.includes(c))[0];
    if (!first) return null;
    if (location.pathname !== first) {
      navigate(first, { replace: true });
    }
    return null;
  }
  return <>{children}</>;
}
