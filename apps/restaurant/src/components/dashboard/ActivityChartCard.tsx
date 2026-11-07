import { useMemo } from 'react';
import { Box, Card, CardContent, CardHeader, Skeleton, Typography } from '@mui/material';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EmptyState } from '@resto/ui';
import { useRestaurant } from '@/context/RestaurantContext';
import { formatMoney } from '@/format';
import type { HourlyBucket } from '@/hooks/useDashboardData';

interface ActivityChartCardProps {
  buckets: HourlyBucket[];
  periodLabel: string;
  periodRevenue: string;
  todayOrders: number;
  isLoading?: boolean;
}

export function ActivityChartCard({
  buckets,
  periodLabel,
  periodRevenue,
  todayOrders,
  isLoading,
}: ActivityChartCardProps) {
  const { profile } = useRestaurant();
  const currency = profile?.currency ?? 'INR';

  const data = useMemo(
    () =>
      buckets.map((bucket) => ({
        ...bucket,
        label: bucket.hour % 3 === 0 ? String(bucket.hour).padStart(2, '0') : '',
      })),
    [buckets],
  );

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#2563EB' }} />
            <Box>
              <Typography variant="h4">Today&apos;s activity</Typography>
              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                Hourly sales · {periodLabel}
              </Typography>
            </Box>
          </Box>
        }
        action={
          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{ fontSize: 11, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Period total
            </Typography>
            <Typography sx={{ fontSize: 18, fontWeight: 700 }}>{periodRevenue}</Typography>
          </Box>
        }
        sx={{ pb: 1, pt: 2.5, px: 2.5, '& .MuiCardHeader-action': { m: 0 }, alignItems: 'flex-start' }}
      />
      <CardContent sx={{ pt: 0, px: 2.5, pb: 2.5, flexGrow: 1 }}>
        {isLoading ? (
          <Skeleton variant="rounded" height={260} />
        ) : todayOrders === 0 ? (
          <EmptyState
            title="No orders yet today"
            description="Hourly sales will chart as soon as the first order is placed."
          />
        ) : (
          <>
            <Box sx={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EFEFEA" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#718096' }}
                    axisLine={{ stroke: '#E7E7E2' }}
                    tickLine={false}
                    interval={0}
                    allowDuplicatedCategory={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#718096' }}
                    axisLine={false}
                    tickLine={false}
                    width={54}
                    tickFormatter={(value: number) =>
                      value >= 1000 ? `${Math.round(value / 100) / 10}k` : String(value)
                    }
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(244,91,42,0.06)' }}
                    contentStyle={{
                      borderRadius: 10,
                      border: '1px solid #E7E7E2',
                      fontSize: 12.5,
                      boxShadow: '0 4px 14px rgba(21,31,48,0.08)',
                    }}
                    formatter={(value, _name, item) => {
                      const amount = Number(value ?? 0);
                      const bucket = item?.payload;
                      return [
                        `${formatMoney(amount, currency)} · ${bucket?.orders ?? 0} orders`,
                        `${String(bucket?.hour ?? '').padStart(2, '0')}:00`,
                      ];
                    }}
                    labelFormatter={(_label, payload) =>
                      `Hour ${String(payload?.[0]?.payload?.hour ?? '').padStart(2, '0')}:00`
                    }
                  />
                  <Bar dataKey="revenue" fill="#F4511E" radius={[4, 4, 0, 0]} maxBarSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 1 }}>
              {todayOrders} order{todayOrders === 1 ? '' : 's'} placed today, including hours with zero sales.
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
}
