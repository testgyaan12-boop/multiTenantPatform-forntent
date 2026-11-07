import { Chip } from '@mui/material';
import type { TenantSummary } from '@resto/types';

export type TenantStatus = TenantSummary['status'];

const style: Record<
  TenantStatus,
  { color: 'success' | 'warning' | 'error' | 'default' | 'info'; label: string }
> = {
  ACTIVE: { color: 'success', label: 'Active' },
  TRIAL: { color: 'warning', label: 'Trial' },
  SUSPENDED: { color: 'error', label: 'Suspended' },
  CANCELLED: { color: 'default', label: 'Cancelled' },
  PENDING_VERIFICATION: { color: 'info', label: 'Pending verification' },
};

export function StatusBadge({ status }: { status: string }) {
  const known = (style[status as TenantStatus] ?? {
    color: 'default' as const,
    label: status,
  }) as { color: 'success' | 'warning' | 'error' | 'default' | 'info'; label: string };
  return <Chip size="small" label={known.label} color={known.color} />;
}
