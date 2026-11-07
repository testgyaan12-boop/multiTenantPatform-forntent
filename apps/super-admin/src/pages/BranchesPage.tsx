import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  Chip,
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
  Building2,
  CheckCircle2,
  Download,
  Filter,
  GitBranch,
  RefreshCw,
  Search,
  Star,
  XCircle,
} from 'lucide-react';
import { ConfirmDialog, EmptyState, ErrorState, LoadingState, PageHeader } from '@resto/ui';
import { platformApi } from '@/api';
import { useToast } from '@/components/toast';

const statusColor: Record<string, 'success' | 'warning' | 'default' | 'error'> = {
  ACTIVE: 'success',
  PAUSED: 'warning',
  INACTIVE: 'default',
  SUSPENDED: 'error',
};

function getInitials(name: string) {
  const parts = (name || '').trim().split(/\s+/);
  const [first = '', second = ''] = parts;
  if (!first) return 'BR';
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  return ((first[0] ?? '') + (second[0] ?? '')).toUpperCase();
}

export function BranchesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(25);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [target, setTarget] = useState<{ id: number; status: string; name: string } | null>(null);

  const branches = useQuery({
    queryKey: ['sa-branches', { page, size, search, status }],
    queryFn: () =>
      platformApi.branches({
        page,
        size,
        search: search || undefined,
        status: status === 'ALL' ? undefined : status,
      }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status: next }: { id: number; status: string }) =>
      platformApi.updateBranchStatus(id, next),
    onSuccess: () => {
      toast('Branch status updated');
      setTarget(null);
      void queryClient.invalidateQueries({ queryKey: ['sa-branches'] });
      void queryClient.invalidateQueries({ queryKey: ['sa-stats'] });
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  const all = branches.data?.content ?? [];
  const stats = useMemo(() => {
    const total = branches.data?.page?.totalElements ?? all.length;
    const active = all.filter((b: any) => b.status === 'ACTIVE').length;
    const inactive = all.filter((b: any) => b.status === 'INACTIVE').length;
    const suspended = all.filter((b: any) => b.status === 'SUSPENDED').length;
    const defaults = all.filter((b: any) => b.isDefault).length;
    const tenants = new Set(all.map((b: any) => b.tenantId).filter(Boolean)).size;
    return { total, active, inactive, suspended, defaults, tenants };
  }, [all, branches.data?.page?.totalElements]);

  const downloadCsv = () => {
    const headers = [
      'Branch',
      'Branch Code',
      'Tenant',
      'Location',
      'Status',
      'Default',
      'Created At',
    ];
    const rows = all.map((b: any) => [
      `"${(b.name || '').replace(/"/g, '""')}"`,
      b.code ?? '',
      `"${(b.tenantName || '').replace(/"/g, '""')}"`,
      `"${[b.city, b.country].filter(Boolean).join(', ').replace(/"/g, '""')}"`,
      b.status ?? '',
      b.isDefault ? 'Yes' : 'No',
      b.createdAt ?? '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `branches-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <PageHeader
        title="Branch Management"
        subtitle="Manage branch locations, operational status, and default locations across all platform tenants."
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Tooltip title="Refresh data">
              <Button
                variant="outlined"
                startIcon={<RefreshCw size={16} />}
                onClick={() => {
                  void queryClient.invalidateQueries({ queryKey: ['sa-branches'] });
                  void queryClient.invalidateQueries({ queryKey: ['sa-stats'] });
                }}
              >
                Refresh
              </Button>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<Download size={16} />}
              onClick={downloadCsv}
              disabled={all.length === 0}
            >
              Export CSV
            </Button>
          </Stack>
        }
      />

      <Stack direction="row" spacing={1.5} sx={{ mb: 2.5, overflowX: 'auto', pb: 0.5 }} useFlexGap>
        {[
          { label: 'Total Branches', value: stats.total, icon: GitBranch, color: '#111C30' },
          { label: 'Active Branches', value: stats.active, icon: CheckCircle2, color: '#22C55E' },
          { label: 'Inactive Branches', value: stats.inactive, icon: XCircle, color: '#94A3B8' },
          { label: 'Suspended Branches', value: stats.suspended, icon: XCircle, color: '#EF4444' },
          {
            label: 'Tenants With Branches',
            value: stats.tenants,
            icon: Building2,
            color: '#2563EB',
          },
          { label: 'Default Branches', value: stats.defaults, icon: Star, color: '#F59E0B' },
        ].map((card) => (
          <Box
            key={card.label}
            sx={{
              minWidth: 210,
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
            placeholder="Search branch, code, tenant or location"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            sx={{ minWidth: { xs: '100%', md: 320 }, flex: { md: 1 } }}
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
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="PAUSED">Paused</MenuItem>
            <MenuItem value="INACTIVE">Inactive</MenuItem>
            <MenuItem value="SUSPENDED">Suspended</MenuItem>
          </TextField>
          {(search || status !== 'ALL') && (
            <Button
              size="small"
              startIcon={<Filter size={14} />}
              onClick={() => {
                setSearch('');
                setStatus('ALL');
                setPage(0);
              }}
            >
              Clear Filters
            </Button>
          )}
        </Box>
        <Divider />

        {branches.isPending ? <LoadingState /> : null}
        {branches.isError ? (
          <ErrorState
            message={(branches.error as Error).message}
            onRetry={() => void branches.refetch()}
          />
        ) : null}
        {branches.data && all.length === 0 ? (
          <EmptyState
            title="No branches found"
            description="Try adjusting your search or filters."
          />
        ) : null}

        {branches.data && all.length > 0 ? (
          <>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell>Branch</TableCell>
                    <TableCell>Tenant / Business</TableCell>
                    <TableCell>Branch Code</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Default</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {all.map((branch: any) => (
                    <TableRow key={branch.id} hover>
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
                            {getInitials(branch.name)}
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {branch.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {branch.id}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{branch.tenantName || '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Tenant ID: {branch.tenantId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {branch.code || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {[branch.city, branch.country].filter(Boolean).join(', ') || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={branch.status}
                          color={statusColor[branch.status] ?? 'default'}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        {branch.isDefault ? (
                          <Chip
                            size="small"
                            label="Default"
                            sx={{ bgcolor: '#FFF7ED', color: '#C2410C' }}
                          />
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          select
                          size="small"
                          value={branch.status}
                          onChange={(event) =>
                            setTarget({
                              id: branch.id,
                              status: event.target.value,
                              name: branch.name,
                            })
                          }
                          disabled={updateStatus.isPending}
                          sx={{ width: 130 }}
                        >
                          <MenuItem value="ACTIVE">Active</MenuItem>
                          <MenuItem value="PAUSED">Paused</MenuItem>
                          <MenuItem value="INACTIVE">Inactive</MenuItem>
                          <MenuItem value="SUSPENDED">Suspended</MenuItem>
                        </TextField>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            <TablePagination
              component="div"
              count={branches.data.page.totalElements}
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

      <ConfirmDialog
        open={target !== null}
        title="Change branch status?"
        description={
          target
            ? `Update "${target.name}" status to ${target.status}? This affects branch operations.`
            : ''
        }
        confirmLabel="Confirm"
        destructive={target?.status === 'SUSPENDED' || target?.status === 'INACTIVE'}
        loading={updateStatus.isPending}
        onCancel={() => setTarget(null)}
        onConfirm={() => {
          if (target) updateStatus.mutate({ id: target.id, status: target.status });
        }}
      />
    </>
  );
}
