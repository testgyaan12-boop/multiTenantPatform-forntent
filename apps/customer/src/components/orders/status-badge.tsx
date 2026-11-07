import type { OrderStatus, PaymentStatus } from '@/types';
import { Badge, type BadgeProps } from '@/components/ui/badge';

const STATUS_META: Record<OrderStatus, { label: string; variant: BadgeProps['variant'] }> = {
  PLACED: { label: 'Order placed', variant: 'default' },
  CONFIRMED: { label: 'Confirmed', variant: 'default' },
  PREPARING: { label: 'Preparing', variant: 'accent' },
  READY: { label: 'Ready for pickup', variant: 'success' },
  SERVED: { label: 'Served', variant: 'success' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
};

const PAYMENT_META: Record<PaymentStatus, { label: string; variant: BadgeProps['variant'] }> = {
  PENDING: { label: 'Payment pending', variant: 'outline' },
  PAID: { label: 'Paid', variant: 'success' },
  FAILED: { label: 'Payment failed', variant: 'destructive' },
  REFUNDED: { label: 'Refunded', variant: 'outline' },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const meta = STATUS_META[status] ?? { label: status, variant: 'outline' as const };
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const meta = PAYMENT_META[status] ?? { label: status, variant: 'outline' as const };
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
