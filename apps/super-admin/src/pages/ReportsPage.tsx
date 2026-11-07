import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ErrorState, LoadingState, PageHeader } from '@resto/ui';
import { platformApi } from '@/api';
import { formatInr } from '@/format';
import { ORANGE } from '@/theme';
import { KpiCard } from '@/components/KpiCard';

export function ReportsPage() {
  const [days, setDays] = useState(30);

  const sales = useQuery({
    queryKey: ['sa-reports', 'sales', days],
    queryFn: () => platformApi.sales(days),
  });
  const customers = useQuery({
    queryKey: ['sa-reports', 'customers', days],
    queryFn: () => platformApi.customers(days),
  });

  return (
    <>
      <PageHeader
        title="Platform Reports"
        subtitle="Cross-tenant operational reporting aggregated from orders and customers."
        actions={
          <TextField
            select
            size="small"
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            sx={{ width: 150 }}
            aria-label="Report range"
          >
            <MenuItem value={7}>Last 7 days</MenuItem>
            <MenuItem value={30}>Last 30 days</MenuItem>
            <MenuItem value={90}>Last 90 days</MenuItem>
          </TextField>
        }
      />

      {sales.isPending || customers.isPending ? <LoadingState /> : null}
      {sales.isError ? <ErrorState message={sales.error.message} onRetry={() => void sales.refetch()} /> : null}

      {sales.data && customers.data ? (
        <Stack spacing={3}>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            }}
          >
            <KpiCard label={`Gross sales (${days}d)`} value={formatInr(sales.data.gross)} icon={<Typography variant="h4">₹</Typography>} tone="success" />
            <KpiCard label="Completed orders" value={sales.data.orders} sub={`${sales.data.cancelled} cancelled`} icon={<Typography variant="h4">#</Typography>} tone="info" />
            <KpiCard label="Average ticket" value={formatInr(sales.data.avgTicket)} icon={<Typography variant="h4">~</Typography>} tone="default" />
            <KpiCard
              label={`Customers (${days}d)`}
              value={customers.data.createdInRange}
              sub={`${customers.data.total} total`}
              icon={<Typography variant="h4">C</Typography>}
              tone="warning"
            />
          </Box>

          <Card sx={{ p: 2.5 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>
              Daily gross sales — all tenants
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sales.data.daily} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDF0F6" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10.5, fill: '#5A6478' }} interval="preserveStartEnd" minTickGap={24} />
                  <YAxis tick={{ fontSize: 11, fill: '#5A6478' }} width={60} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: '1px solid #E4E9F2', fontSize: 12 }}
                    formatter={(value) => [formatInr(Number(value)), 'Gross']}
                  />
                  <Bar dataKey="gross" fill={ORANGE} radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
            <Typography sx={{ fontSize: 11.5, color: '#9AA3B5', mt: 1 }}>
              Source: orders with status COMPLETED across every tenant
            </Typography>
          </Card>
        </Stack>
      ) : null}
    </>
  );
}
