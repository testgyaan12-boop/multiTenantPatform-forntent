import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Drawer,
  IconButton,
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
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Filter,
  Mail,
  Phone,
  RefreshCw,
  Search,
  X,
  XCircle,
} from 'lucide-react';
import { ConfirmDialog, EmptyState, ErrorState, LoadingState, PageHeader } from '@resto/ui';
import type { TenantSummary } from '@resto/types';
import { tenantApi } from '@/api';
import { StatusBadge } from '@/components/StatusBadge';
import { useToast } from '@/components/toast';

function getInitials(name: string) {
  const parts = (name || '').trim().split(/\s+/);
  const [first = '', second = ''] = parts;
  if (!first) return 'RS';
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  return ((first[0] ?? '') + (second[0] ?? '')).toUpperCase();
}

const statusColor: Record<string, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
  PENDING_VERIFICATION: 'warning',
  ACTIVE: 'success',
  TRIAL: 'info',
  SUSPENDED: 'error',
  CANCELLED: 'default',
};

export function OnboardingPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [target, setTarget] = useState<{
    tenant: TenantSummary;
    action: 'verify' | 'reject';
  } | null>(null);
  const [detail, setDetail] = useState<TenantSummary | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'PENDING_VERIFICATION' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED'
  >('ALL');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(25);

  const tenants = useQuery({
    queryKey: ['tenants', 'onboarding-all'],
    queryFn: () => tenantApi.list({ page: 0, size: 500, sort: 'createdAt', direction: 'desc' }),
  });

  useMemo(() => {
    let t: any;
    t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => {
      if (t) clearTimeout(t);
    };
  }, [search]);

  const all = useMemo(() => tenants.data?.content ?? [], [tenants.data]);

  const filtered = useMemo(() => {
    let list = all;
    if (statusFilter === 'PENDING_VERIFICATION')
      list = list.filter((t) => t.status === 'PENDING_VERIFICATION');
    else if (statusFilter === 'ACTIVE')
      list = list.filter((t) => t.status === 'ACTIVE' || t.status === 'TRIAL');
    else if (statusFilter === 'SUSPENDED') list = list.filter((t) => t.status === 'SUSPENDED');
    else if (statusFilter === 'REJECTED') list = list.filter((t) => t.status === 'CANCELLED');
    const q = debouncedSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.slug?.toLowerCase().includes(q) ||
          t.contactEmail?.toLowerCase().includes(q) ||
          t.contactPhone?.toLowerCase().includes(q) ||
          String(t.id).includes(q),
      );
    }
    return list;
  }, [all, statusFilter, debouncedSearch]);

  const paged = useMemo(() => {
    const start = page * size;
    return filtered.slice(start, start + size);
  }, [filtered, page, size]);

  const stats = useMemo(() => {
    const total = all.length;
    const pending = all.filter((t) => t.status === 'PENDING_VERIFICATION').length;
    const verified = all.filter((t) => t.status === 'ACTIVE' || t.status === 'TRIAL').length;
    const rejected = all.filter((t) => t.status === 'CANCELLED' || t.status === 'SUSPENDED').length;
    return { total, pending, verified, rejected };
  }, [all]);

  const act = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: 'verify' | 'reject' }) => {
      if (action === 'verify') await tenantApi.verify(id);
      else await tenantApi.reject(id);
    },
    onSuccess: (_data, variables) => {
      toast(
        variables.action === 'verify'
          ? 'Restaurant verified · owner account activated'
          : 'Restaurant rejected · tenant suspended',
      );
      setTarget(null);
      void queryClient.invalidateQueries({ queryKey: ['tenants'] });
      void queryClient.invalidateQueries({ queryKey: ['tenants', 'onboarding-all'] });
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  const downloadCsv = () => {
    const headers = ['Restaurant', 'Email', 'Phone', 'Slug', 'Status', 'Submitted'];
    const rows = filtered.map((t) => [
      `"${(t.name || '').replace(/"/g, '""')}"`,
      t.contactEmail ?? '',
      t.contactPhone ?? '',
      t.slug ?? '',
      t.status,
      t.createdAt ?? '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `onboarding-requests-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <PageHeader
        title="Restaurant Onboarding"
        subtitle="Review applications, verify restaurant information, and manage tenant onboarding."
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Tooltip title="Refresh data">
              <Button
                variant="outlined"
                startIcon={<RefreshCw size={16} />}
                onClick={() => {
                  void queryClient.invalidateQueries({ queryKey: ['tenants'] });
                  void queryClient.invalidateQueries({ queryKey: ['tenants', 'onboarding-all'] });
                }}
              >
                Refresh
              </Button>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<Download size={16} />}
              onClick={downloadCsv}
              disabled={filtered.length === 0}
            >
              Export CSV
            </Button>
          </Stack>
        }
      />

      <Stack direction="row" spacing={1.5} sx={{ mb: 2.5, overflowX: 'auto', pb: 0.5 }} useFlexGap>
        {[
          { label: 'Total Applications', value: stats.total, icon: Building2, color: '#111C30' },
          { label: 'Pending Verification', value: stats.pending, icon: Clock, color: '#F59E0B' },
          {
            label: 'Verified Restaurants',
            value: stats.verified,
            icon: CheckCircle2,
            color: '#22C55E',
          },
          {
            label: 'Rejected Applications',
            value: stats.rejected,
            icon: XCircle,
            color: '#EF4444',
          },
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

      <Card
        sx={{
          border: '1px solid #E4E9F2',
          borderRadius: 2,
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.01)',
        }}
      >
        <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search restaurant, owner, email, slug or phone"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            sx={{ minWidth: { xs: '100%', md: 340 }, flex: { md: 1 } }}
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
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as any);
              setPage(0);
            }}
            sx={{ minWidth: 190 }}
          >
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="PENDING_VERIFICATION">Pending Verification</MenuItem>
            <MenuItem value="ACTIVE">Verified</MenuItem>
            <MenuItem value="REJECTED">Rejected</MenuItem>
            <MenuItem value="SUSPENDED">Suspended</MenuItem>
          </TextField>
          {(search || statusFilter !== 'ALL') && (
            <Button
              size="small"
              startIcon={<Filter size={14} />}
              onClick={() => {
                setSearch('');
                setDebouncedSearch('');
                setStatusFilter('ALL');
                setPage(0);
              }}
            >
              Clear Filters
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Showing {paged.length} of {filtered.length} results
          </Typography>
        </Box>
        <Divider />

        {tenants.isPending ? <LoadingState /> : null}
        {tenants.isError ? (
          <ErrorState message={tenants.error.message} onRetry={() => void tenants.refetch()} />
        ) : null}
        {tenants.data && filtered.length === 0 ? (
          <EmptyState
            title="No applications found"
            description="Try adjusting your search or filters."
          />
        ) : null}

        {filtered.length > 0 ? (
          <>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell>Restaurant</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paged.map((tenant) => (
                    <TableRow key={tenant.id} hover>
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
                              fontWeight: 700,
                              fontSize: 12,
                              color: '#475569',
                              flexShrink: 0,
                            }}
                          >
                            {getInitials(tenant.name)}
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {tenant.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontFamily: 'monospace' }}
                            >
                              /{tenant.slug}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">·</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {tenant.contactEmail || '·'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.25}>
                          <Stack direction="row" spacing={0.75} alignItems="center">
                            <Mail size={14} color="#94A3B8" />
                            <Typography variant="body2">{tenant.contactEmail || '·'}</Typography>
                          </Stack>
                          <Stack direction="row" spacing={0.75} alignItems="center">
                            <Phone size={14} color="#94A3B8" />
                            <Typography variant="body2">{tenant.contactPhone || '·'}</Typography>
                          </Stack>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : '·'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {tenant.createdAt ? new Date(tenant.createdAt).toLocaleTimeString() : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={
                            tenant.status === 'PENDING_VERIFICATION'
                              ? 'Pending Verification'
                              : tenant.status === 'ACTIVE'
                                ? 'Verified'
                                : tenant.status === 'CANCELLED'
                                  ? 'Rejected'
                                  : tenant.status === 'TRIAL'
                                    ? 'Trial'
                                    : tenant.status.replace(/_/g, ' ').toLowerCase()
                          }
                          color={statusColor[tenant.status] ?? 'default'}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.75} justifyContent="flex-end">
                          <Tooltip title="View details">
                            <IconButton size="small" onClick={() => setDetail(tenant)}>
                              <Eye size={16} />
                            </IconButton>
                          </Tooltip>
                          {tenant.status === 'PENDING_VERIFICATION' && (
                            <>
                              <Tooltip title="Reject">
                                <IconButton
                                  size="small"
                                  onClick={() => setTarget({ tenant, action: 'reject' })}
                                >
                                  <X size={16} color="#EF4444" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Verify">
                                <IconButton
                                  size="small"
                                  onClick={() => setTarget({ tenant, action: 'verify' })}
                                >
                                  <Check size={16} color="#22C55E" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          {(tenant.status === 'SUSPENDED' || tenant.status === 'CANCELLED') && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => setTarget({ tenant, action: 'verify' })}
                            >
                              Reactivate
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            <TablePagination
              component="div"
              count={filtered.length}
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

      <Drawer
        anchor="right"
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 420 } } }}
      >
        {detail && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2.5 }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Restaurant Details
                </Typography>
                <IconButton onClick={() => setDetail(null)}>
                  <X size={18} />
                </IconButton>
              </Stack>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: '#F8FAFC',
                    border: '1px solid #E4E9F2',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 700,
                  }}
                >
                  {getInitials(detail.name)}
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {detail.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontFamily: 'monospace' }}
                  >
                    /{detail.slug}
                  </Typography>
                </Box>
              </Stack>
            </Box>
            <Divider />
            <Box sx={{ p: 2.5, flex: 1, overflowY: 'auto' }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Restaurant Information
                  </Typography>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Business Name</Typography>
                      <Typography>{detail.name}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Tenant Slug</Typography>
                      <Typography sx={{ fontFamily: 'monospace' }}>{detail.slug}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Status</Typography>
                      <StatusBadge status={detail.status} />
                    </Stack>
                  </Stack>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Owner Information
                  </Typography>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Owner Name</Typography>
                      <Typography>·</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Email</Typography>
                      <Typography>{detail.contactEmail || '·'}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Phone</Typography>
                      <Typography>{detail.contactPhone || '·'}</Typography>
                    </Stack>
                  </Stack>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Application Information
                  </Typography>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Tenant ID</Typography>
                      <Typography>{detail.id}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Submitted</Typography>
                      <Typography>
                        {detail.createdAt ? new Date(detail.createdAt).toLocaleString() : '·'}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Updated</Typography>
                    </Stack>
                  </Stack>
                </Box>
              </Stack>
            </Box>
            <Divider />
            <Box sx={{ p: 2 }}>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button onClick={() => setDetail(null)}>Close</Button>
                {detail.status === 'PENDING_VERIFICATION' && (
                  <>
                    <Button
                      color="error"
                      variant="outlined"
                      startIcon={<X size={16} />}
                      onClick={() => {
                        setDetail(null);
                        setTarget({ tenant: detail, action: 'reject' });
                      }}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Check size={16} />}
                      sx={{ bgcolor: '#FF5722', '&:hover': { bgcolor: '#F4511E' } }}
                      onClick={() => {
                        setDetail(null);
                        setTarget({ tenant: detail, action: 'verify' });
                      }}
                    >
                      Verify
                    </Button>
                  </>
                )}
              </Stack>
            </Box>
          </Box>
        )}
      </Drawer>

      <ConfirmDialog
        open={target !== null}
        title={target?.action === 'verify' ? 'Verify restaurant?' : 'Reject restaurant?'}
        description={
          target?.action === 'verify'
            ? `Verify "${target?.tenant.name}"? This activates the owner account and lets the restaurant sign in.`
            : `Reject "${target?.tenant.name}"? The tenant will be suspended and the owner cannot sign in.`
        }
        confirmLabel={target?.action === 'verify' ? 'Verify' : 'Reject'}
        destructive={target?.action === 'reject'}
        loading={act.isPending}
        onCancel={() => setTarget(null)}
        onConfirm={() => {
          if (target) act.mutate({ id: target.tenant.id, action: target.action });
        }}
      />
    </>
  );
}
