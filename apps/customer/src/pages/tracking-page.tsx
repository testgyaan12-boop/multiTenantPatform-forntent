import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Bike, QrCode } from 'lucide-react';
import { service } from '@/services';
import { errorMessage } from '@/lib/api-client';
import { IS_SANDBOX_PAYMENT } from '@/lib/env';
import { formatCurrency } from '@/lib/format-currency';
import { formatDate } from '@/lib/format-date';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { PageHeader } from '@/components/layout/page-header';
import { OrderItemsList } from '@/components/orders/order-items';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/orders/status-badge';
import { StatusTimeline } from '@/components/orders/status-timeline';
import { CartTotalsCard } from '@/components/cart/cart-totals';
import { ErrorState } from '@/components/common/error-state';
import { PageSkeleton } from '@/components/common/loading-state';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const ACTIVE_STATUSES = new Set(['PLACED', 'CONFIRMED', 'PREPARING', 'READY']);

export function useOrderQuery(publicToken: string | undefined) {
  const online = useOnlineStatus();
  return useQuery({
    queryKey: ['order', publicToken ?? ''],
    queryFn: () => service.trackOrder(publicToken as string),
    enabled: Boolean(publicToken),
    refetchInterval: (query) => {
      if (!online) return false;
      const status = query.state.data?.status;
      if (!status) return 5000;
      return ACTIVE_STATUSES.has(status) ? 5000 : 15_000;
    },
    refetchIntervalInBackground: false,
  });
}

export function TrackingPage() {
  const { restaurantSlug = '', orderId = '' } = useParams();
  const slug = restaurantSlug;
  const online = useOnlineStatus();
  const order = useOrderQuery(orderId);
  const data = order.data;

  async function handlePay() {
    if (!data) return;
    try {
      const key =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `pay-${Date.now()}`;
      await service.payOrder(data.publicToken, key);
      toast.success('Payment complete (demo)');
      void order.refetch();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  if (order.isPending) {
    return (
      <>
        <PageHeader title="Order status" back />
        <PageSkeleton />
      </>
    );
  }

  if (order.isError || !data) {
    return (
      <>
        <PageHeader title="Order status" back />
        <ErrorState
          error={order.error}
          title="We couldn't find this order"
          onRetry={() => void order.refetch()}
        />
        <div className="flex justify-center pb-8">
          <Button asChild variant="outline" size="sm">
            <Link to={`/r/${slug}/orders`}>My orders</Link>
          </Button>
        </div>
      </>
    );
  }

  const needsPayment = data.paymentStatus === 'PENDING' || data.paymentStatus === 'FAILED';

  return (
    <>
      <PageHeader
        title={`#${data.orderNumber}`}
        subtitle={formatDate(data.placedAt ?? data.createdAt)}
        back
        right={<PaymentStatusBadge status={data.paymentStatus} />}
      />

      <div className="space-y-4 px-4 py-4">
        {!online ? (
          <Alert variant="warning">
            <AlertTitle>You&apos;re offline</AlertTitle>
            <AlertDescription>
              Status shown is from your last connection — it refreshes automatically when
              you&apos;re back.
            </AlertDescription>
          </Alert>
        ) : null}

        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={data.status} />
            <Badge variant="outline">
              {data.source === 'QR' || data.tableNumber ? (
                <span className="flex items-center gap-1">
                  <QrCode className="h-3 w-3" aria-hidden />
                  Dine-in · Table {data.tableNumber ?? '—'}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Bike className="h-3 w-3" aria-hidden />
                  Pickup
                </span>
              )}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted">
            {data.status === 'COMPLETED'
              ? 'Hope it was delicious — thanks for ordering!'
              : data.status === 'CANCELLED'
                ? 'This order was cancelled by the restaurant.'
                : 'Live status refreshes automatically.'}
          </p>
        </section>

        {needsPayment ? (
          <Alert variant="warning">
            <AlertTitle>Payment still pending</AlertTitle>
            <AlertDescription>
              Your order is saved — complete the demo payment to confirm it.
              <div className="mt-2.5">
                <Button size="sm" onClick={() => void handlePay()}>
                  Pay {formatCurrency(data.grandTotal, data.currency)} now
                  {IS_SANDBOX_PAYMENT ? ' (demo)' : ''}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : null}

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-4 text-sm font-semibold">Progress</h2>
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
          currencyNote={IS_SANDBOX_PAYMENT ? 'Sandbox payment — demo only.' : undefined}
        />

        <div className="grid gap-2.5 pb-4 sm:grid-cols-2">
          <Button asChild variant="outline" size="lg">
            <Link to={`/r/${slug}/orders/${data.publicToken}`}>View full details</Link>
          </Button>
          <Button asChild size="lg">
            <Link to={`/r/${slug}/menu`}>Order something else</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
