import {
  useMemo,
  useState,
} from 'react';
import {
  Box,
  Button,
  Chip,
  Divider,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  BarChart,
  Bar,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Clock,
  CreditCard,
  Eye,
  FileText,
  LayoutDashboard,
  Menu as MenuIcon,
  RefreshCw,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@resto/ui';
import { orderApi, reportApi } from '@/api';
import { useCan } from '@/auth/useCan';
import { useRestaurant } from '@/context/RestaurantContext';
import { KpiCard } from '@/components/reports/KpiCard';
import { ChartCard } from '@/components/reports/ChartCard';
import type { OrderStatus, PaymentStatus } from '@resto/types';

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function money(value: number | null | undefined, currency: string) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    minimumFractionDigits: 2,
  }).format(Number.isFinite(Number(value ?? 0)) ? Number(value ?? 0) : 0);
}

function number(value: number | null | undefined) {
  return new Intl.NumberFormat('en-IN').format(Number.isFinite(Number(value ?? 0)) ? Number(value ?? 0) : 0);
}

const PERIODS: { label: string; days: number; custom?: boolean }[] = [
  { label: 'Today', days: 1 },
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 30 Days', days: 30 },
  { label: 'This Month', days: 30 },
  { label: 'Last Month', days: 30 },
  { label: 'Custom Range', days: 30, custom: true },
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: 'Draft',
  PLACED: 'Placed',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  READY: 'Ready',
  SERVED: 'Served',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: '#15803d',
  SERVED: '#15803d',
  READY: '#2563eb',
  PREPARING: '#b45309',
  CONFIRMED: '#2563eb',
  PLACED: '#5A6478',
  DRAFT: '#94a3b8',
  CANCELLED: '#dc2626',
};

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Pending',
  AUTHORIZED: 'Authorized',
  PAID: 'Paid',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
};

/* ------------------------------------------------------------------ */
/* Sub-components                                                     */
/* ------------------------------------------------------------------ */

