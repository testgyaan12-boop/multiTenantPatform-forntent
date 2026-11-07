import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Popover,
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
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Users,
  XCircle,
} from 'lucide-react';
import { ConfirmDialog, ErrorState, LoadingState, PageHeader } from '@resto/ui';
import type { SubscriptionPlan, TenantCreateRequest, TenantSummary } from '@resto/types';
import { publicApi, tenantApi } from '@/api';
import { StatusBadge } from '@/components/StatusBadge';
import { useToast } from '@/components/toast';
import type { ShellScope } from '@/layout/AppLayout';

type StatusFilter = 'ALL' | TenantSummary['status'];
type LifecycleAction = 'activate' | 'suspend' | 'verify' | 'reject';

const STATUSES: StatusFilter[] = [
  'ALL',
  'ACTIVE',
  'TRIAL',
  'PENDING_VERIFICATION',
  'SUSPENDED',
  'CANCELLED',
];

const emptyTenant: TenantCreateRequest = {
  name: '',
  slug: '',
  ownerEmail: '',
  ownerFirstName: '',
  ownerLastName: '',
  planCode: 'STARTER',
  timezone: 'UTC',
  currency: 'INR',
  businessType: 'RESTAURANT',
};

const BUSINESS_TYPES: { value: NonNullable<TenantCreateRequest['businessType']>; label: string; hint: string }[] = [
  { value: 'RESTAURANT', label: 'Restaurant / Hotel', hint: 'QR ordering, tables and kitchen' },
  { value: 'ELECTRONICS', label: 'Electronics store', hint: 'Computers, mobiles and gadgets' },
  { value: 'VEHICLE', label: 'Vehicle dealership', hint: 'Two-wheeler and four-wheeler sales' },
  { value: 'REAL_ESTATE', label: 'Builder / Broker', hint: 'Property listings and enquiries' },
];

