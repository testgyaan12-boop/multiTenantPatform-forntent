import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ErrorState, LoadingState, PageHeader } from '@resto/ui';
import { platformApi } from '@/api';
import { formatInr } from '@/format';
import { AMBER, BLUE, GREEN, NAVY, ORANGE } from '@/theme';
import { KpiCard } from '@/components/KpiCard';

const COLORS = [ORANGE, GREEN, BLUE, AMBER, NAVY];

export function RevenuePage() {
  const stats = useQuery({ queryKey: ['sa-stats'], queryFn: () => platformApi.stats() });

  return (
    <>
      <PageHeader
        title="Revenue Analytics"
        subtitle="MRR, plan distribution and paid subscription revenue over the last 12 months."
      />

      {stats.isPending ? <LoadingState /> : null}
      {stats.isError ? <ErrorState message={stats.error.message} onRetry={() => void stats.refetch()} /> : null}

      {stats.data ? (
        <StackedContent stats={stats.data} />
      ) : null}
    </>
  );
}

function StackedContent({ stats }: { stats: Awaited<ReturnType<typeof platformApi.stats>> }) {
  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
        }}
      >
        <KpiCard label="MRR" value={formatInr(stats.mrr)} sub="sum of active plan prices" tone="success" />
        <KpiCard label="Open invoices" value={stats.invoiceOpen} tone="warning" />
        <KpiCard label="Outstanding" value={formatInr(stats.outstandingAmount)} tone="error" />
        <KpiCard label="Paid this month" value={formatInr(stats.paidThisMonth)} tone="info" />
      </Box>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '3fr 2fr' } }}>
        <Card sx={{ p: 2.5 }}>
          <Typography variant="h4" sx={{ mb: 2 }}>
            Paid revenue by month
          </Typography>
          <Box sx={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.revenueLast12Months} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDF0F6" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10.5, fill: '#5A6478' }} />
                <YAxis tick={{ fontSize: 11, fill: '#5A6478' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #E4E9F2', fontSize: 12 }}
                  formatter={(value) => [formatInr(Number(value)), 'Paid']}
                />
                <Bar dataKey="amount" fill={GREEN} radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Typography variant="h4" sx={{ mb: 2 }}>
            Plan distribution
          </Typography>
          <Box sx={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.planDistribution}
                layout="vertical"
                margin={{ top: 0, right: 12, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#EDF0F6" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#5A6478' }} />
                <YAxis type="category" dataKey="code" width={90} tick={{ fontSize: 11, fill: '#5A6478' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #E4E9F2', fontSize: 12 }}
                  formatter={(value) => [`${value}`, 'Subscribers']}
                />
                <Bar dataKey="subscribers" radius={[0, 6, 6, 0]} barSize={18}>
                  {stats.planDistribution.map((entry, index) => (
                    <Cell key={entry.code} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
          <Table size="small" sx={{ mt: 1 }}>
            <TableHead>
              <TableRow>
                <TableCell>Plan</TableCell>
                <TableCell>Subscribers</TableCell>
                <TableCell>MRR</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stats.planDistribution.map((plan) => (
                <TableRow key={plan.code}>
                  <TableCell>{plan.name}</TableCell>
                  <TableCell>{plan.subscribers}</TableCell>
                  <TableCell>{formatInr(plan.mrr)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Box>
    </Box>
  );
}
