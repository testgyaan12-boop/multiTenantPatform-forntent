import { Link, useParams } from 'react-router-dom';
import { formatCurrency } from '@/lib/format-currency';
import { formatDate, formatRelative } from '@/lib/format-date';
import { PageHeader } from '@/components/layout/page-header';
import { OrderItemsList } from '@/components/orders/order-items';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/orders/status-badge';
import { StatusTimeline } from '@/components/orders/status-timeline';
import { CartTotalsCard } from '@/components/cart/cart-totals';
import { ErrorState } from '@/components/common/error-state';
import { PageSkeleton } from '@/components/common/loading-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOrderQuery } from './tracking-page';

export function OrderDetailsPage() {
  const { restaurantSlug = '', orderId = '' } = useParams();
  const slug = restaurantSlug;
  const order = useOrderQuery(orderId);
  const data = order.data;

  if (order.isPending) {
    return (
      <>
        <PageHeader title="Order details" back />
        <PageSkeleton />
      </>
    );
  }

  if (order.isError || !data) {
    return (
      <>
        <PageHeader title="Order details" back />
        <ErrorState
          error={order.error}
          title="Order not found"
          onRetry={() => void order.refetch()}
        />
      </>
    );
  }

  const isActive = ['PLACED', 'CONFIRMED', 'PREPARING', 'READY'].includes(data.status);

  return (
    <>
      <PageHeader
        title={`#${data.orderNumber}`}
        subtitle={formatDate(data.placedAt ?? data.createdAt)}
        back
        right={<OrderStatusBadge status={data.status} />}
      />

      <div className="space-y-4 px-4 py-4">
        <section className="rounded-xl border border-border bg-card p-4 text-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{data.customerName ?? 'Guest order'}</p>
              <p className="mt-0.5 text-xs text-muted">
                {data.source === 'QR' || data.tableNumber
                  ? `Dine-in · Table ${data.tableNumber ?? '—'}`
                  : 'Pickup at the counter'}
              </p>
            </div>
            <PaymentStatusBadge status={data.paymentStatus} />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge variant="outline">Placed {formatRelative(data.placedAt ?? data.createdAt)}</Badge>
            <Badge variant="outline">Receipt {data.orderNumber}</Badge>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-4 text-sm font-semibold">Status</h2>
          <StatusTimeline status={data.status} />
        </section>

        <OrderItemsList items={data.items} currency={data.currency} />

        <CartTotalsCard
          rows={[
            { label: 'Subtotal', value: formatCurrency(data.subtotal, data.currency), strong: true },
            { label: 'Taxes', value: formatCurrency(data.taxTotal, data.currency) },
            { label: 'Service charge', value: formatCurrency(data.serviceCharge, data.currency) },
            ...(data.tipTotal > 0
              ? [{ label: 'Tip', value: formatCurrency(data.tipTotal, data.currency) }]
              : []),
          ]}
          grandTotal={formatCurrency(data.grandTotal, data.currency)}
        />

        <div className="grid gap-2.5 pb-4 sm:grid-cols-2">
          {isActive ? (
            <Button asChild size="lg">
              <Link to={`/r/${slug}/order/${data.publicToken}/tracking`}>Track live status</Link>
            </Button>
          ) : null}
          <Button asChild variant={isActive ? 'outline' : 'default'} size="lg">
            <Link to={`/r/${slug}/menu`}>Order again</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
