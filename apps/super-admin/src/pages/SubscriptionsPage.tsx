import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  CreditCard,
  Download,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Users,
  X,
  Check,
  Activity,
  CalendarClock,
  Ban,
} from 'lucide-react';
import { ConfirmDialog, EmptyState, ErrorState, LoadingState, PageHeader } from '@resto/ui';
import { platformApi, tenantApi } from '@/api';
import { formatInr } from '@/format';
import { useToast } from '@/components/toast';

const statusColor: Record<string, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
  ACTIVE: 'success',
  TRIALING: 'warning',
  CANCELLED: 'default',
  PAST_DUE: 'error',
  EXPIRED: 'default',
};


export function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(25);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [assignOpen, setAssignOpen] = useState(false);
  const [tenantId, setTenantId] = useState<number | ''>('');
  const [planCode, setPlanCode] = useState('STARTER');
  const [target, setTarget] = useState<{ id: number; action: 'cancel' | 'activate'; name: string } | null>(null);

  const subs = useQuery({
    queryKey: ['sa-subscriptions', { page, size, search, status }],
    queryFn: () => platformApi.subscriptions({ page, size, search: search || undefined, status: status === 'ALL' ? undefined : status }),
  });

  const plans = useQuery({ queryKey: ['plans'], queryFn: () => platformApi.plans(), staleTime: 300_000 });
  const tenants = useQuery({
    queryKey: ['tenants', 'scope-list'],
    queryFn: () => tenantApi.list({ page: 0, size: 100, sort: 'name', direction: 'asc' }),
  });

  const allSubs = useMemo(() => subs.data?.content ?? [], [subs.data]);

  const filtered = useMemo(() => {
    let list = allSubs;
    if (planFilter !== 'ALL') {
      list = list.filter((s: any) => s.planCode === planFilter || s.planName === planFilter);
    }
    return list;
  }, [allSubs, planFilter]);

  const stats = useMemo(() => {
    const total = subs.data?.page?.totalElements ?? allSubs.length;
    const active = allSubs.filter((s: any) => s.status === 'ACTIVE').length;
    const trialing = allSubs.filter((s: any) => s.status === 'TRIALING').length;
    const cancelled = allSubs.filter((s: any) => s.status === 'CANCELLED').length;
    return { total, active, trialing, cancelled };
  }, [allSubs, subs.data?.page?.totalElements]);

  const assign = useMutation({
    mutationFn: () => platformApi.assignSubscription({ tenantId: Number(tenantId), planCode }),
    onSuccess: () => {
      toast('Subscription assigned — first invoice generated');
      setAssignOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['sa-subscriptions'] });
      void queryClient.invalidateQueries({ queryKey: ['sa-invoices'] });
      void queryClient.invalidateQueries({ queryKey: ['sa-stats'] });
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  const change = useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'cancel' | 'activate' }) =>
      action === 'cancel' ? platformApi.cancelSubscription(id) : platformApi.activateSubscription(id),
    onSuccess: (_data, vars) => {
      toast(vars.action === 'cancel' ? 'Subscription cancelled' : 'Subscription reactivated');
      setTarget(null);
      void queryClient.invalidateQueries({ queryKey: ['sa-subscriptions'] });
      void queryClient.invalidateQueries({ queryKey: ['sa-stats'] });
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  const downloadCsv = () => {
    const headers = ['Tenant', 'Tenant ID', 'Plan', 'Status', 'Price (INR/mo)', 'Period Start', 'Period End'];
    const rows = filtered.map((s: any) => [
      `"${(s.tenantName || '').replace(/"/g, '""')}"`,
      s.tenantId ?? '',
      s.planName || s.planCode || '',
      s.status || '',
      s.priceMonthly ?? '',
      s.currentPeriodStart ? new Date(s.currentPeriodStart).toISOString().slice(0, 10) : '',
      s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toISOString().slice(0, 10) : '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `subscriptions-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <PageHeader
        title="Subscriptions"
        subtitle="Manage tenant subscriptions, renewals and cancellations across all tenants."
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Tooltip title="Refresh data">
              <Button
                variant="outlined"
                startIcon={<RefreshCw size={16} />}
                onClick={() => {
                  void queryClient.invalidateQueries({ queryKey: ['sa-subscriptions'] });
                  void queryClient.invalidateQueries({ queryKey: ['sa-stats'] });
                }}
              >
                Refresh
              </Button>
            </Tooltip>
            <Button variant="outlined" startIcon={<Download size={16} />} onClick={downloadCsv} disabled={filtered.length === 0}>
              Export CSV
            </Button>
            <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setAssignOpen(true)}>
              + Assign Plan
            </Button>
          </Stack>
        }
      />

      <Stack direction="row" spacing={1.5} sx={{ mb: 2.5, overflowX: 'auto', pb: 0.5 }} useFlexGap>
        {[
          { label: 'Total Subscriptions', value: stats.total, icon: CreditCard, color: '#111C30' },
          { label: 'Active', value: stats.active, icon: Activity, color: '#22C55E' },
          { label: 'Trialing', value: stats.trialing, icon: CalendarClock, color: '#F59E0B' },
          { label: 'Cancelled', value: stats.cancelled, icon: Ban, color: '#EF4444' },
        ].map((card) => (
          <Box
            key={card.label}
            sx={{
              minWidth: 230,
              flex: { xs: '0 0 auto', md: '1 1 0' },
              bgcolor: '#fff',
              border: '1px solid #E4E9F2',
              borderRadius: 2,
              px: 2,
              py: 1.75,
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.01)',
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  bgcolor: `${card.color}14`,
                  color: card.color,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <card.icon size={18} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {card.label}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {card.value}
                </Typography>
              </Box>
            </Stack>
          </Box>
        ))}
      </Stack>

      <Card sx={{ border: '1px solid #E4E9F2', borderRadius: 2, boxShadow: '0 1px 2px rgba(15, 23, 42, 0.01)' }}>
        <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search by tenant name, domain or ID"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            sx={{ minWidth: { xs: '100%', md: 300 }, flex: { md: 1 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} color="#64748B" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            size="small"
            label="Status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="TRIALING">Trialing</MenuItem>
            <MenuItem value="CANCELLED">Cancelled</MenuItem>
            <MenuItem value="PAST_DUE">Past Due</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label="Plan"
            value={planFilter}
            onChange={(event) => {
              setPlanFilter(event.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="ALL">All Plans</MenuItem>
            {(plans.data ?? []).map((plan: any) => (
              <MenuItem key={plan.code} value={plan.code}>
                {plan.name}
              </MenuItem>
            ))}
          </TextField>
          {(search || status !== 'ALL' || planFilter !== 'ALL') && (
            <Button
              size="small"
              startIcon={<Filter size={14} />}
              onClick={() => {
                setSearch('');
                setStatus('ALL');
                setPlanFilter('ALL');
                setPage(0);
              }}
            >
              Clear Filters
            </Button>
          )}
        </Box>
        <Divider />

        {subs.isPending ? <LoadingState /> : null}
        {subs.isError ? <ErrorState message={(subs.error as Error).message} onRetry={() => void subs.refetch()} /> : null}
        {subs.data && filtered.length === 0 ? <EmptyState title="No subscriptions found" description="Try adjusting your search or filters." /> : null}

        {subs.data && filtered.length > 0 ? (
          <>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell>Tenant</TableCell>
                    <TableCell>Plan</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Billing Period</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((sub: any) => (
                    <TableRow key={sub.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <Box
                            sx={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              bgcolor: '#F8FAFC',
                              border: '1px solid #E4E9F2',
                              display: 'grid',
                              placeItems: 'center',
                              color: '#475569',
                              flexShrink: 0,
                            }}
                          >
                            <Users size={18} />
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {sub.tenantName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Tenant ID: {sub.tenantId}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{sub.planName ?? sub.planCode}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {sub.planCode}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={sub.status} color={statusColor[sub.status] ?? 'default'} sx={{ textTransform: 'capitalize' }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {formatInr(sub.priceMonthly)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          /mo
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {sub.currentPeriodStart ? new Date(sub.currentPeriodStart).toLocaleDateString() : '—'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          to {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {sub.status === 'CANCELLED' ? (
                          <Button
                            size="small"
                            startIcon={<Check size={14} />}
                            onClick={() => setTarget({ id: sub.id, action: 'activate', name: sub.tenantName })}
                          >
                            Reactivate
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            startIcon={<X size={14} />}
                            onClick={() => setTarget({ id: sub.id, action: 'cancel', name: sub.tenantName })}
                          >
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            <TablePagination
              component="div"
              count={subs.data.page.totalElements}
              page={page}
              rowsPerPage={size}
              onPageChange={(_, next) => setPage(next)}
              onRowsPerPageChange={(event) => {
                setSize(Number(event.target.value));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          </>
        ) : null}
      </Card>

      {subs.isPending ? <LoadingState /> : null}
      {subs.isError ? <ErrorState message={subs.error.message} onRetry={() => void subs.refetch()} /> : null}

      {subs.data ? (
        <>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tenant</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Period</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subs.data.content.map((sub) => (
                <TableRow key={sub.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {sub.tenantName}
                    </Typography>
                    <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                      tenant #{sub.tenantId}
                    </Typography>
                  </TableCell>
                  <TableCell>{sub.planName ?? sub.planCode}</TableCell>
                  <TableCell>
                    <Chip size="small" label={sub.status} color={statusColor[sub.status] ?? 'default'} />
                  </TableCell>
                  <TableCell>{sub.priceMonthly != null ? `${formatInr(sub.priceMonthly)}/mo` : '—'}</TableCell>
                  <TableCell>
                    {sub.currentPeriodStart ? new Date(sub.currentPeriodStart).toLocaleDateString() : '—'} →{' '}
                    {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell align="right">
                    {sub.status === 'CANCELLED' ? (
                      <Button
                        size="small"
                        startIcon={<Check size={14} />}
                        onClick={() => setTarget({ id: sub.id, action: 'activate', name: sub.tenantName })}
                      >
                        Reactivate
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        color="error"
                        startIcon={<X size={14} />}
                        onClick={() => setTarget({ id: sub.id, action: 'cancel', name: sub.tenantName })}
                      >
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {subs.data.content.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    No subscriptions found. Assign a plan to a tenant to create one.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={subs.data.page.totalElements}
            page={page}
            rowsPerPage={size}
            onPageChange={(_, next) => setPage(next)}
            onRowsPerPageChange={(event) => {
              setSize(Number(event.target.value));
              setPage(0);
            }}
          />
        </>
      ) : null}

      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Assign a plan</DialogTitle>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!tenantId) return;
            assign.mutate();
          }}
        >
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                select
                label="Tenant"
                value={tenantId}
                onChange={(event) => setTenantId(Number(event.target.value))}
                required
                fullWidth
              >
                {(tenants.data?.content ?? []).map((tenant) => (
                  <MenuItem key={tenant.id} value={tenant.id}>
                    {tenant.name} ({tenant.status})
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Plan"
                value={planCode}
                onChange={(event) => setPlanCode(event.target.value)}
                required
                fullWidth
              >
                {(plans.data ?? []).map((plan) => (
                  <MenuItem key={plan.code} value={plan.code}>
                    {plan.name} — {formatInr(plan.priceMonthly)}/mo
                  </MenuItem>
                ))}
              </TextField>
              <Alert severity="info" variant="outlined">
                Assigning creates or updates the subscription and generates an OPEN invoice for the
                first period.
              </Alert>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={assign.isPending || !tenantId}>
              Assign
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={target !== null}
        title={target?.action === 'cancel' ? 'Cancel subscription?' : 'Reactivate subscription?'}
        description={
          target?.action === 'cancel'
            ? `Cancel the subscription of "${target?.name}"? It will be marked CANCELLED immediately.`
            : `Reactivate the subscription of "${target?.name}"? A fresh 30-day period starts now.`
        }
        confirmLabel={target?.action === 'cancel' ? 'Cancel subscription' : 'Reactivate'}
        destructive={target?.action === 'cancel'}
        loading={change.isPending}
        onCancel={() => setTarget(null)}
        onConfirm={() => {
          if (target) change.mutate({ id: target.id, action: target.action });
        }}
      />
    </>
  );
}