function SalesTrendChart({
  data,
  currency,
}: {
  data: { date: string; revenue: number; orders: number }[];
  currency: string;
}) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        aov: d.orders > 0 ? d.revenue / d.orders : 0,
      })),
    [data],
  );

  const max = Math.max(...chartData.map((d) => d.revenue), 1);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F4F8" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis hide domain={[0, max * 1.1]} tickFormatter={(v) => money(v, currency)} />
        <ChartTooltip
          content={({ active, payload }: any) => {
            if (active && payload && payload.length) {
              const d = payload[0].payload as any;
              return (
                <Box sx={{ p: 1, minWidth: 140, background: '#fff', border: '1px solid #E4E9F2', borderRadius: 5, color: '#111D32' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, mb: 0.25 }}>
                    {d.date}
                  </Typography>
                  <Stack spacing={0.25}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {money(d.revenue, currency)} revenue
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#5A6478' }}>
                      {number(d.orders)} orders
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                      AOV {money(d.aov, currency)}
                    </Typography>
                  </Stack>
                </Box>
              );
            }
            return null;
          }}
        />
        <Line type="monotone" dataKey="revenue" stroke="#F4511E" strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function OrderStatusDonut({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data.filter((d) => d.value > 0)}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={75}
          outerRadius={95}
          labelLine={false}
          label={{ position: 'outside', fontSize: 10, fill: '#5A6478' }}
        />
        <ChartTooltip
          content={({ active, payload }: any) => {
            if (active && payload && payload.length) {
              const d = payload[0].payload as any;
              const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0';
              return (
                <Box sx={{ p: 1, minWidth: 140, background: '#fff', border: '1px solid #E4E9F2', borderRadius: 5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.25, color: STATUS_COLORS[d.name] ?? '#111D32' }}>
                    {STATUS_LABELS[d.name as OrderStatus] ?? d.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                    {number(d.value)} orders · {pct}%
                  </Typography>
                </Box>
              );
            }
            return null;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ */
/* Main page                                                          */
/* ------------------------------------------------------------------ */

export function ReportsPage() {
  const { profile, branches, activeBranchId } = useRestaurant();
  const currency = profile?.currency ?? 'INR';
  const { can } = useCan();
  const canViewReport = can('report.read');

  const [period, setPeriod] = useState<'Today' | 'Last 7 Days' | 'Last 30 Days' | 'This Month' | 'Last Month' | 'Custom Range'>('Last 30 Days');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');
  const [compare, setCompare] = useState(false);

  const daysForPeriod = useMemo(() => {
    const p = PERIODS.find((x) => x.label === period);
    if (!p) return 30;
    if (p.custom && customFrom && customTo) {
      const from = new Date(customFrom);
      const to = new Date(customTo);
      const diff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return Math.min(Math.max(diff, 1), 365);
    }
    return p.days;
  }, [period, customFrom, customTo]);

  const [reportBranchId, setReportBranchId] = useState<number | null>(activeBranchId ?? null);
  const apiBranchId = reportBranchId ?? undefined;

  const salesQuery = useQuery({
    queryKey: ['reports', 'sales', daysForPeriod, reportBranchId],
    queryFn: () => reportApi.sales(daysForPeriod, apiBranchId),
    enabled: canViewReport,
  });

  const customersQuery = useQuery({
    queryKey: ['reports', 'customers', daysForPeriod, reportBranchId],
    queryFn: () => reportApi.customers(daysForPeriod, apiBranchId),
    enabled: canViewReport,
  });

  const countsQuery = useQuery({
    queryKey: ['reports', 'counts', reportBranchId, daysForPeriod],
    queryFn: () => orderApi.counts(apiBranchId, daysForPeriod),
    enabled: canViewReport,
  });

  const ordersQuery = useQuery({
    queryKey: ['reports', 'orders', daysForPeriod * 2, reportBranchId],
    queryFn: () =>
      orderApi.list({ branchId: apiBranchId, days: daysForPeriod * 2, page: 0, size: 500 }),
    enabled: canViewReport,
  });

  const isLoading = salesQuery.isPending || customersQuery.isPending || countsQuery.isPending || ordersQuery.isPending;
  const error = salesQuery.error || customersQuery.error || countsQuery.error || ordersQuery.error;

  const sales = salesQuery.data;
  const customers = customersQuery.data;
  const counts = countsQuery.data;
  const orders = ordersQuery.data?.content ?? [];

  const now = new Date();
  const cutoff = new Date(now.getTime() - daysForPeriod * 24 * 60 * 60 * 1000);
  const prevCutoff = new Date(now.getTime() - daysForPeriod * 2 * 24 * 60 * 60 * 1000);

  const currentOrders = orders.filter((o) => {
    const d = new Date(o.placedAt ?? o.createdAt);
    return !Number.isNaN(d.getTime()) && d >= cutoff;
  });
  const previousOrders = orders.filter((o) => {
    const d = new Date(o.placedAt ?? o.createdAt);
    return !Number.isNaN(d.getTime()) && d >= prevCutoff && d < cutoff;
  });

  const dailyCurrent = useMemo(() => {
    const map = new Map<string, { revenue: number; orders: number }>();
    for (const o of currentOrders) {
      const d = new Date(o.placedAt ?? o.createdAt);
      const key = d.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, { revenue: 0, orders: 0 });
      const e = map.get(key)!;
      e.revenue += Number(o.grandTotal ?? 0);
      e.orders += 1;
    }
    return Array.from(map.entries())
      .map(([date, v]) => ({ date, revenue: v.revenue, orders: v.orders }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [currentOrders, daysForPeriod]);

  const dailyPrevious = useMemo(() => {
    const map = new Map<string, { revenue: number; orders: number }>();
    for (const o of previousOrders) {
      const d = new Date(o.placedAt ?? o.createdAt);
      const key = d.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, { revenue: 0, orders: 0 });
      const e = map.get(key)!;
      e.revenue += Number(o.grandTotal ?? 0);
      e.orders += 1;
    }
    return Array.from(map.entries())
      .map(([date, v]) => ({ date, revenue: v.revenue, orders: v.orders }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [previousOrders, daysForPeriod]);

  const revenueChange = sales
    ? dailyPrevious.length > 0
      ? ((sales.grossRevenue - dailyPrevious.reduce((s, d) => s + d.revenue, 0)) / dailyPrevious.reduce((s, d) => s + d.revenue, 0)) * 100
      : 0
    : 0;

  const hourly = useMemo(() => {
    const buckets = Array.from({ length: 24 }, (_, h) => ({ hour: h, label: `${h}:00`, revenue: 0, orders: 0 }));
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (const o of orders) {
      const d = new Date(o.placedAt ?? o.createdAt);
      if (!Number.isNaN(d.getTime()) && d >= todayStart) {
        const b = buckets[d.getHours()];
        if (b) {
          b.revenue += Number(o.grandTotal ?? 0);
          b.orders += 1;
        }
      }
    }
    return buckets;
  }, [orders, now]);

  const topItems = (sales?.topItems ?? []).slice(0, 8);
  const totalRevenue = sales?.grossRevenue ?? 0;
  const totalOrders = sales?.orderCount ?? 0;
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const itemsSold = topItems.reduce((s, i) => s + i.quantity, 0);

  const byStatus = counts?.byStatus ?? {};
  const statusData = Object.entries(byStatus)
    .map(([name, value]) => ({ name, value: Number(value) }))
    .sort((a, b) => b.value - a.value);

  const repeatCustomers = customers?.customers ?? 0;
  const newCustomers = Math.max(0, (customers?.customers ?? 0) - (customers?.previousCustomers ?? 0));

  const pctChange = (current: number, previous: number) =>
    previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;

  const handleExport = () => {
    const headers = ['Order ID', 'Date', 'Customer', 'Type', 'Status', 'Payment', 'Total'];
    const rows = currentOrders.map((o) => [
      o.orderNumber,
      (o.placedAt ?? o.createdAt).slice(0, 16),
      o.customerName ?? '—',
      o.source ?? '—',
      o.status,
      o.paymentStatus,
      money(o.grandTotal, currency),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resto-reports-${daysForPeriod}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!canViewReport) {
    return (
      <EmptyState
        title="Reports access not available"
        description="You do not have permission to view reports. Contact your administrator."
      />
    );
  }

  if (isLoading) {
    return <LoadingState label="Loading reports…" />;
  }

  if (error) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Failed to load reports'}
        onRetry={() => {
          void salesQuery.refetch();
          void customersQuery.refetch();
        }}
      />
    );
  }

  if (!sales || !customers) {
    return <EmptyState title="No report data" description="There is no sales data available for the selected period." />;
  }

  const branchName = branches?.find((b) => b.id === reportBranchId)?.name ?? 'All Branches';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minHeight: '100vh', background: '#F5F7FB', py: 2, px: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <PageHeader
        title="Reports & Analytics"
        subtitle="Monitor your restaurant performance, sales, products and customer trends."
        actions={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box
              sx={{
                border: '1px solid #E4E9F2',
                borderRadius: 5,
                p: { xs: 0.5, sm: 1 },
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                background: '#fff',
              }}
            >
              <TextField
                select
                size="small"
                label="Branch"
                value={reportBranchId === null ? '' : branchName}
                onChange={(e) => {
                  const val = e.target.value;
                  const b = val === '' ? null : branches?.find((x) => x.name === val);
                  setReportBranchId(b ? b.id : null);
                }}
                sx={{ minWidth: { xs: 140, sm: 170 }, fontSize: 12, '& .MuiSelect-select': { py: 0.75 } }}
                InputLabelProps={{ shrink: true, style: { fontSize: 12 } }}
                margin="dense"
                variant="standard"
              >
                <MenuItem value="">All Branches</MenuItem>
                {branches?.map((b) => (
                  <MenuItem key={b.id} value={b.name}>
                    {b.name}
                  </MenuItem>
                ))}
              </TextField>
              <Divider orientation="vertical" flexItem sx={{ height: 20, mx: 0.5 }} />
              <TextField
                select
                size="small"
                label="Period"
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                sx={{ minWidth: 130, fontSize: 12, '& .MuiSelect-select': { py: 0.75 } }}
                InputLabelProps={{ shrink: true, style: { fontSize: 12 } }}
                margin="dense"
                variant="standard"
              >
                {PERIODS.map((p) => (
                  <MenuItem key={p.label} value={p.label}>
                    {p.label}
                  </MenuItem>
                ))}
              </TextField>
              {period === 'Custom Range' && (
                <>
                  <TextField
                    type="date"
                    size="small"
                    label="From"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    sx={{ minWidth: 120, fontSize: 12, '& .MuiInputBase-input': { py: 0.75 } }}
                    margin="dense"
                    variant="standard"
                    InputLabelProps={{ shrink: true, style: { fontSize: 12 } }}
                  />
                  <TextField
                    type="date"
                    size="small"
                    label="To"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    sx={{ minWidth: 120, fontSize: 12, '& .MuiInputBase-input': { py: 0.75 } }}
                    margin="dense"
                    variant="standard"
                    InputLabelProps={{ shrink: true, style: { fontSize: 12 } }}
                  />
                </>
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, background: '#fff', border: '1px solid #E4E9F2', borderRadius: 5, p: 0.5 }}>
              <Tooltip title="Compare with previous period">
                <Button
                  size="small"
                  variant={compare ? 'contained' : 'outlined'}
                  color={compare ? 'primary' : 'inherit'}
                  onClick={() => setCompare(!compare)}
                  sx={{ px: 1, fontSize: 11, fontWeight: 700, textTransform: 'none', color: compare ? '#fff' : '#5A6478' }}
                >
                  <Clock size={14} /> Compare
                </Button>
              </Tooltip>
              <Button size="small" variant="outlined" startIcon={<RefreshCw size={14} />} onClick={() => { void salesQuery.refetch(); void customersQuery.refetch(); }} sx={{ px: 1, fontSize: 11 }}>
                Refresh
              </Button>
              <Button size="small" variant="contained" startIcon={<FileText size={14} />} onClick={handleExport} sx={{ px: 1, fontSize: 11 }}>
                Export CSV
              </Button>
            </Box>
          </Box>
        }
      />

      {/* KPI Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2,
        }}
      >
        <KpiCard title="Total Revenue" value={money(totalRevenue, currency)} subtitle="Gross sales" change={compare ? revenueChange : undefined} changeLabel={compare ? 'vs prev period' : undefined} icon={Wallet} tone="success" />
        <KpiCard title="Total Orders" value={number(totalOrders)} subtitle="Completed orders" change={compare ? pctChange(totalOrders, previousOrders.length) : undefined} changeLabel={compare ? 'vs prev period' : undefined} icon={LayoutDashboard} tone="default" />
        <KpiCard title="Avg Order Value" value={money(aov, currency)} subtitle="Revenue ÷ orders" change={compare ? pctChange(aov, previousOrders.length > 0 ? dailyPrevious.reduce((s, d) => s + d.revenue, 0) / previousOrders.length : 0) : undefined} icon={CreditCard} />
        <KpiCard title="Items Sold" value={number(itemsSold)} subtitle="Total quantity" change={compare ? pctChange(itemsSold, previousOrders.reduce((s, o) => s + o.items.length, 0)) : undefined} icon={MenuIcon} />
        <KpiCard title="Total Discounts" value={money(currentOrders.reduce((s, o) => s + Number(o.discountTotal ?? 0), 0), currency)} change={compare ? pctChange(currentOrders.reduce((s, o) => s + Number(o.discountTotal ?? 0), 0), previousOrders.reduce((s, o) => s + Number(o.discountTotal ?? 0), 0)) : undefined} icon={FileText} />
        <KpiCard title="Cancellation Amount" value={money(currentOrders.filter((o) => o.status === 'CANCELLED').reduce((s, o) => s + Number(o.grandTotal ?? 0), 0), currency)} tone="error" icon={FileText} />
        <KpiCard title="Net Sales" value={money(totalRevenue - currentOrders.reduce((s, o) => s + Number(o.discountTotal ?? 0), 0), currency)} change={compare ? pctChange(totalRevenue - currentOrders.reduce((s, o) => s + Number(o.discountTotal ?? 0), 0), dailyPrevious.reduce((s, d) => s + d.revenue, 0) - previousOrders.reduce((s, o) => s + Number((o as any).discountTotal ?? 0), 0)) : undefined} tone="success" icon={TrendingUp} />
        <KpiCard title="Repeat Customers" value={number(repeatCustomers)} subtitle={`${newCustomers} new this period`} change={compare ? pctChange(repeatCustomers, Math.max(1, customers?.previousCustomers ?? 0) - 1) : undefined} icon={Users} />
      </Box>

      {/* Row: Sales Trend + Order Status */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 2 }}>
        <Box>
          <ChartCard title="Sales Trend" subtitle="Daily revenue over the selected period">
            <SalesTrendChart data={dailyCurrent} currency={currency} />
          </ChartCard>
        </Box>
        <Box>
          <ChartCard title="Order Status" subtitle="Distribution by status">
            <OrderStatusDonut data={statusData} />
            <Box sx={{ mt: 1.5, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              {statusData.slice(0, 6).map((d) => (
                <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 11 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: 2, background: STATUS_COLORS[d.name] ?? '#5A6478' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#111D32', minWidth: 45 }}>
                    {STATUS_LABELS[d.name as OrderStatus] ?? d.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ marginLeft: 'auto', fontSize: 11 }}>
                    {number(d.value)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </ChartCard>
        </Box>
      </Box>

      {/* Product Performance */}
      <Box>
        <ChartCard title="Product Performance" subtitle="Top-selling and high-revenue items">
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 1, mb: 1.5 }}>
            {topItems.map((item, i) => (
              <Paper key={item.name} sx={{ border: '1px solid #E4E9F2', borderRadius: 5, p: 1.5, background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 130 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#111D32', lineHeight: 1.2, mb: 0.25 }}>
                    {item.name}
                  </Typography>
                  <Chip size="small" label={`#${i + 1}`} color="default" variant="outlined" sx={{ fontSize: 10 }} />
                </Box>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, mb: 0.25 }}>
                    Quantity sold
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#111D32', mb: 0.25 }}>
                    {number(item.quantity)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                    Revenue {money(item.revenue, currency)}
                  </Typography>
                </Box>
              </Paper>
            ))}
            {topItems.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 3, color: '#5A6478' }}>
                <Typography variant="body2">No products sold in this period.</Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ borderTop: '1px solid #F1F4F8', pt: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1, fontSize: 12 }}>
              Top items detail
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: '#5A6478', fontSize: 11, textTransform: 'uppercase' }}>Item</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#5A6478', fontSize: 11, textTransform: 'uppercase' }} align="right">Qty</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#5A6478', fontSize: 11, textTransform: 'uppercase' }} align="right">Revenue</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#5A6478', fontSize: 11, textTransform: 'uppercase' }} align="right">Contribution</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topItems.map((item) => (
                  <TableRow key={item.name} hover sx={{ '&:hover': { bgcolor: '#F5F7FB' } }}>
                    <TableCell sx={{ fontWeight: 600, color: '#111D32' }}>{item.name}</TableCell>
                    <TableCell align="right">{number(item.quantity)}</TableCell>
                    <TableCell align="right">{money(item.revenue, currency)}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 11, fontWeight: 700, color: '#15803d' }}>
                        {totalRevenue > 0 ? (((item.revenue / totalRevenue) * 100).toFixed(1)) : '0'}%
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
          <Box sx={{ mt: 1.5, border: '1px dashed #E4E9F2', borderRadius: 5, p: 1.5, background: '#FAFBFC', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Eye size={16} color="#5A6478" />
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Category & low-performer insight
              </Typography>
              <Typography variant="body2" sx={{ fontSize: 12, color: '#5A6478', mt: 0.25 }}>
                Category-wise breakdown and lowest-selling products require a backend{' '}
                <code style={{ fontSize: 11, color: '#F4511E' }}>GET /api/v1/reports/categories</code>{' '}
                endpoint (category sales aggregation) that is not yet implemented.
              </Typography>
            </Box>
          </Box>
        </ChartCard>
      </Box>

      {/* Row: Peak Hours + Payment + Customer */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
        <Box>
          <ChartCard title="Peak Hours" subtitle="Orders & revenue by hour (today)">
            <Box sx={{ height: 200 }}>
              <BarChart data={hourly.filter((b) => b.orders > 0).length > 0 ? hourly : hourly.slice(8, 20)} margin={{ top: 5, right: 10, bottom: 25, left: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <ChartTooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as any;
                      return (
                        <Box sx={{ p: 1, minWidth: 130, background: '#fff', border: '1px solid #E4E9F2', borderRadius: 5 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, mb: 0.25 }}>
                            {d.label}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.25 }}>
                            {number(d.orders)} orders
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                            {money(d.revenue, currency)}
                          </Typography>
                        </Box>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="revenue" fill="#F4511E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </Box>
            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {hourly.map((b) => (
                <Box key={b.label} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25, flex: 1, minWidth: 30 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
                    {b.label}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 11, color: b.orders > 0 ? '#111D32' : '#94a3b8' }}>
                    {number(b.orders)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </ChartCard>
        </Box>
        <Box>
          <ChartCard title="Payment Status" subtitle="Order payment status distribution">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {([['PAID', 'Paid'], ['PENDING', 'Pending'], ['FAILED', 'Failed'], ['REFUNDED', 'Refunded']] as const).map(([status, label]) => {
                const count = currentOrders.filter((o) => o.paymentStatus === status).length;
                const amount = currentOrders.filter((o) => o.paymentStatus === status).reduce((s, o) => s + Number(o.grandTotal ?? 0), 0);
                const pct = totalOrders > 0 ? ((count / totalOrders) * 100).toFixed(0) : '0';
                return (
                  <Box key={status} sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 11, py: 0.5 }}>
                    <Box sx={{ width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: STATUS_COLORS[status] ?? '#5A6478', minWidth: 32 }}>
                      {pct}%
                    </Box>
                    <Box sx={{ flex: 1, height: 6, borderRadius: 2, background: '#E4E9F2', overflow: 'hidden' }}>
                      <Box sx={{ height: '100%', width: totalOrders > 0 ? `${pct}%` : '0%', background: STATUS_COLORS[status] ?? '#5A6478' }} />
                    </Box>
                    <Box sx={{ minWidth: 70, textAlign: 'right', fontWeight: 600, color: '#111D32' }}>
                      {number(count)} · {money(amount, currency)}
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, ml: 0.5 }}>
                      {label}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
            <Box sx={{ mt: 1.5, border: '1px dashed #E4E9F2', borderRadius: 5, p: 1.5, background: '#FAFBFC', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Wallet size={16} color="#5A6478" />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Payment method breakdown
                </Typography>
                <Typography variant="body2" sx={{ fontSize: 12, color: '#5A6478', mt: 0.25 }}>
                  Cash / UPI / Card split requires a backend{' '}
                  <code style={{ fontSize: 11, color: '#F4511E' }}>GET /api/v1/reports/payments</code>{' '}
                  endpoint (payment-method aggregation) that is not yet implemented.
                </Typography>
              </Box>
            </Box>
          </ChartCard>
        </Box>
        <Box>
          <ChartCard title="Customer Insights" subtitle="New vs returning customers">
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Paper sx={{ border: '1px solid #E4E9F2', borderRadius: 5, p: 1.5, textAlign: 'center', background: '#fff' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>Total customers</Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, color: '#111D32', mt: 0.5 }}>{number(customers?.customers ?? 0)}</Typography>
              </Paper>
              <Paper sx={{ border: '1px solid #E4E9F2', borderRadius: 5, p: 1.5, textAlign: 'center', background: '#fff' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>Repeat rate</Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, color: '#111D32', mt: 0.5 }}>
                  {repeatCustomers > 0 ? (((repeatCustomers - newCustomers) / repeatCustomers) * 100).toFixed(1) : '0'}%
                </Typography>
              </Paper>
            </Box>
            <Box sx={{ mt: 1.5, border: '1px solid #E4E9F2', borderRadius: 5, p: 1.5, background: '#fff' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#111D32' }}>New customers</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#15803d' }}>{number(newCustomers)}</Typography>
              </Box>
              <Box sx={{ height: 8, borderRadius: 2, background: '#E4E9F2', width: '100%', mb: 1.5 }}>
                <Box sx={{ height: '100%', width: repeatCustomers > 0 ? (((repeatCustomers - newCustomers) / repeatCustomers) * 100) : 0, background: '#15803d', borderRadius: 2 }} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#111D32' }}>Returning customers</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#2563eb' }}>{number(Math.max(0, repeatCustomers - newCustomers))}</Typography>
              </Box>
            </Box>
          </ChartCard>
        </Box>
      </Box>

      {/* Detailed Sales Table */}
      <Box>
        <ChartCard title="Detailed Sales Report" subtitle={`Showing ${currentOrders.length} orders for the selected period`} noPadding>
          <Box sx={{ p: 2, overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: '#5A6478', fontSize: 11, textTransform: 'uppercase' }}>Order ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#5A6478', fontSize: 11, textTransform: 'uppercase' }}>Date & Time</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#5A6478', fontSize: 11, textTransform: 'uppercase' }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#5A6478', fontSize: 11, textTransform: 'uppercase' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#5A6478', fontSize: 11, textTransform: 'uppercase' }} align="right">Items</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#5A6478', fontSize: 11, textTransform: 'uppercase' }} align="right">Subtotal</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#5A6478', fontSize: 11, textTransform: 'uppercase' }} align="right">Discount</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#5A6478', fontSize: 11, textTransform: 'uppercase' }} align="right">Total</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#5A6478', fontSize: 11, textTransform: 'uppercase' }} align="right">Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#5A6478', fontSize: 11, textTransform: 'uppercase' }} align="right">Payment</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentOrders.slice(0, 50).map((o) => (
                  <TableRow key={o.id} hover sx={{ '&:hover': { bgcolor: '#F5F7FB' } }}>
                    <TableCell sx={{ fontWeight: 600, color: '#111D32', fontSize: 11, fontFamily: 'monospace' }}>{o.orderNumber}</TableCell>
                    <TableCell sx={{ fontSize: 11, color: '#5A6478', fontFamily: 'monospace' }}>{(o.placedAt ?? o.createdAt).slice(0, 16)}</TableCell>
                    <TableCell sx={{ fontSize: 11, color: '#111D32' }}>{o.customerName ?? '—'}</TableCell>
                    <TableCell sx={{ fontSize: 11, color: '#5A6478' }}>{o.source ?? '—'}</TableCell>
                    <TableCell align="right" sx={{ fontSize: 11, color: '#5A6478' }}>{o.items.length}</TableCell>
                    <TableCell align="right" sx={{ fontSize: 11, fontWeight: 600, color: '#111D32' }}>{money(o.subtotal, currency)}</TableCell>
                    <TableCell align="right" sx={{ fontSize: 11, color: '#dc2626' }}>{money(o.discountTotal ?? 0, currency)}</TableCell>
                    <TableCell align="right" sx={{ fontSize: 11, fontWeight: 700, color: '#111D32' }}>{money(o.grandTotal, currency)}</TableCell>
                    <TableCell align="right" sx={{ fontSize: 10, fontWeight: 700, color: STATUS_COLORS[o.status] ?? '#5A6478' }}>
                      <Chip size="small" label={STATUS_LABELS[o.status] ?? o.status} color="default" variant="outlined" sx={{ fontSize: 9, height: 20, '& .MuiChip-label': { padding: 0 } }} />
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: 10, fontWeight: 600, color: '#5A6478' }}>{PAYMENT_LABELS[o.paymentStatus] ?? o.paymentStatus}</TableCell>
                  </TableRow>
                ))}
                {currentOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ color: '#5A6478', py: 2 }}>
                      No orders found for the selected period.
                    </TableCell>
                  </TableRow>
                )}
                {currentOrders.length > 50 && (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ color: '#5A6478', py: 1 }}>
                      Showing first 50 of {number(currentOrders.length)} orders. Export CSV for the full list.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </ChartCard>
      </Box>
    </Box>
  );
}
