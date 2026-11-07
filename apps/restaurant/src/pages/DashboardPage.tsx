import { useMemo } from 'react';
import { Box, Button, Card, Typography } from '@mui/material';
import { Activity, ClipboardList, Coins, ReceiptText, RefreshCw } from 'lucide-react';
import { ErrorState } from '@resto/ui';
import { useAuth } from '@/auth/AuthContext';
import { useRestaurant } from '@/context/RestaurantContext';
import { formatMoney } from '@/format';
import {
  buildHourlyBuckets,
  openOrdersCount,
  useLiveOrders,
  useSalesSummary,
} from '@/hooks/useDashboardData';
import { useHeaderFilters } from '@/layout/HeaderFilters';
import { ActivityChartCard } from '@/components/dashboard/ActivityChartCard';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { LiveOrdersCard } from '@/components/dashboard/LiveOrdersCard';
import { PopularItemsCard } from '@/components/dashboard/PopularItemsCard';

const periodLabels: Record<number, string> = {
  1: 'Today',
  7: 'Last 7 days',
  30: 'Last 30 days',
};

export function DashboardPage() {
  const { user } = useAuth();
  const { profile, activeBranch } = useRestaurant();
  const { days } = useHeaderFilters();
  const liveOrders = useLiveOrders();
  const summary = useSalesSummary(days);

  const currency = profile?.currency ?? 'INR';
  const periodLabel = periodLabels[days] ?? `Last ${days} days`;
  const orders = useMemo(() => liveOrders.data?.content ?? [], [liveOrders.data]);
  const buckets = useMemo(() => buildHourlyBuckets(orders), [orders]);
  const todayOrders = useMemo(
    () => buckets.reduce((total, bucket) => total + bucket.orders, 0),
    [buckets],
  );

  const dataFailed = summary.isError && liveOrders.isError;

  if (dataFailed) {
    return (
      <ErrorState
        message={summary.error?.message ?? liveOrders.error?.message ?? 'Dashboard data unavailable'}
        onRetry={() => {
          void summary.refetch();
          void liveOrders.refetch();
        }}
      />
    );
  }

  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h2">
            Good to see you{user?.firstName ? `, ${user.firstName}` : ''}
          </Typography>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mt: 0.5 }}>
            {activeBranch ? activeBranch.name : 'Select a branch'} · {periodLabel} · live data
          </Typography>
        </Box>
        <Button
          size="small"
          startIcon={<RefreshCw size={15} />}
          onClick={() => {
            void summary.refetch();
            void liveOrders.refetch();
          }}
        >
          Refresh all
        </Button>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
        }}
      >
        <KpiCard
          label="Open orders"
          value={liveOrders.isPending ? '' : String(openOrdersCount(orders))}
          description="Orders in progress right now"
          icon={ClipboardList}
          accent="#2563EB"
          isLoading={liveOrders.isPending}
        />
        <KpiCard
          label={`Revenue${days === 1 ? ' today' : ''}`}
          value={summary.isPending ? '' : formatMoney(summary.data?.grossRevenue, currency)}
          description={`${periodLabel} · ${activeBranch?.name ?? 'all branches'}`}
          icon={Coins}
          accent="#1E7B3C"
          isLoading={summary.isPending}
        />
        <KpiCard
          label={`Orders${days === 1 ? ' today' : ''}`}
          value={summary.isPending ? '' : String(summary.data?.orderCount ?? 0)}
          description={`${periodLabel} · completed & active`}
          icon={ReceiptText}
          accent="#F4511E"
          isLoading={summary.isPending}
        />
        <KpiCard
          label="Average ticket"
          value={summary.isPending ? '' : formatMoney(summary.data?.averageTicket, currency)}
          description={
            summary.data && summary.data.orderCount === 0
              ? 'No completed orders in this period'
              : 'Average order value'
          }
          icon={Activity}
          accent="#7C3AED"
          isLoading={summary.isPending}
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2fr) minmax(0, 1fr)' },
          alignItems: 'start',
        }}
      >
        <Box sx={{ display: 'grid', gap: 2, minWidth: 0 }}>
          <LiveOrdersCard />
          <ActivityChartCard
            buckets={buckets}
            periodLabel={periodLabel}
            periodRevenue={summary.isPending ? '—' : formatMoney(summary.data?.grossRevenue, currency)}
            todayOrders={todayOrders}
            isLoading={liveOrders.isPending}
          />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <PopularItemsCard
            summary={summary.data}
            isLoading={summary.isPending}
            isError={summary.isError}
            error={summary.error instanceof Error ? summary.error : null}
            onRetry={() => void summary.refetch()}
          />
        </Box>
      </Box>

      {summary.isError && !liveOrders.isError ? (
        <Card sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: 'error.main' }}>
              Sales metrics unavailable
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
              {summary.error instanceof Error ? summary.error.message : 'Request failed'}
            </Typography>
          </Box>
          <Button size="small" onClick={() => void summary.refetch()}>
            Retry
          </Button>
        </Card>
      ) : null}
    </Box>
  );
}
