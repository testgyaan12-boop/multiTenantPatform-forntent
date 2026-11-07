import { useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  MenuItem,
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
  Cell,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Area, AreaChart } from 'recharts';
import {
  Activity,
  GitBranch,
  CreditCard,
  Plus,
  Receipt,
  ShieldCheck,
  Store,
  TicketPercent,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { ErrorState, LoadingState, PageHeader } from '@resto/ui';
import type { TenantSummary } from '@resto/types';
import { platformApi, tenantApi } from '@/api';
import { KpiCard } from '@/components/KpiCard';
import { StatusBadge } from '@/components/StatusBadge';
import type { ShellScope } from '@/layout/AppLayout';
import { AMBER, BLUE, GREEN, ORANGE, RED } from '@/theme';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: GREEN,
  TRIAL: AMBER,
  SUSPENDED: RED,
  PENDING_VERIFICATION: BLUE,
  CANCELLED: '#9AA3B5',
};

function buildBuckets(tenants: TenantSummary[], rangeDays: number) {
  const now = new Date();
  const buckets: { date: string; label: string; count: number }[] = [];
  const counts = new Map<string, number>();
  tenants.forEach((tenant) => {
    const key = tenant.createdAt.slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  for (let i = rangeDays - 1; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    buckets.push({
      date: key,
      label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      count: counts.get(key) ?? 0,
    });
  }
  return buckets;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { scope } = useOutletContext<ShellScope>();
  const [rangeDays, setRangeDays] = useState(30);

  const all = useQuery({
    queryKey: ['tenants', 'all'],
    queryFn: () => tenantApi.list({ page: 0, size: 500, sort: 'createdAt', direction: 'desc' }),
  });

  const stats = useQuery({ queryKey: ['sa-stats'], queryFn: () => platformApi.stats() });
  const audit = useQuery({
    queryKey: ['sa-audit', 'recent'],
    queryFn: () => platformApi.auditLogs({ page: 0, size: 5 }),
  });

  const recent = useQuery({
    queryKey: ['tenants', 'recent', scope?.id ?? null],
    queryFn: () =>
      scope
        ? tenantApi.get(scope.id).then((tenant) => ({ content: [tenant], page: { totalElements: 1 } }))
        : tenantApi.list({ page: 0, size: 5, sort: 'createdAt', direction: 'desc' }),
  });

  const derived = useMemo(() => {
    const rows = scope ? [scope] : (all.data?.content ?? []);
    const now = Date.now();
    const rangeStart = now - rangeDays * 86_400_000;
    const prevStart = now - rangeDays * 2 * 86_400_000;
    const created = rows.filter((row) => new Date(row.createdAt).getTime() >= rangeStart);
    const previous = rows.filter((row) => {
      const time = new Date(row.createdAt).getTime();
      return time >= prevStart && time < rangeStart;
    });
    return {
      total: scope ? 1 : (all.data?.page.totalElements ?? 0),
      loaded: rows.length,
      fullSet: !scope && (all.data?.page.totalElements ?? 0) <= rows.length,
      active: rows.filter((row) => row.status === 'ACTIVE').length,
      suspended: rows.filter((row) => row.status === 'SUSPENDED').length,
      pending: rows.filter((row) => row.status === 'PENDING_VERIFICATION').length,
      trials: rows.filter((row) => row.status === 'TRIAL').length,
      created: created.length,
      previous: previous.length,
      rows,
    };
  }, [all.data, scope, rangeDays]);

  const growth = useMemo(() => buildBuckets(derived.rows, rangeDays), [derived.rows, rangeDays]);

  const statusDistribution = useMemo(() => {
    const map = new Map<string, number>();
    derived.rows.forEach((row) => map.set(row.status, (map.get(row.status) ?? 0) + 1));
    return [...map.entries()].map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);
  }, [derived.rows]);

  const delta =
    derived.previous === 0
      ? derived.created > 0
        ? 'No restaurants in the previous period'
        : 'No change vs previous period'
      : `${derived.created >= derived.previous ? '+' : ''}${Math.round(
          ((derived.created - derived.previous) / derived.previous) * 100,
        )}% vs previous ${rangeDays} days`;

  const quickActions = [
    { label: 'Add restaurant', icon: <Plus size={16} />, onClick: () => navigate('/tenants?new=1') },
    { label: 'Review onboarding', icon: <UserCheck size={16} />, onClick: () => navigate('/onboarding') },
    { label: 'Manage plans', icon: <TicketPercent size={16} />, onClick: () => navigate('/plans') },
    { label: 'Manage roles', icon: <ShieldCheck size={16} />, onClick: () => navigate('/roles') },
    { label: 'View invoices', icon: <Receipt size={16} />, onClick: () => navigate('/invoices') },
  ];

  return (
    <>
      <PageHeader
        title="Platform overview"
        subtitle="Every number on this page comes from live superadmin endpoints."
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            {scope ? (
              <Chip color="primary" variant="outlined" label={`Scoped: ${scope.name}`} onDelete={() => navigate('/')} />
            ) : null}
            <TextField
              select
              size="small"
              value={rangeDays}
              onChange={(event) => setRangeDays(Number(event.target.value))}
              sx={{ width: 130 }}
              aria-label="Date range"
            >
              <MenuItem value={7}>Last 7 days</MenuItem>
              <MenuItem value={30}>Last 30 days</MenuItem>
              <MenuItem value={90}>Last 90 days</MenuItem>
            </TextField>
          </Stack>
        }
      />

      {all.isPending || stats.isPending ? <LoadingState /> : null}
      {all.isError ? <ErrorState message={all.error.message} onRetry={() => void all.refetch()} /> : null}
      {stats.isError ? <ErrorState message={stats.error.message} onRetry={() => void stats.refetch()} /> : null}

      {all.data && stats.data ? (
        <Stack spacing={3}>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(4, 1fr)',
                xl: 'repeat(6, 1fr)',
              },
            }}
          >
            <KpiCard
              label="Total restaurants"
              value={derived.total}
              icon={<Store size={18} />}
              tone="info"
              sub={derived.fullSet ? undefined : `based on first ${derived.loaded} records`}
              onClick={() => navigate('/tenants')}
            />
            <KpiCard label="Active" value={derived.active} icon={<Activity size={18} />} tone="success" />
            <KpiCard label="Trials" value={derived.trials} icon={<CreditCard size={18} />} tone="warning" />
            <KpiCard
              label={`Created (${rangeDays}d)`}
              value={derived.created}
              icon={<Plus size={18} />}
              tone="info"
              sub={delta}
            />
            <KpiCard
              label="Pending verification"
              value={derived.pending}
              icon={<UserCheck size={18} />}
              tone="info"
              onClick={() => navigate('/onboarding')}
            />
            <KpiCard
              label="Suspended"
              value={derived.suspended}
              icon={<Activity size={18} />}
              tone="error"
            />
          </Box>

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
                xl: 'repeat(5, 1fr)',
              },
            }}
          >
            <KpiCard
              label="Total branches"
              value={stats.data.branches.total}
              sub={`${stats.data.branches.active} active · ${stats.data.branches.paused} paused`}
              icon={<GitBranch size={18} />}
              tone="info"
              onClick={() => navigate('/branches')}
            />
            <KpiCard
              label="Total users"
              value={stats.data.users.total}
              sub={`${stats.data.users.active} active`}
              icon={<Users size={18} />}
              tone="info"
              onClick={() => navigate('/users')}
            />
            <KpiCard
              label="Active subscriptions"
              value={stats.data.subscriptions.active}
              sub={`${stats.data.subscriptions.trialing} trialing · ${stats.data.subscriptions.expiringSoon} expiring`}
              icon={<CreditCard size={18} />}
              tone="success"
              onClick={() => navigate('/subscriptions')}
            />
            <KpiCard
              label="MRR"
              value={"₹" + stats.data.mrr.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              sub={`${stats.data.planDistribution.reduce((sum, plan) => sum + plan.subscribers, 0)} plans assigned`}
              icon={<TrendingUp size={18} />}
              tone="success"
              onClick={() => navigate('/revenue')}
            />
            <KpiCard
              label="Outstanding invoices"
              value={"₹" + stats.data.outstandingAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              sub={`${stats.data.invoiceOpen} open`}
              icon={<Receipt size={18} />}
              tone="warning"
              onClick={() => navigate('/invoices')}
            />
          </Box>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {quickActions.map((action) => (
              <Button key={action.label} variant="outlined" startIcon={action.icon} onClick={action.onClick}>
                {action.label}
              </Button>
            ))}
          </Stack>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
            <Card sx={{ p: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h4">Restaurant growth</Typography>
                  <Typography variant="caption" color="text.secondary">
                    New restaurants per day
                  </Typography>
                </Box>
                <Chip size="small" label={`${rangeDays} days`} />
              </Stack>
              <Box sx={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growth} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={ORANGE} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={ORANGE} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDF0F6" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#5A6478' }} interval="preserveStartEnd" minTickGap={28} />
                    <YAxis tick={{ fontSize: 11, fill: '#5A6478' }} allowDecimals={false} width={40} />
                    <ChartTooltip contentStyle={{ borderRadius: 10, border: '1px solid #E4E9F2', fontSize: 12 }} />
                    <Area type="monotone" dataKey="count" stroke={ORANGE} strokeWidth={2} fill="url(#growthFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Card>

            <Card sx={{ p: 2.5 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h4">Paid subscription revenue</Typography>
                <Typography variant="caption" color="text.secondary">
                  Last 12 months · from paid invoices
                </Typography>
              </Box>
              <Box sx={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.data.revenueLast12Months} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDF0F6" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#5A6478' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#5A6478' }} width={50} />
                    <ChartTooltip contentStyle={{ borderRadius: 10, border: '1px solid #E4E9F2', fontSize: 12 }} />
                    <Bar dataKey="amount" fill={GREEN} radius={[4, 4, 0, 0]} maxBarSize={26} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </Box>

          <Card sx={{ p: 2.5 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h4">Status distribution</Typography>
              <Typography variant="caption" color="text.secondary">
                Restaurants by lifecycle status
              </Typography>
            </Box>
            <Box sx={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusDistribution} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDF0F6" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#5A6478' }} />
                  <YAxis type="category" dataKey="status" width={110} tick={{ fontSize: 10.5, fill: '#5A6478' }} />
                  <ChartTooltip contentStyle={{ borderRadius: 10, border: '1px solid #E4E9F2', fontSize: 12 }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                    {statusDistribution.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#9AA3B5'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '3fr 2fr' } }}>
            <Card>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, py: 2 }}>
                <Box>
                  <Typography variant="h4">Recent restaurants</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Latest registrations
                  </Typography>
                </Box>
                <Button size="small" onClick={() => navigate('/tenants')}>
                  View all
                </Button>
              </Stack>
              <Divider />
              {recent.isPending ? (
                <Box sx={{ p: 3 }}>
                  <LoadingState />
                </Box>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Restaurant</TableCell>
                      <TableCell>Slug</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(recent.data?.content ?? []).map((tenant) => (
                      <TableRow key={tenant.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {tenant.name}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 12.5 }}>/{tenant.slug}</TableCell>
                        <TableCell>
                          <StatusBadge status={tenant.status} />
                        </TableCell>
                        <TableCell>{new Date(tenant.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell align="right">
                          <Button size="small" onClick={() => navigate(`/tenants/${tenant.id}`)}>
                            View details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(recent.data?.content ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          No restaurants yet.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              )}
            </Card>

            <Card>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, py: 2 }}>
                <Box>
                  <Typography variant="h4">Recent activity</Typography>
                  <Typography variant="caption" color="text.secondary">
                    From audit_logs
                  </Typography>
                </Box>
                <Button size="small" onClick={() => navigate('/audit')}>
                  View all
                </Button>
              </Stack>
              <Divider />
              {audit.isPending ? (
                <Box sx={{ p: 3 }}>
                  <LoadingState />
                </Box>
              ) : audit.isError ? (
                <Box sx={{ p: 3 }}>
                  <ErrorState message={audit.error.message} onRetry={() => void audit.refetch()} />
                </Box>
              ) : (
                <Stack divider={<Divider />} sx={{ px: 2.5, py: 1 }}>
                  {(audit.data?.content ?? []).map((entry) => (
                    <Stack key={entry.id} spacing={0.25} sx={{ py: 1.25 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {entry.action}
                      </Typography>
                      <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                        {entry.entityType}
                        {entry.entityId ? ` #${entry.entityId}` : ''} · {entry.actorEmail ?? 'system'}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: '#9AA3B5' }}>
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ''}
                      </Typography>
                    </Stack>
                  ))}
                  {(audit.data?.content ?? []).length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No audit entries yet.
                    </Typography>
                  ) : null}
                </Stack>
              )}
            </Card>
          </Box>
        </Stack>
      ) : null}
    </>
  );
}
