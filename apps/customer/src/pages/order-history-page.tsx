import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ReceiptText } from 'lucide-react';
import { service } from '@/services';
import { filterOrdersForRestaurant } from '@/lib/order-history';
import type { OrderSummary } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { OrderCard } from '@/components/orders/order-card';
import { ErrorState } from '@/components/common/error-state';
import { EmptyState } from '@/components/common/empty-state';
import { PageSkeleton } from '@/components/common/loading-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DONE_STATUSES = new Set(['COMPLETED', 'CANCELLED']);

export function OrderHistoryPage() {
  const { restaurantSlug = '' } = useParams();
  const slug = restaurantSlug;
  const [tab, setTab] = useState('active');

  const orders = useQuery({
    queryKey: ['my-orders', slug],
    queryFn: () => service.getMyOrders(),
    staleTime: 15_000,
  });

  const visible: OrderSummary[] = service.isMock
    ? (orders.data ?? [])
    : filterOrdersForRestaurant(orders.data ?? [], slug);

  const activeOrders = visible.filter((order) => !DONE_STATUSES.has(order.status));
  const pastOrders = visible.filter((order) => DONE_STATUSES.has(order.status));
  const current = tab === 'active' ? activeOrders : pastOrders;

  return (
    <>
      <PageHeader title="My orders" subtitle="Saved on this device" />

      {orders.isPending ? (
        <PageSkeleton />
      ) : orders.isError ? (
        <ErrorState error={orders.error} onRetry={() => void orders.refetch()} />
      ) : (
        <div className="px-4 py-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="active" className="flex-1 sm:flex-none">
                Active ({activeOrders.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1 sm:flex-none">
                History ({pastOrders.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={tab}>
              {current.length === 0 ? (
                <EmptyState
                  icon={ReceiptText}
                  title={tab === 'active' ? 'No active orders' : 'No past orders yet'}
                  description={
                    tab === 'active'
                      ? 'When you place an order, you can track it here in real time.'
                      : 'Your completed and cancelled orders will appear here.'
                  }
                  action={
                    <Link
                      to={`/r/${slug}/menu`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Browse the menu
                    </Link>
                  }
                />
              ) : (
                <ul className="space-y-3 pt-3">
                  {[...current]
                    .sort(
                      (a, b) =>
                        new Date(b.placedAt ?? b.createdAt ?? 0).getTime() -
                        new Date(a.placedAt ?? a.createdAt ?? 0).getTime(),
                    )
                    .map((order) => (
                      <OrderCard
                        key={order.publicToken}
                        order={order}
                        href={`/r/${slug}/orders/${order.publicToken}`}
                      />
                    ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </>
  );
}
