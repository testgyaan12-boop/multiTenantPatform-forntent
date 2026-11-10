import { useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  LinearProgress,
  Skeleton,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  CloudUpload,
  Database,
  Edit,
  File,
  FileText,
  Files,
  Film,
  FolderOpen,
  Image as ImageIcon,
  Power,
  Plus,
  RefreshCw,
  Rocket,
  Settings,
  Trash2,
  Upload,
  Wallet,
  Zap,
} from 'lucide-react';
import { ConfirmDialog, ErrorState, LoadingState, PageHeader } from '@resto/ui';
import { platformApi } from '@/api';
import type {
  CloudinaryAccountView,
  StorageFileCategory,
  StorageFileView,
  StorageOverview,
} from '@/api';
import { useToast } from '@/components/toast';
import type { ShellScope } from '@/layout/AppLayout';
import { BLUE, BORDER, GREEN, NAVY, ORANGE, RED } from '@/theme';
import { AccountDialog } from './storage/AccountDialog';
import { FilesDialog } from './storage/FilesDialog';
import { UploadDialog } from './storage/UploadDialog';
import {
  formatBytes,
  formatCount,
  formatDate,
  formatDateTime,
  percentChange,
  progressTone,
} from './storage/storageUtils';

const CATEGORY_META: Record<StorageFileCategory, { label: string; color: string }> = {
  IMAGE: { label: 'Images', color: ORANGE },
  DOCUMENT: { label: 'Documents', color: BLUE },
  VIDEO: { label: 'Videos', color: '#7C3AED' },
  OTHER: { label: 'Other files', color: '#8A93A6' },
};

const RANGES: { value: '30' | '90' | '180'; label: string }[] = [
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: '180', label: '6 months' },
];

function toneColor(tone: 'success' | 'warning' | 'error'): string {
  if (tone === 'error') {
    return RED;
  }
  if (tone === 'warning') {
    return '#D97706';
  }
  return GREEN;
}

function IconTile({ children, color = BLUE }: { children: ReactNode; color?: string }) {
  return (
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: '11px',
        bgcolor: `${color}14`,
        color,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
      }}
    >
      {children}
    </Box>
  );
}

