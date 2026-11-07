import { Chip } from '@mui/material';
import type { OrderStatus } from '@resto/types';

interface StatusStyle {
  label: string;
  bg: string;
  color: string;
}

const statusStyles: Record<string, StatusStyle> = {
  PLACED: { label: 'New', bg: '#EFF4FF', color: '#2563EB' },
  CONFIRMED: { label: 'New', bg: '#EFF4FF', color: '#2563EB' },
  PREPARING: { label: 'Preparing', bg: '#FFF1EB', color: '#D9481E' },
  READY: { label: 'Ready', bg: '#ECF8F0', color: '#1E7B3C' },
  SERVED: { label: 'Completed', bg: '#F2F3F5', color: '#475467' },
  COMPLETED: { label: 'Completed', bg: '#F2F3F5', color: '#475467' },
  CANCELLED: { label: 'Cancelled', bg: '#FEECEB', color: '#B42318' },
};

export function StatusBadge({ status }: { status: OrderStatus | string }) {
  const style = statusStyles[status] ?? {
    label: String(status),
    bg: '#F2F3F5',
    color: '#475467',
  };
  return (
    <Chip
      size="small"
      label={style.label}
      sx={{ bgcolor: style.bg, color: style.color, fontWeight: 700, border: 'none' }}
    />
  );
}

export function statusStyleFor(status: OrderStatus | string): StatusStyle {
  return statusStyles[status] ?? { label: String(status), bg: '#F2F3F5', color: '#475467' };
}