const NAME_LABELS: Record<string, string> = {
  RESTAURANT: 'Restaurant name',
  ELECTRONICS: 'Store name',
  VEHICLE: 'Dealership name',
  REAL_ESTATE: 'Business name',
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function downloadCsv(rows: TenantSummary[]) {
  const header = ['name', 'slug', 'status', 'contactEmail', 'contactPhone', 'currency', 'timezone', 'trialEndsAt', 'createdAt'];
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [
    header.join(','),
    ...rows.map((row) =>
      [
        row.name,
        row.slug,
        row.status,
        row.contactEmail,
        row.contactPhone,
        row.currency,
        row.timezone,
        row.trialEndsAt,
        row.createdAt,
      ]
        .map(escape)
        .join(','),
    ),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tenants-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

const steps = ['Business Information', 'Owner Account', 'Subscription & Configuration', 'Review & Create'];

export function TenantsPage() {
  const navigate = useNavigate();
  const { scope } = useOutletContext<ShellScope>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('ALL');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<TenantCreateRequest>(emptyTenant);
  const [formError, setFormError] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [target, setTarget] = useState<{ tenant: TenantSummary; action: LifecycleAction } | null>(
    null,
  );
  const [selected, setSelected] = useState<number[]>([]);
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; tenant: TenantSummary } | null>(null);
  const [dateAnchor, setDateAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setWizardOpen(true);
      setStep(0);
      setForm(emptyTenant);
      setFormError(null);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const clientFiltered =
    statusFilter !== 'ALL' ||
    businessTypeFilter !== 'ALL' ||
    planFilter !== 'ALL' ||
    createdFrom !== '' ||
    createdTo !== '' ||
    scope !== null;

  const paged = useQuery({
    queryKey: ['tenants', 'paged', { page, size, search: debouncedSearch }],
    queryFn: () => tenantApi.list({ page, size, search: debouncedSearch || undefined }),
    enabled: !clientFiltered,
  });

  const allRows = useQuery({
    queryKey: ['tenants', 'all'],
    queryFn: () => tenantApi.list({ page: 0, size: 500, sort: 'createdAt', direction: 'desc' }),
    enabled: clientFiltered,
  });

  const plans = useQuery({
    queryKey: ['plans'],
    queryFn: () => publicApi.plans(),
    staleTime: 5 * 60_000,
  });

  const filteredRows = useMemo(() => {
    let rows = (allRows.data?.content ?? []).filter((tenant) => {
      const matchesScope = !scope || tenant.id === scope.id;
      const matchesStatus = statusFilter === 'ALL' || tenant.status === statusFilter;
      const tenantBusinessType = (tenant as any).businessType;
      const matchesBusinessType =
        businessTypeFilter === 'ALL' ||
        tenantBusinessType === businessTypeFilter ||
        tenantBusinessType?.toUpperCase?.() === businessTypeFilter;
      const tenantPlan =
        (tenant as any).subscriptionPlan ??
        (tenant as any).planName ??
        (tenant as any).planCode ??
        '';
      const matchesPlan = planFilter === 'ALL' || tenantPlan === planFilter || tenantPlan.includes(planFilter);
      const query = debouncedSearch.trim().toLowerCase();
      const matchesSearch =
        !query ||
        tenant.name.toLowerCase().includes(query) ||
        tenant.slug.toLowerCase().includes(query) ||
        (tenant.contactEmail ?? '').toLowerCase().includes(query) ||
        String(tenant.id).includes(query) ||
        ((tenant as any).ownerName ?? '').toLowerCase().includes(query);
      const createdAt = tenant.createdAt ? new Date(tenant.createdAt) : null;
      const matchesFrom = !createdFrom || (createdAt && createdAt >= new Date(`${createdFrom}T00:00:00`));
      const matchesTo = !createdTo || (createdAt && createdAt <= new Date(`${createdTo}T23:59:59`));
      return matchesScope && matchesStatus && matchesBusinessType && matchesPlan && matchesSearch && matchesFrom && matchesTo;
    });
    return rows;
  }, [allRows.data, scope, statusFilter, businessTypeFilter, planFilter, debouncedSearch, createdFrom, createdTo]);

  const clientPageRows = useMemo(() => {
    const start = page * size;
    return filteredRows.slice(start, start + size);
  }, [filteredRows, page, size]);

  const rows = clientFiltered ? clientPageRows : (paged.data?.content ?? []);
  const totalCount = clientFiltered
    ? filteredRows.length
    : (paged.data?.page.totalElements ?? 0);

  const create = useMutation({
    mutationFn: (payload: TenantCreateRequest) => tenantApi.create(payload),
    onSuccess: (tenant) => {
      toast(`Tenant "${(tenant as any).name ?? form.name}" created`);
      setWizardOpen(false);
      setForm(emptyTenant);
      setStep(0);
      void queryClient.invalidateQueries({ queryKey: ['tenants'] });
      navigate(`/tenants/${(tenant as any).id}`);
    },
    onError: (error: Error) => setFormError(error.message),
  });

  const act = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: LifecycleAction }) => {
      if (action === 'activate') await tenantApi.activate(id);
      else if (action === 'suspend') await tenantApi.suspend(id);
      else if (action === 'verify') await tenantApi.verify(id);
      else await tenantApi.reject(id);
    },
    onSuccess: (_data, variables) => {
      toast(
        variables.action === 'activate'
          ? 'Tenant activated'
          : variables.action === 'suspend'
            ? 'Tenant suspended'
            : variables.action === 'verify'
              ? 'Tenant verified'
              : 'Tenant rejected',
      );
      setTarget(null);
      void queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  function validateStep(current: number): string | null {
    if (current === 0) {
      if (form.name.trim().length < 2) return 'Business name is required (min 2 characters).';
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) return 'Slug must be lowercase letters, numbers and hyphens.';
      if (!form.currency || !/^[A-Za-z]{3}$/.test(form.currency)) return 'Currency must be a 3-letter ISO code.';
      if (!form.timezone?.trim()) return 'Timezone is required.';
    }
    if (current === 1) {
      if (!form.ownerFirstName.trim() || !form.ownerLastName.trim()) return 'Owner name is required.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.ownerEmail)) return 'A valid owner email is required.';
    }
    if (current === 2) {
      if (!form.planCode) return 'Select a plan.';
    }
    return null;
  }

  const exportRows = clientFiltered ? filteredRows : (paged.data?.content ?? []);

  const allForKpi = useMemo(() => (allRows.data?.content ?? []), [allRows.data?.content]);

  const kpi = useMemo(() => {
    const total = allForKpi.length;
    const active = allForKpi.filter((t) => t.status === 'ACTIVE').length;
    const trial = allForKpi.filter((t) => t.status === 'TRIAL').length;
    const suspended = allForKpi.filter((t) => t.status === 'SUSPENDED').length;
    const pending = allForKpi.filter((t) => t.status === 'PENDING_VERIFICATION').length;
    const cancelled = allForKpi.filter((t) => t.status === 'CANCELLED').length;
    const expiringTrials = allForKpi.filter((t) => {
      if (t.status !== 'TRIAL' || !t.trialEndsAt) return false;
      const diff = new Date(t.trialEndsAt).getTime() - Date.now();
      return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
    }).length;
    return { total, active, trial, suspended, pending, cancelled, expiringTrials };
  }, [allForKpi]);

  const dateLabel = useMemo(() => {
    if (createdFrom && createdTo) return `${new Date(createdFrom).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} – ${new Date(createdTo).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}`;
    if (createdFrom) return `${new Date(createdFrom).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} – ...`;
    if (createdTo) return `... – ${new Date(createdTo).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}`;
    return 'Select date range';
  }, [createdFrom, createdTo]);

  return (
    <>
      <PageHeader
        title="Tenant Management"
        subtitle="Manage businesses, tenant access, subscriptions, branches, and account activity."
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Tooltip title="Refresh data">
              <Button
                variant="outlined"
                startIcon={<RefreshCw size={16} />}
                onClick={() => {
                  void queryClient.invalidateQueries({ queryKey: ['tenants'] });
                  void queryClient.invalidateQueries({ queryKey: ['plans'] });
                }}
              >
                Refresh
              </Button>
            </Tooltip>
            <Tooltip title={`Export ${exportRows.length} visible rows as CSV`}>
              <Button
                variant="outlined"
                startIcon={<Download size={16} />}
                onClick={() => downloadCsv(exportRows)}
                disabled={exportRows.length === 0}
              >
                Export CSV
              </Button>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              sx={{ bgcolor: '#FF5722', '&:hover': { bgcolor: '#F4511E' } }}
              onClick={() => {
                setForm(emptyTenant);
                setFormError(null);
                setStep(0);
                setWizardOpen(true);
              }}
            >
              Add Tenant
            </Button>
          </Stack>
        }
      />

      <Stack
        direction="row"
        spacing={1.5}
        sx={{ mb: 2.5, overflowX: 'auto', pb: 0.5 }}
        useFlexGap
      >
        {[
          { label: 'Total Tenants', value: kpi.total, icon: Building2, color: '#111C30', filter: 'ALL' },
          { label: 'Active Tenants', value: kpi.active, icon: CheckCircle2, color: '#22C55E', filter: 'ACTIVE' },
          { label: 'Trial Tenants', value: kpi.trial, icon: Clock, color: '#F59E0B', filter: 'TRIAL' },
          { label: 'Suspended Tenants', value: kpi.suspended, icon: XCircle, color: '#EF4444', filter: 'SUSPENDED' },
          { label: 'Trials Expiring Soon', value: kpi.expiringTrials, icon: ShieldAlert, color: '#FB923C', filter: 'TRIAL' },
          { label: 'Pending Tenants', value: kpi.pending, icon: Users, color: '#2563EB', filter: 'PENDING_VERIFICATION' },
        ].map((card) => (
          <Box
            key={card.label}
            onClick={() => {
              if (card.filter === 'ALL') {
                setStatusFilter('ALL');
              } else {
                setStatusFilter(card.filter as StatusFilter);
              }
              setPage(0);
            }}
            sx={{
              minWidth: 200,
              flex: { xs: '0 0 auto', md: '1 1 0' },
              bgcolor: '#fff',
              border: '1px solid #E4E9F2',
              borderRadius: 2,
              px: 2,
              py: 1.75,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.01)',
              '&:hover': { boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)', borderColor: 'rgba(255,87,34,0.4)' },
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 36,
                  height: 36,
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

      <Stack spacing={1.5} sx={{ mb: 2 }}>
        <Box
          sx={{
            bgcolor: '#fff',
            border: '1px solid #E4E9F2',
            borderRadius: 2,
            p: 1.5,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            alignItems: 'center',
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.01)',
          }}
        >
          <TextField
            size="small"
            placeholder="Search name, slug, owner, email or tenant ID"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            sx={{ minWidth: { xs: '100%', md: 320 }, flex: { md: 1.2 } }}
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
            label="Business Type"
            value={businessTypeFilter}
            onChange={(event) => {
              setBusinessTypeFilter(event.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="ALL">All Types</MenuItem>
            <MenuItem value="RESTAURANT">Restaurant / Hotel</MenuItem>
            <MenuItem value="ELECTRONICS">Electronics Store</MenuItem>
            <MenuItem value="VEHICLE">Vehicle Dealership</MenuItem>
            <MenuItem value="REAL_ESTATE">Builder / Broker</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as StatusFilter);
              setPage(0);
            }}
            sx={{ minWidth: 150 }}
          >
            {STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {status === 'ALL' ? 'All Statuses' : status === 'PENDING_VERIFICATION' ? 'Pending' : status.replace(/_/g, ' ').toLowerCase()}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Subscription Plan"
            value={planFilter}
            onChange={(event) => {
              setPlanFilter(event.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 170 }}
          >
            <MenuItem value="ALL">All Plans</MenuItem>
            {(plans.data ?? []).map((plan) => (
              <MenuItem key={plan.code} value={plan.code}>
                {plan.name}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="outlined"
            startIcon={<Calendar size={16} />}
            onClick={(event) => setDateAnchor(event.currentTarget)}
            sx={{ minWidth: 230, justifyContent: 'flex-start', color: createdFrom || createdTo ? '#111C30' : '#64748B' }}
          >
            {dateLabel}
          </Button>
          {(search || businessTypeFilter !== 'ALL' || statusFilter !== 'ALL' || planFilter !== 'ALL' || createdFrom || createdTo) ? (
            <Button
              size="small"
              onClick={() => {
                setSearch('');
                setDebouncedSearch('');
                setStatusFilter('ALL');
                setBusinessTypeFilter('ALL');
                setPlanFilter('ALL');
                setCreatedFrom('');
                setCreatedTo('');
                setPage(0);
              }}
            >
              Clear Filters
            </Button>
          ) : null}
        </Box>
        <Stack direction="row" spacing={1} flexWrap="nowrap" sx={{ overflowX: 'auto', pb: 0.25 }}>
          {(['ALL', 'ACTIVE', 'TRIAL', 'SUSPENDED', 'CANCELLED', 'PENDING_VERIFICATION'] as StatusFilter[]).map((s) => (
            <Chip
              key={s}
              label={s === 'ALL' ? 'All' : s === 'PENDING_VERIFICATION' ? 'Pending' : s.replace(/_/g, ' ').toLowerCase()}
              color={statusFilter === s ? 'primary' : 'default'}
              variant={statusFilter === s ? 'filled' : 'outlined'}
              onClick={() => {
                setStatusFilter(s);
                setPage(0);
              }}
              sx={{ textTransform: 'capitalize', whiteSpace: 'nowrap', height: 32, borderRadius: 2 }}
            />
          ))}
        </Stack>
        {statusFilter !== 'ALL' && statusFilter !== 'TRIAL' ? (
          <Typography variant="caption" color="text.secondary">
            Some filters may fall back to client-side filtering if not supported by the API.
          </Typography>
        ) : null}
        {scope ? (
          <Chip
            size="small"
            color="primary"
            variant="outlined"
            label={`Scope: ${scope.name}`}
            onDelete={() => navigate('/tenants')}
          />
        ) : null}
      </Stack>

      {(clientFiltered && allRows.isPending) || (!clientFiltered && paged.isPending) ? (
        <LoadingState />
      ) : null}
      {clientFiltered && allRows.isError ? (
        <ErrorState message={allRows.error.message} onRetry={() => void allRows.refetch()} />
      ) : null}
      {!clientFiltered && paged.isError ? (
        <ErrorState message={paged.error.message} onRetry={() => void paged.refetch()} />
      ) : null}

      {(clientFiltered ? allRows.data : paged.data) ? (
        <Box sx={{ border: '1px solid #E4E9F2', borderRadius: 2, bgcolor: '#fff', overflowX: 'auto' }}>
          {selected.length > 0 ? (
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="space-between"
              sx={{ px: 2, py: 1, bgcolor: 'rgba(255,87,34,0.04)', borderBottom: '1px solid #E4E9F2' }}
            >
              <Typography variant="body2" fontWeight={600}>
                {selected.length} selected
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined">
                  Export Selected
                </Button>
                <Button size="small" variant="outlined">
                  Activate Selected
                </Button>
                <Button size="small" variant="outlined" color="warning">
                  Suspend Selected
                </Button>
                <Button size="small" onClick={() => setSelected([])}>
                  Clear selection
                </Button>
              </Stack>
            </Stack>
          ) : null}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    size="small"
                    checked={rows.length > 0 && rows.every((r) => selected.includes(r.id))}
                    indeterminate={rows.some((r) => selected.includes(r.id)) && !rows.every((r) => selected.includes(r.id))}
                    onChange={(event) => {
                      if (event.target.checked) {
                        setSelected(Array.from(new Set([...selected, ...rows.map((r) => r.id)])));
                      } else {
                        setSelected(selected.filter((id) => !rows.find((r) => r.id === id)));
                      }
                    }}
                  />
                </TableCell>
                <TableCell>Business / Tenant</TableCell>
                <TableCell>Business Type</TableCell>
                <TableCell>Owner / Contact</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Subscription</TableCell>
                <TableCell>Branches</TableCell>
                <TableCell>Created Date</TableCell>
                <TableCell>Last Activity</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((tenant) => (
                <TableRow
                  key={tenant.id}
                  hover
                  sx={{ cursor: 'pointer', height: 68 }}
                  onClick={() => navigate(`/tenants/${tenant.id}`)}
                >
                  <TableCell padding="checkbox" onClick={(event) => event.stopPropagation()}>
                    <Checkbox
                      size="small"
                      checked={selected.includes(tenant.id)}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelected([...selected, tenant.id]);
                        } else {
                          setSelected(selected.filter((id) => id !== tenant.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: 'rgba(255,87,34,0.08)',
                          color: '#FF5722',
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        {(tenant.name?.[0] ?? 'T').toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {tenant.name}
                        </Typography>
                        <Typography sx={{ fontSize: 11.5, color: '#64748B' }}>
                          /{tenant.slug} · ID: {tenant.id}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const bt = (tenant as any).businessType;
                      if (bt === 'ELECTRONICS') return 'Electronics Store';
                      if (bt === 'VEHICLE') return 'Vehicle Dealership';
                      if (bt === 'REAL_ESTATE') return 'Builder / Broker';
                      if (bt === 'RESTAURANT') return 'Restaurant / Hotel';
                      return bt ?? '—';
                    })()}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{(tenant as any).ownerName ?? (tenant as any).ownerFullName ?? '—'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {tenant.contactEmail ?? (tenant as any).ownerEmail ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={tenant.status} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{(tenant as any).subscriptionPlan ?? (tenant as any).planName ?? (tenant as any).planCode ?? '—'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(tenant as any).billingStatus ?? (tenant as any).subscriptionStatus ?? '—'}
                      {(tenant.status === 'TRIAL' && tenant.trialEndsAt) ? ` · Expires ${new Date(tenant.trialEndsAt).toLocaleDateString()}` : (tenant as any).renewalDate ? ` · Renews ${new Date((tenant as any).renewalDate).toLocaleDateString()}` : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{(tenant as any).branchCount ?? '—'}</Typography>
                  </TableCell>
                  <TableCell>{tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>{(tenant as any).lastActivityAt ? new Date((tenant as any).lastActivityAt).toLocaleDateString() : '—'}</TableCell>
                  <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                    <IconButton
                      size="small"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setMenuAnchor({ el: event.currentTarget, tenant });
                      }}
                    >
                      <MoreVertical size={16} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                    <Stack spacing={1} alignItems="center">
                      <Building2 size={32} color="#9AA3B5" />
                      <Typography variant="subtitle1" fontWeight={600}>
                        No tenants found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Try adjusting your filters or create a new tenant.
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => {
                          setSearch('');
                          setDebouncedSearch('');
                          setStatusFilter('ALL');
                          setBusinessTypeFilter('ALL');
                          setPlanFilter('ALL');
                          setCreatedFrom('');
                          setCreatedTo('');
                          setPage(0);
                        }}
                      >
                        Clear filters
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            rowsPerPage={size}
            rowsPerPageOptions={[10, 25, 50, 100]}
            onPageChange={(_, next) => setPage(next)}
            onRowsPerPageChange={(event) => {
              setSize(Number(event.target.value));
              setPage(0);
            }}
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} of ${count}`}
          />
        </Box>
      ) : null}

      <Dialog
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        fullWidth
        maxWidth="md"
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h3">Add Tenant</Typography>
            <Chip size="small" label={`Step ${step + 1} of ${steps.length}`} color="primary" variant="outlined" />
          </Stack>
        </DialogTitle>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const error = validateStep(step);
            if (error) {
              setFormError(error);
              return;
            }
            if (step < steps.length - 1) {
              setFormError(null);
              setStep((value) => value + 1);
              return;
            }
            setFormError(null);
            create.mutate(form);
          }}
        >
          <DialogContent>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {steps.map((label, index) => (
                  <Chip
                    key={label}
                    size="small"
                    label={`${index + 1}. ${label}`}
                    color={index === step ? 'primary' : index < step ? 'success' : 'default'}
                    variant={index <= step ? 'filled' : 'outlined'}
                  />
                ))}
              </Stack>

              {step === 0 ? (
                <Stack spacing={2}>
                  <TextField
                    select
                    label="Business type"
                    value={form.businessType ?? 'RESTAURANT'}
                    onChange={(event) =>
                      setForm({ ...form, businessType: event.target.value as TenantCreateRequest['businessType'] })
                    }
                    fullWidth
                    helperText={
                      BUSINESS_TYPES.find((item) => item.value === (form.businessType ?? 'RESTAURANT'))?.hint
                    }
                  >
                    {BUSINESS_TYPES.map((item) => (
                      <MenuItem key={item.value} value={item.value}>
                        {item.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label={NAME_LABELS[form.businessType ?? 'RESTAURANT'] ?? 'Name'}
                      value={form.name}
                      onChange={(event) => {
                        const name = event.target.value;
                        setForm((current) => ({
                          ...current,
                          name,
                          slug:
                            current.slug === slugify(current.name) || !current.slug
                              ? slugify(name)
                              : current.slug,
                        }));
                      }}
                      required
                      fullWidth
                      autoFocus
                    />
                    <TextField
                      label="Slug"
                      value={form.slug}
                      onChange={(event) => setForm({ ...form, slug: event.target.value })}
                      required
                      fullWidth
                      helperText="URL key: lowercase letters, numbers, hyphens"
                    />
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="Currency"
                      inputProps={{ maxLength: 3 }}
                      value={form.currency}
                      onChange={(event) =>
                        setForm({ ...form, currency: event.target.value.toUpperCase() })
                      }
                      fullWidth
                      helperText="ISO 4217, e.g. INR"
                    />
                    <TextField
                      label="Timezone"
                      value={form.timezone ?? ''}
                      onChange={(event) => setForm({ ...form, timezone: event.target.value })}
                      fullWidth
                      helperText="IANA name, e.g. Europe/Berlin"
                    />
                  </Stack>
                  <Alert severity="info" variant="outlined">
                    Logo upload, cuisine and contact fields are collected by the restaurant app
                    after onboarding — they are not part of POST /superadmin/tenants.
                  </Alert>
                </Stack>
              ) : null}

              {step === 1 ? (
                <Stack spacing={2}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="Owner first name"
                      value={form.ownerFirstName}
                      onChange={(event) =>
                        setForm({ ...form, ownerFirstName: event.target.value })
                      }
                      required
                      fullWidth
                      autoFocus
                    />
                    <TextField
                      label="Owner last name"
                      value={form.ownerLastName}
                      onChange={(event) => setForm({ ...form, ownerLastName: event.target.value })}
                      required
                      fullWidth
                    />
                  </Stack>
                  <TextField
                    label="Owner email"
                    type="email"
                    value={form.ownerEmail}
                    onChange={(event) => setForm({ ...form, ownerEmail: event.target.value })}
                    required
                    helperText="The owner signs in with this address; invitation emails are not sent by the backend yet."
                  />
                </Stack>
              ) : null}

              {step === 2 ? (
                <Stack spacing={2}>
                  <TextField
                    select
                    label="Plan"
                    value={form.planCode}
                    onChange={(event) => setForm({ ...form, planCode: event.target.value })}
                    fullWidth
                  >
                    {(plans.data ?? []).map((plan: SubscriptionPlan) => (
                      <MenuItem key={plan.code} value={plan.code}>
                        {plan.name} ({plan.code})
                      </MenuItem>
                    ))}
                    {!plans.data ? (
                      <MenuItem value={form.planCode}>{form.planCode}</MenuItem>
                    ) : null}
                  </TextField>
                  <Alert severity="info" variant="outlined">
                    A trial period is applied by the backend based on its tenant defaults; trial
                    length is not configurable through this API.
                  </Alert>
                </Stack>
              ) : null}

              {step === 3 ? (
                <Stack spacing={1.5}>
                  {[
                    ['Store', `${form.name} (/${form.slug})`],
                    [
                      'Business type',
                      BUSINESS_TYPES.find((item) => item.value === (form.businessType ?? 'RESTAURANT'))?.label ??
                        (form.businessType ?? 'RESTAURANT'),
                    ],
                    ['Owner', `${form.ownerFirstName} ${form.ownerLastName} <${form.ownerEmail}>`],
                    ['Plan', form.planCode],
                    ['Locale', `${form.currency} · ${form.timezone}`],
                  ].map(([label, value]) => (
                    <Stack
                      key={label}
                      direction="row"
                      spacing={2}
                      sx={{
                        border: '1px solid #E4E9F2',
                        borderRadius: 2,
                        px: 2,
                        py: 1.25,
                        bgcolor: '#F9FBFE',
                      }}
                    >
                      <Typography variant="body2" sx={{ width: 110, fontWeight: 600 }}>
                        {label}
                      </Typography>
                      <Typography variant="body2">{value}</Typography>
                    </Stack>
                  ))}
                </Stack>
              ) : null}

              {formError ? <Alert severity="error">{formError}</Alert> : null}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setWizardOpen(false)}>Cancel</Button>
            {step > 0 ? (
              <Button onClick={() => setStep((value) => value - 1)}>Back</Button>
            ) : null}
            <Button type="submit" variant="contained" disabled={create.isPending}>
              {step === steps.length - 1 ? 'Create tenant' : 'Continue'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={target !== null}
        title={
          target?.action === 'activate'
            ? 'Activate tenant?'
            : target?.action === 'suspend'
              ? 'Suspend tenant?'
              : target?.action === 'verify'
                ? 'Verify tenant?'
                : 'Reject tenant?'
        }
        description={
          target
            ? `${target.action.charAt(0).toUpperCase()}${target.action.slice(1)} "${target.tenant.name}"? This takes effect immediately for all of its users. Suspending or rejecting does not silently delete tenant data.`
            : ''
        }
        confirmLabel={
          target
            ? target.action.charAt(0).toUpperCase() + target.action.slice(1)
            : 'Confirm'
        }
        destructive={target?.action === 'suspend' || target?.action === 'reject'}
        loading={act.isPending}
        onCancel={() => setTarget(null)}
        onConfirm={() => {
          if (target) act.mutate({ id: target.tenant.id, action: target.action });
        }}
      />

      <Popover
        open={Boolean(dateAnchor)}
        anchorEl={dateAnchor}
        onClose={() => setDateAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, minWidth: 320 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Filter by created date
          </Typography>
          <Stack spacing={1.5}>
            <TextField
              size="small"
              type="date"
              label="Created From"
              value={createdFrom}
              onChange={(event) => {
                setCreatedFrom(event.target.value);
                setPage(0);
              }}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: createdTo || undefined }}
              fullWidth
            />
            <TextField
              size="small"
              type="date"
              label="Created To"
              value={createdTo}
              onChange={(event) => {
                setCreatedTo(event.target.value);
                setPage(0);
              }}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: createdFrom || undefined }}
              fullWidth
            />
            <Stack direction="row" spacing={1} justifyContent="space-between">
              <Button
                size="small"
                onClick={() => {
                  setCreatedFrom('');
                  setCreatedTo('');
                  setPage(0);
                }}
              >
                Clear
              </Button>
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={() => setDateAnchor(null)}>
                  Cancel
                </Button>
                <Button size="small" variant="contained" sx={{ bgcolor: '#FF5722', '&:hover': { bgcolor: '#F4511E' } }} onClick={() => setDateAnchor(null)}>
                  Apply
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Box>
      </Popover>

      <Menu
        anchorEl={menuAnchor?.el}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        onClick={(event) => event.stopPropagation()}
        slotProps={{ paper: { sx: { minWidth: 220, borderRadius: 2 } } }}
      >
        {menuAnchor ? (
          <>
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                navigate(`/tenants/${menuAnchor.tenant.id}`);
              }}
            >
              View Details
            </MenuItem>
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                navigate(`/tenants/${menuAnchor.tenant.id}?tab=business`);
              }}
            >
              Edit Tenant
            </MenuItem>
            <Divider />
            {menuAnchor.tenant.status === 'SUSPENDED' || menuAnchor.tenant.status === 'CANCELLED' ? (
              <MenuItem
                onClick={() => {
                  setMenuAnchor(null);
                  setTarget({ tenant: menuAnchor.tenant, action: 'activate' });
                }}
              >
                Reactivate
              </MenuItem>
            ) : menuAnchor.tenant.status === 'PENDING_VERIFICATION' ? (
              <>
                <MenuItem
                  onClick={() => {
                    setMenuAnchor(null);
                    act.mutate({ id: menuAnchor.tenant.id, action: 'verify' });
                  }}
                >
                  Verify
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setMenuAnchor(null);
                    setTarget({ tenant: menuAnchor.tenant, action: 'reject' });
                  }}
                >
                  Reject
                </MenuItem>
              </>
            ) : (
              <MenuItem
                onClick={() => {
                  setMenuAnchor(null);
                  setTarget({ tenant: menuAnchor.tenant, action: 'suspend' });
                }}
              >
                Suspend
              </MenuItem>
            )}
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                navigate(`/tenants/${menuAnchor.tenant.id}?tab=subscription`);
              }}
            >
              Manage Subscription
            </MenuItem>
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                navigate(`/tenants/${menuAnchor.tenant.id}?tab=users`);
              }}
            >
              Manage Users
            </MenuItem>
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                navigate(`/tenants/${menuAnchor.tenant.id}?tab=branches`);
              }}
            >
              Manage Branches
            </MenuItem>
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                navigate(`/tenants/${menuAnchor.tenant.id}?tab=activity`);
              }}
            >
              View Activity / Audit History
            </MenuItem>
            <Divider />
            <MenuItem disabled>Delete Tenant (not available)</MenuItem>
          </>
        ) : null}
      </Menu>
    </>
  );
}