function MetricCard({
  title,
  value,
  sub,
  right,
}: {
  title: string;
  value: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <Card
      sx={{
        p: 2.5,
        height: '100%',
        borderRadius: '14px',
        border: `1px solid ${BORDER}`,
        boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: '#5A6478' }}>{title}</Typography>
          <Typography
            sx={{
              mt: 0.75,
              fontSize: 26,
              fontWeight: 700,
              color: NAVY,
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {value}
          </Typography>
          {sub ? (
            <Typography sx={{ mt: 0.5, fontSize: 11.5, color: '#8A93A6', lineHeight: 1.4 }}>{sub}</Typography>
          ) : null}
        </Box>
        {right}
      </Stack>
    </Card>
  );
}

function UsageRing({ percent, tone }: { percent: number; tone: 'success' | 'warning' | 'error' }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <Box sx={{ position: 'relative', width: 58, height: 58, flexShrink: 0 }}>
      <CircularProgress
        variant="determinate"
        value={clamped}
        size={58}
        thickness={4.5}
        sx={{ color: toneColor(tone), '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }}
      />
      <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: NAVY }}>{Math.round(clamped)}%</Typography>
      </Box>
    </Box>
  );
}

function healthInfo(overview: StorageOverview) {
  if (overview.exhaustedAccounts > 0 || overview.usedPercent >= overview.criticalThresholdPercent) {
    return { tone: 'error' as const, label: 'Critical usage', icon: <AlertTriangle size={14} /> };
  }
  if (overview.usedPercent >= overview.warningThresholdPercent) {
    return { tone: 'warning' as const, label: 'High usage', icon: <AlertTriangle size={14} /> };
  }
  return { tone: 'success' as const, label: 'Storage healthy', icon: <CheckCircle2 size={14} /> };
}

function FileThumb({ file }: { file: StorageFileView }) {
  if (file.category === 'IMAGE' && file.publicUrl) {
    return (
      <Avatar variant="rounded" src={file.publicUrl ?? undefined} sx={{ width: 42, height: 42, bgcolor: '#F1F4FA' }} />
    );
  }
  const meta = CATEGORY_META[file.category];
  const icon =
    file.category === 'IMAGE' ? <ImageIcon size={18} /> : file.category === 'VIDEO' ? <Film size={18} /> : file.category === 'DOCUMENT' ? <FileText size={18} /> : <File size={18} />;
  return (
    <Avatar variant="rounded" sx={{ width: 42, height: 42, bgcolor: `${meta.color}18`, color: meta.color }}>
      {icon}
    </Avatar>
  );
}

export function StoragePage() {
  const navigate = useNavigate();
  const { scope } = useOutletContext<ShellScope>();
  const tenantId = scope?.id ?? null;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const chartRef = useRef<HTMLDivElement>(null);

  const [range, setRange] = useState<'30' | '90' | '180' | 'custom'>('30');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [accountDialog, setAccountDialog] = useState<{ open: boolean; account: CloudinaryAccountView | null }>({
    open: false,
    account: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<CloudinaryAccountView | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [filesDialog, setFilesDialog] = useState<{ open: boolean; type: StorageFileCategory | 'ALL' }>({
    open: false,
    type: 'ALL',
  });
  const [uploadOpen, setUploadOpen] = useState(false);

  const growthParams = useMemo(() => {
    if (range === 'custom' && from && to) {
      return { tenantId, from, to };
    }
    return { tenantId, days: range === 'custom' ? 30 : Number(range) };
  }, [range, from, to, tenantId]);

  const overview = useQuery({
    queryKey: ['storage-overview', tenantId],
    queryFn: () => platformApi.storageOverview(tenantId),
  });
  const growth = useQuery({
    queryKey: ['storage-growth', growthParams],
    queryFn: () => platformApi.storageGrowth(growthParams),
  });
  const fileTypes = useQuery({
    queryKey: ['storage-file-types', tenantId],
    queryFn: () => platformApi.storageFileTypes(tenantId),
  });
  const recent = useQuery({
    queryKey: ['storage-recent', tenantId],
    queryFn: () => platformApi.storageRecent(tenantId, 6),
  });
  const accounts = useQuery({
    queryKey: ['sa-cloudinary-accounts'],
    queryFn: () => platformApi.cloudinaryAccounts(),
  });
  const summary = useQuery({
    queryKey: ['sa-cloudinary-summary'],
    queryFn: () => platformApi.cloudinarySummary(),
  });

  const refreshAll = () => {
    void queryClient.invalidateQueries({ queryKey: ['storage-overview'] });
    void queryClient.invalidateQueries({ queryKey: ['storage-growth'] });
    void queryClient.invalidateQueries({ queryKey: ['storage-recent'] });
    void queryClient.invalidateQueries({ queryKey: ['storage-file-types'] });
    void queryClient.invalidateQueries({ queryKey: ['sa-cloudinary-accounts'] });
    void queryClient.invalidateQueries({ queryKey: ['sa-cloudinary-summary'] });
  };

  const toggleActive = useMutation({
    mutationFn: (vars: { id: number; active: boolean }) =>
      platformApi.setCloudinaryAccountActive(vars.id, vars.active),
    onSuccess: (_view, vars) => {
      toast(vars.active ? 'Account enabled' : 'Account disabled');
      refreshAll();
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  const testAccount = useMutation({
    mutationFn: (id: number) => platformApi.testCloudinaryAccount(id),
    onSuccess: () => {
      toast('Credentials verified');
      refreshAll();
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  const refreshUsage = useMutation({
    mutationFn: (id: number) => platformApi.refreshCloudinaryUsage(id),
    onSuccess: () => {
      toast('Usage refreshed');
      refreshAll();
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  const removeAccount = useMutation({
    mutationFn: (id: number) => platformApi.deleteCloudinaryAccount(id),
    onSuccess: () => {
      toast('Cloudinary account removed');
      setDeleteTarget(null);
      setDeleteLoading(false);
      refreshAll();
    },
    onError: (error: Error) => {
      setDeleteLoading(false);
      toast(error.message, 'error');
    },
  });

  const data = overview.data;

  const chartData = useMemo(
    () =>
      (growth.data ?? []).map((point) => ({
        date: point.date,
        label: new Date(`${point.date}T00:00:00`).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        totalMb: point.bytesTotal / (1024 * 1024),
        addedMb: point.bytesAdded / (1024 * 1024),
        files: point.files,
      })),
    [growth.data],
  );

  const typeData = useMemo(
    () =>
      (fileTypes.data ?? []).map((stat) => ({
        ...stat,
        label: CATEGORY_META[stat.type].label,
        color: CATEGORY_META[stat.type].color,
      })),
    [fileTypes.data],
  );

  const typeTotal = typeData.reduce((sum, item) => sum + item.count, 0);

  const exportCsv = () => {
    const rows = growth.data ?? [];
    const header = 'Date,Bytes Added,Total Bytes,Files';
    const body = rows.map((r) => `${r.date},${r.bytesAdded},${r.bytesTotal},${r.files}`).join('\n');
    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'storage-usage.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast('Storage report exported');
  };

  const openFiles = (type: StorageFileCategory | 'ALL') => setFilesDialog({ open: true, type });

  const health = data ? healthInfo(data) : null;
  const usageTone = data ? progressTone(data.usedPercent, data.warningThresholdPercent, data.criticalThresholdPercent) : 'success';
  const filesDelta = data ? percentChange(data.monthlyFiles, data.previousMonthFiles) : null;
  const bytesDelta = data ? percentChange(data.monthlyBytes, data.previousMonthBytes) : null;

  return (
    <>
      <PageHeader
        icon={<CloudUpload size={22} />}
        title="Storage / Cloudinary"
        subtitle="Manage your media storage, monitor usage and optimize your storage costs."
        actions={
          <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" useFlexGap>
            {scope ? (
              <Chip
                label={`Scoped: ${scope.name}`}
                color="primary"
                variant="outlined"
                onDelete={() => navigate('/')}
              />
            ) : null}
            {health && data ? (
              <Chip
                icon={health.icon}
                label={`${health.label} · ${Math.round(data.usedPercent)}%`}
                color={health.tone}
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            ) : null}
            <Button variant="contained" startIcon={<Rocket size={16} />} onClick={() => navigate('/plans')}>
              Upgrade Plan
            </Button>
          </Stack>
        }
      />

      {overview.isPending ? <LoadingState /> : null}
      {overview.isError ? (
        <ErrorState message={overview.error.message} onRetry={() => void overview.refetch()} />
      ) : null}

      {data ? (
        <Stack spacing={2.5}>
          {health && health.tone !== 'success' ? (
            <Alert severity={health.tone === 'error' ? 'error' : 'warning'} icon={false}>
              <Stack direction="row" spacing={1} alignItems="center">
                <AlertTriangle size={16} />
                <Typography variant="body2" fontWeight={600}>
                  {health.tone === 'error'
                    ? 'Storage is critically full — uploads may fail. Add a Cloudinary account or upgrade your plan.'
                    : 'Storage usage is getting high. Consider adding an account or upgrading soon.'}
                </Typography>
              </Stack>
            </Alert>
          ) : null}

          {/* ROW 2 — KPI cards */}
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            }}
          >
            <MetricCard
              title="Total storage used"
              value={formatBytes(data.totalBytes)}
              sub={`of ${formatBytes(data.allocatedBytes)} allocated`}
              right={<UsageRing percent={data.usedPercent} tone={usageTone} />}
            />
            <MetricCard
              title="Total files"
              value={formatCount(data.totalFiles)}
              sub={`${formatCount(data.monthlyFiles)} uploaded this month`}
              right={<IconTile color={ORANGE}><Files size={18} /></IconTile>}
            />
            <MetricCard
              title="Monthly uploads"
              value={formatCount(data.monthlyFiles)}
              sub={
                filesDelta === null
                  ? `${formatBytes(data.monthlyBytes)} this month`
                  : `${filesDelta >= 0 ? '+' : ''}${filesDelta}% vs last month · ${formatBytes(data.monthlyBytes)}`
              }
              right={<IconTile color={GREEN}><Upload size={18} /></IconTile>}
            />
            <MetricCard
              title="Storage cost"
              value={data.freeTier ? '$0' : '—'}
              sub={`${data.planLabel} · ${formatCount(data.creditsUsed)}/${formatCount(data.creditsLimit)} credits`}
              right={<IconTile color={BLUE}><Wallet size={18} /></IconTile>}
            />
          </Box>

          {/* ROW 3 — chart + file types */}
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1.7fr 1fr' } }}>
            <Card ref={chartRef} sx={{ p: 2.5, borderRadius: '14px' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5} sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h4">Storage usage overview</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Cumulative storage growth{bytesDelta === null ? '' : ` · ${bytesDelta >= 0 ? '+' : ''}${bytesDelta}% in uploads vs last month`}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={range}
                    onChange={(_event, value: '30' | '90' | '180' | 'custom' | null) => {
                      if (value) {
                        setRange(value);
                      }
                    }}
                    sx={{ '& .MuiToggleButton-root': { px: 1.25, py: 0.4, fontSize: 11.5, textTransform: 'none' } }}
                  >
                    {RANGES.map((option) => (
                      <ToggleButton key={option.value} value={option.value}>
                        {option.label}
                      </ToggleButton>
                    ))}
                    <ToggleButton value="custom">Custom</ToggleButton>
                  </ToggleButtonGroup>
                  <Tooltip title="Export CSV">
                    <IconButton size="small" onClick={exportCsv} disabled={(growth.data ?? []).length === 0}>
                      <ArrowUpRight size={16} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>

              {range === 'custom' ? (
                <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">From</Typography>
                    <input
                      type="date"
                      value={from}
                      onChange={(event) => setFrom(event.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: `1px solid ${BORDER}` }}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">To</Typography>
                    <input
                      type="date"
                      value={to}
                      onChange={(event) => setTo(event.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: `1px solid ${BORDER}` }}
                    />
                  </Box>
                </Stack>
              ) : null}

              <Box sx={{ height: 280 }}>
                {growth.isPending ? (
                  <Skeleton variant="rounded" height={280} />
                ) : growth.isError ? (
                  <ErrorState message={growth.error.message} onRetry={() => void growth.refetch()} />
                ) : chartData.length === 0 ? (
                  <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
                    <Typography variant="body2">No uploads recorded in this period.</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}>
                      <defs>
                        <linearGradient id="storageFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={ORANGE} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={ORANGE} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDF0F6" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: '#5A6478' }}
                        interval="preserveStartEnd"
                        minTickGap={28}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#5A6478' }}
                        width={54}
                        tickFormatter={(value: number) => formatBytes(value * 1024 * 1024)}
                      />
                      <ChartTooltip
                        contentStyle={{ borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: 12 }}
                        formatter={(value) => [formatBytes(Number(value) * 1024 * 1024), 'Total']}
                      />
                      <Area
                        type="monotone"
                        dataKey="totalMb"
                        stroke={ORANGE}
                        strokeWidth={2.4}
                        fill="url(#storageFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Card>

            <Card sx={{ p: 2.5, borderRadius: '14px' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Box>
                  <Typography variant="h4">File type breakdown</Typography>
                  <Typography variant="caption" color="text.secondary">Distribution of uploaded files</Typography>
                </Box>
                <Button size="small" startIcon={<FolderOpen size={15} />} onClick={() => openFiles('ALL')}>
                  Manage
                </Button>
              </Stack>
              {fileTypes.isPending ? (
                <Skeleton variant="rounded" height={260} />
              ) : (fileTypes.data ?? []).length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                  <Typography variant="body2">No files uploaded yet.</Typography>
                </Box>
              ) : (
                <>
                  <Box sx={{ position: 'relative', height: 190 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={typeData}
                          dataKey="count"
                          nameKey="label"
                          innerRadius={58}
                          outerRadius={82}
                          paddingAngle={2}
                          stroke="none"
                        >
                          {typeData.map((entry) => (
                            <Cell key={entry.type} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip
                          contentStyle={{ borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: 12 }}
                          formatter={(value, name) => [`${formatCount(Number(value))} files`, String(name)]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'grid',
                        placeItems: 'center',
                        pointerEvents: 'none',
                      }}
                    >
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ fontSize: 22, fontWeight: 700, color: NAVY }}>
                          {formatCount(typeTotal)}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: '#8A93A6' }}>total files</Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Stack spacing={0.5} sx={{ mt: 1 }}>
                    {typeData.map((entry) => (
                      <Stack
                        key={entry.type}
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        onClick={() => openFiles(entry.type)}
                        sx={{
                          px: 1,
                          py: 0.6,
                          borderRadius: 1.5,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: '#F6F8FC' },
                        }}
                      >
                        <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: entry.color, flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
                          {entry.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatCount(entry.count)} · {entry.percent}%
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </>
              )}
            </Card>
          </Box>

          {/* ROW 4 — recent + plan + quick actions */}
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', lg: '1.5fr 1fr 1fr' },
              alignItems: 'stretch',
            }}
          >
            <Card sx={{ borderRadius: '14px', display: 'flex', flexDirection: 'column' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, py: 2 }}>
                <Box>
                  <Typography variant="h4">Recent activity</Typography>
                  <Typography variant="caption" color="text.secondary">Latest uploaded files</Typography>
                </Box>
                <Button size="small" onClick={() => openFiles('ALL')}>
                  View all
                </Button>
              </Stack>
              <Divider />
              <Stack sx={{ flex: 1, px: 2.5, py: 1 }} divider={<Divider />}>
                {recent.isPending ? (
                  [0, 1, 2, 3].map((key) => <Skeleton key={key} variant="rounded" height={52} sx={{ my: 0.75 }} />)
                ) : (recent.data ?? []).length === 0 ? (
                  <Box sx={{ py: 5, textAlign: 'center', color: 'text.secondary' }}>
                    <Upload size={22} style={{ opacity: 0.5 }} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      No uploads yet.
                    </Typography>
                  </Box>
                ) : (
                  (recent.data ?? []).map((file) => (
                    <Stack key={file.id || file.name} direction="row" spacing={1.5} alignItems="center" sx={{ py: 1.1 }}>
                      <FileThumb file={file} />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {file.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatBytes(file.sizeBytes)} · {formatDate(file.createdAt)}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={file.status === 'READY' ? 'Ready' : 'Pending'}
                        color={file.status === 'READY' ? 'success' : 'warning'}
                        variant="outlined"
                        sx={{ height: 22, fontSize: 10.5 }}
                      />
                    </Stack>
                  ))
                )}
              </Stack>
            </Card>

            <Card sx={{ p: 2.5, borderRadius: '14px', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h4">Storage plan details</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
                Current allocation and usage
              </Typography>
              <Stack spacing={1.5} sx={{ flex: 1 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Allocated</Typography>
                  <Typography variant="body2" fontWeight={600}>{formatBytes(data.allocatedBytes)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Used</Typography>
                  <Typography variant="body2" fontWeight={600}>{formatBytes(data.totalBytes)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Available</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatBytes(Math.max(0, data.allocatedBytes - data.totalBytes))}
                  </Typography>
                </Stack>
                <Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, data.usedPercent)}
                    color={usageTone}
                    sx={{ height: 9, borderRadius: 5, '& .MuiLinearProgress-bar': { borderRadius: 5 } }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
                    {data.usedPercent}% used · {data.planLabel}
                  </Typography>
                </Box>
                <Divider />
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary">Credits remaining</Typography>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {formatCount(data.creditsRemaining)} / {formatCount(data.creditsLimit)}
                    </Typography>
                  </Box>
                  <Button size="small" variant="outlined" startIcon={<Zap size={15} />} onClick={() => navigate('/plans')}>
                    Upgrade
                  </Button>
                </Stack>
              </Stack>
            </Card>

            <Card sx={{ p: 2.5, borderRadius: '14px' }}>
              <Typography variant="h4">Quick actions</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                Jump straight to a task
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                {[
                  { label: 'Upload files', icon: <Upload size={18} />, color: ORANGE, onClick: () => setUploadOpen(true) },
                  { label: 'Manage files', icon: <Files size={18} />, color: BLUE, onClick: () => openFiles('ALL') },
                  {
                    label: 'View analytics',
                    icon: <BarChart3 size={18} />,
                    color: '#7C3AED',
                    onClick: () => chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
                  },
                  { label: 'Storage settings', icon: <Settings size={18} />, color: GREEN, onClick: () => navigate('/settings') },
                ].map((action) => (
                  <Box
                    key={action.label}
                    onClick={action.onClick}
                    sx={{
                      p: 1.75,
                      borderRadius: 2,
                      border: `1px solid ${BORDER}`,
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease',
                      '&:hover': {
                        borderColor: action.color,
                        boxShadow: `0 6px 16px ${action.color}1f`,
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: '10px',
                        bgcolor: `${action.color}14`,
                        color: action.color,
                        display: 'grid',
                        placeItems: 'center',
                        mb: 1,
                      }}
                    >
                      {action.icon}
                    </Box>
                    <Typography variant="body2" fontWeight={600}>
                      {action.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Card>
          </Box>

          {/* ROW 5 — Cloudinary accounts */}
          <Card sx={{ p: 2.5, borderRadius: '14px' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5} sx={{ mb: 2 }}>
              <Box>
                <Typography variant="h4">Cloudinary account management</Typography>
                <Typography variant="caption" color="text.secondary">
                  Multiple accounts form a pool. The least-used active account serves each upload.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip size="small" label={`${summary.data?.activeAccounts ?? 0} active`} color="success" variant="outlined" />
                <Chip
                  size="small"
                  label={`${summary.data?.exhaustedAccounts ?? 0} exhausted`}
                  color={summary.data && summary.data.exhaustedAccounts > 0 ? 'error' : 'default'}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={`${formatCount(summary.data?.totalRemainingCredits ?? 0)} credits left`}
                  variant="outlined"
                />
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Plus size={16} />}
                  onClick={() => setAccountDialog({ open: true, account: null })}
                >
                  Add account
                </Button>
              </Stack>
            </Stack>

            {accounts.isPending ? (
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' } }}>
                {[0, 1, 2].map((key) => <Skeleton key={key} variant="rounded" height={190} />)}
              </Box>
            ) : accounts.isError ? (
              <ErrorState message={accounts.error.message} onRetry={() => void accounts.refetch()} />
            ) : (accounts.data ?? []).length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Database size={26} style={{ opacity: 0.45 }} />
                <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 1 }}>
                  No Cloudinary accounts connected
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Add at least one account to enable image uploads.
                </Typography>
                <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setAccountDialog({ open: true, account: null })}>
                  Add account
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' } }}>
                {(accounts.data ?? []).map((account) => {
                  const percent = Math.min(100, account.usedPercent ?? 0);
                  const tone = progressTone(percent, 60, 90);
                  const exhausted = percent >= 90;
                  const status = exhausted
                    ? { label: 'Exhausted', color: 'error' as const }
                    : !account.isActive
                      ? { label: 'Disabled', color: 'default' as const }
                      : { label: 'Active', color: 'success' as const };
                  const remaining = (account.monthlyCreditLimit ?? 25) - (account.creditsUsed ?? 0);
                  return (
                    <Card
                      key={account.id}
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        border: `1px solid ${BORDER}`,
                        boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
                        opacity: account.isActive ? 1 : 0.75,
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                          <Box
                            sx={{
                              width: 38,
                              height: 38,
                              borderRadius: '10px',
                              bgcolor: 'rgba(255,87,34,0.10)',
                              color: ORANGE,
                              display: 'grid',
                              placeItems: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <CloudUpload size={18} />
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={700} noWrap>
                              {account.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {account.cloudName}
                            </Typography>
                          </Box>
                        </Stack>
                        <Chip size="small" label={status.label} color={status.color} variant="outlined" sx={{ height: 22, fontSize: 10.5 }} />
                      </Stack>

                      <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">API key</Typography>
                        <Typography sx={{ fontFamily: 'monospace', fontSize: 12 }}>{account.apiKeyMasked || '—'}</Typography>
                      </Stack>

                      <Box sx={{ mt: 1.25 }}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">Credits</Typography>
                          <Typography variant="caption" fontWeight={600}>
                            {formatCount(account.creditsUsed)} / {formatCount(account.monthlyCreditLimit)}
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={percent}
                          color={tone}
                          sx={{ height: 7, borderRadius: 4, '& .MuiLinearProgress-bar': { borderRadius: 4 } }}
                        />
                        <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">{percent}% used</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatCount(Math.max(0, remaining))} remaining
                          </Typography>
                        </Stack>
                      </Box>

                      {account.lastError ? (
                        <Alert severity="error" sx={{ mt: 1, fontSize: 11.5, py: 0.25 }}>
                          {account.lastError}
                        </Alert>
                      ) : null}

                      <Divider sx={{ my: 1.25 }} />
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Switch
                            size="small"
                            checked={account.isActive}
                            onChange={(event) =>
                              toggleActive.mutate({ id: account.id, active: event.target.checked })
                            }
                            disabled={toggleActive.isPending}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {account.isActive ? 'Enabled' : 'Disabled'}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.25}>
                          <Tooltip title="Test connection">
                            <span>
                              <IconButton size="small" onClick={() => testAccount.mutate(account.id)} disabled={testAccount.isPending}>
                                <Power size={15} />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Refresh usage">
                            <span>
                              <IconButton size="small" onClick={() => refreshUsage.mutate(account.id)} disabled={refreshUsage.isPending}>
                                <RefreshCw size={15} />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => setAccountDialog({ open: true, account })}>
                              <Edit size={15} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => setDeleteTarget(account)}>
                              <Trash2 size={15} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>
                      {account.usageCheckedAt ? (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          Usage checked {formatDateTime(account.usageCheckedAt)}
                        </Typography>
                      ) : null}
                    </Card>
                  );
                })}
              </Box>
            )}
          </Card>
        </Stack>
      ) : null}

      <AccountDialog
        open={accountDialog.open}
        account={accountDialog.account}
        onClose={() => setAccountDialog({ open: false, account: null })}
      />
      <FilesDialog
        open={filesDialog.open}
        tenantId={tenantId}
        initialType={filesDialog.type}
        onClose={() => setFilesDialog((current) => ({ ...current, open: false }))}
      />
      <UploadDialog open={uploadOpen} tenantId={tenantId} onClose={() => setUploadOpen(false)} />
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Cloudinary account?"
        description="Uploads will fail if no active account remains. Add a replacement first."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        loading={deleteLoading}
        onConfirm={() => {
          if (deleteTarget) {
            setDeleteLoading(true);
            removeAccount.mutate(deleteTarget.id);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
