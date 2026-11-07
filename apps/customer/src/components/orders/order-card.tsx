import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/format-currency';
import { formatRelative } from '@/lib/format-date';
import type { OrderSummary } from '@/types';
import { OrderStatusBadge } from './status-badge';

interface OrderCardProps {
  order: OrderSummary;
  href: string;
}

export function OrderCard({ order, href }: OrderCardProps) {
  const names = order.items
    .slice(0, 2)
    .map((item) => `${item.quantity} × ${item.name}`)
    .join(', ');
  const extra = order.items.length - 2;

  return (
    <li>
      <Link
        to={href}
        className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
      >
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">#{order.orderNumber}</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="truncate text-xs text-muted">
            {names}
            {extra > 0 ? ` +${extra} more` : ''}
          </p>
          <p className="text-xs text-muted">{formatRelative(order.placedAt ?? order.createdAt)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-sm font-semibold tabular-nums">
            {formatCurrency(order.grandTotal, order.currency)}
          </span>
          <ChevronRight className="h-4 w-4 text-muted" aria-hidden />
        </div>
      </Link>
    </li>
  );
}
