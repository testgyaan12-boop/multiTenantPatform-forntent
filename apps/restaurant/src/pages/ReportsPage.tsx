import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Grid,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ErrorState, LoadingState, PageHeader } from '@resto/ui';
import { reportApi } from '@/api';
import { useRestaurant } from '@/context/RestaurantContext';
import { formatMoney } from '@/format';

export function ReportsPage() {
  const [days, setDays] = useState(30);
  const { profile } = useRestaurant();
  const currency = profile?.currency ?? 'INR';

  const sales = useQuery({
    queryKey: ['sales-report', days],
    queryFn: () => reportApi.sales(days),
  });

  const cards = [
    { label: `Orders (${days}d)`, value: sales.data ? String(sales.data.orderCount) : '—' },
    {
      label: 'Gross revenue',
      value: sales.data ? formatMoney(sales.data.grossRevenue, currency) : '—',
    },
    {
      label: 'Average ticket',
      value: sales.data ? formatMoney(sales.data.averageTicket, currency) : '—',
    },
    {
      label: 'Top item',
      value: sales.data?.topItems[0]?.name ?? '—',
    },
  ];

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Sales performance and best sellers."
        actions={
          <TextField
            select
            size="small"
            label="Period"
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value={7}>Last 7 days</MenuItem>
            <MenuItem value={30}>Last 30 days</MenuItem>
            <MenuItem value={90}>Last 90 days</MenuItem>
            <MenuItem value={365}>Last year</MenuItem>
          </TextField>
        }
      />

      {sales.isPending ? <LoadingState /> : null}
      {sales.isError ? (
        <ErrorState message={sales.error.message} onRetry={() => void sales.refetch()} />
      ) : null}

      {sales.data ? (
        <Stack spacing={3}>
          <Grid container spacing={2}>
            {cards.map((card) => (
              <Grid key={card.label} size={{ xs: 12, sm: 6, lg: 3 }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    {card.label}
                  </Typography>
                  <Typography variant="h2" sx={{ mt: 0.5 }}>
                    {card.value}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h3" sx={{ mb: 2 }}>
              Top items by revenue
            </Typography>
            {sales.data.topItems.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No sales recorded in this period.
              </Typography>
            ) : (
              <Stack spacing={3}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={sales.data.topItems}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip
                      formatter={(value) => formatMoney(Number(value), currency)}
                    />
                    <Bar dataKey="revenue" fill="#c2410c" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sales.data.topItems.map((item) => (
                      <TableRow key={item.name} hover>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">
                          {formatMoney(item.revenue, currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Stack>
            )}
          </Paper>
        </Stack>
      ) : null}
    </>
  );
}
