import { useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Popover,
  Skeleton,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  Filter,
  KeyRound,
  Lock,
  LockOpen,
  MoreVertical,
  Pencil,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  Users,
  X,
} from 'lucide-react';
import { ConfirmDialog, EmptyState, ErrorState, PageHeader } from '@resto/ui';
import type { TenantSummary } from '@resto/types';
import { platformApi, tenantApi, type RoleView, type UserView } from '@/api';
import { useToast } from '@/components/toast';
import { KpiCard } from '@/components/KpiCard';

const NAVY = '#111D32';
const BORDER = '#E4E9F2';

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  RESTAURANT: 'Restaurant / Hotel',
  ELECTRONICS: 'Electronics Store',
  VEHICLE: 'Vehicle Dealership',
  REAL_ESTATE: 'Builder / Broker',
};

const ROLE_OPTIONS = [
  'PLATFORM_SUPER_ADMIN',
  'PLATFORM_ADMIN',
  'TENANT_OWNER',
  'TENANT_MANAGER',
  'BRANCH_MANAGER',
  'CHEF',
  'KITCHEN_HELPER',
  'ORDER_CONFIRMATION',
  'CASHIER',
  'STAFF',
];

type StatusKey = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'LOCKED' | 'SUSPENDED';

const STATUS_STYLE: Record<StatusKey, { label: string; fg: string; bg: string; dot: string }> = {
  ACTIVE: { label: 'Active', fg: '#15803D', bg: '#DCFCE7', dot: '#22C55E' },
  INACTIVE: { label: 'Inactive', fg: '#475569', bg: '#F1F5F9', dot: '#94A3B8' },
  PENDING: { label: 'Pending', fg: '#C2410C', bg: '#FFEDD5', dot: '#F97316' },
  LOCKED: { label: 'Locked', fg: '#B91C1C', bg: '#FEE2E2', dot: '#EF4444' },
  SUSPENDED: { label: 'Suspended', fg: '#7F1D1D', bg: '#FECACA', dot: '#991B1B' },
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'PENDING', label: 'Pending invitation' },
  { value: 'LOCKED', label: 'Locked' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function getInitials(firstName: string, lastName: string, email: string) {
  const first = (firstName || '').trim();
  const last = (lastName || '').trim();
  if (first && last) return (first.charAt(0) + last.charAt(0)).toUpperCase();
  const source = first || last || email || 'U';
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) return ((parts[0]?.charAt(0) ?? '') + (parts[1]?.charAt(0) ?? '')).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function fullName(user: UserView) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || user.email;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function relativeTime(value: string | null | undefined) {
  if (!value) return null;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return null;
  const diff = Date.now() - time;
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 2_592_000_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return formatDate(value);
}

function isoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (value: string | number) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(','), ...rows.map((row) => row.map(escape).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function StatusChip({ status }: { status: string }) {
  const style = STATUS_STYLE[status as StatusKey] ?? {
    label: status,
    fg: '#475569',
    bg: '#F1F5F9',
    dot: '#94A3B8',
  };
  return (
    <Chip
      size="small"
      label={
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: style.dot }} />
          <span>{style.label}</span>
        </Stack>
      }
      sx={{
        bgcolor: style.bg,
        color: style.fg,
        fontWeight: 600,
        fontSize: 11.5,
        height: 24,
        '& .MuiChip-label': { px: 1 },
      }}
    />
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ py: 1.1 }}>
      <Typography variant="body2" sx={{ color: '#64748B', flexShrink: 0 }}>
        {label}
      </Typography>
      <Box sx={{ textAlign: 'right', minWidth: 0, wordBreak: 'break-word' }}>{value}</Box>
    </Stack>
  );
}

function PendingApiItem({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <MenuItem disabled onClick={onClick}>
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ width: '100%' }}>
        {icon}
        <Typography variant="body2" sx={{ flex: 1 }}>
          {label}
        </Typography>
        <Chip size="small" label="API pending" sx={{ height: 18, fontSize: 10, bgcolor: '#F1F5F9' }} />
      </Stack>
    </MenuItem>
  );
}

type PendingAction =
  | { kind: 'activate'; user: UserView }
  | { kind: 'suspend'; user: UserView }
  | { kind: 'invite'; user: UserView }
  | { kind: 'bulk-activate'; users: UserView[] }
  | { kind: 'bulk-suspend'; users: UserView[] };

export function UsersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(25);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [tenantId, setTenantId] = useState('ALL');
  const [businessType, setBusinessType] = useState('ALL');
  const [role, setRole] = useState('ALL');
  const [recentOnly, setRecentOnly] = useState(false);
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [draftFrom, setDraftFrom] = useState('');
  const [draftTo, setDraftTo] = useState('');

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [menu, setMenu] = useState<{ anchor: HTMLElement; user: UserView } | null>(null);
  const [drawerUser, setDrawerUser] = useState<UserView | null>(null);
  const [drawerTab, setDrawerTab] = useState(0);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [invite, setInvite] = useState<{ token: string; email: string; expiresAt: string } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [dateAnchor, setDateAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 350);
    return () => window.clearTimeout(handle);
  }, [search]);

  const users = useQuery({
    queryKey: ['sa-users', { page, size, search: debouncedSearch, status, tenantId }],
    queryFn: () =>
      platformApi.users({
        page,
        size,
        search: debouncedSearch || undefined,
        status: status === 'ALL' ? undefined : status,
        tenantId: tenantId === 'ALL' ? undefined : Number(tenantId),
      }),
  });

  const stats = useQuery({ queryKey: ['sa-stats'], queryFn: () => platformApi.stats() });

  const tenants = useQuery({
    queryKey: ['sa-tenants-directory'],
    queryFn: () => tenantApi.list({ page: 0, size: 200, sort: 'name', direction: 'asc' }),
    staleTime: 5 * 60_000,
  });

  const roles = useQuery({
    queryKey: ['sa-roles'],
    queryFn: () => platformApi.roles(),
    staleTime: 5 * 60_000,
  });

  const directory = useQuery({
    queryKey: ['sa-users-directory'],
    queryFn: () => platformApi.users({ page: 0, size: 500 }),
    staleTime: 2 * 60_000,
  });

  const pendingCount = useQuery({
    queryKey: ['sa-users-count', 'PENDING'],
    queryFn: () => platformApi.users({ page: 0, size: 1, status: 'PENDING' }),
    staleTime: 60_000,
  });

  const lockedCount = useQuery({
    queryKey: ['sa-users-count', 'LOCKED'],
    queryFn: () => platformApi.users({ page: 0, size: 1, status: 'LOCKED' }),
    staleTime: 60_000,
  });

  const suspendedCount = useQuery({
    queryKey: ['sa-users-count', 'SUSPENDED'],
    queryFn: () => platformApi.users({ page: 0, size: 1, status: 'SUSPENDED' }),
    staleTime: 60_000,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['sa-users'] });
    void queryClient.invalidateQueries({ queryKey: ['sa-users-count'] });
    void queryClient.invalidateQueries({ queryKey: ['sa-users-directory'] });
    void queryClient.invalidateQueries({ queryKey: ['sa-stats'] });
  };

  const statusMutation = useMutation({
    mutationFn: async (action: PendingAction) => {
      if (action.kind === 'activate') {
        await platformApi.activateUser(action.user.id);
        return action.kind;
      }
      if (action.kind === 'suspend') {
        await platformApi.suspendUser(action.user.id);
        return action.kind;
      }
      if (action.kind === 'bulk-activate' || action.kind === 'bulk-suspend') {
        for (const user of action.users) {
          if (action.kind === 'bulk-activate') await platformApi.activateUser(user.id);
          else await platformApi.suspendUser(user.id);
        }
        return action.kind;
      }
      return action.kind;
    },
    onSuccess: (kind) => {
      toast(
        kind === 'activate' || kind === 'bulk-activate'
          ? 'User access activated'
          : 'User access suspended',
      );
      setPending(null);
      setSelectedIds([]);
      setMenu(null);
      invalidate();
    },
    onError: (error: Error) => {
      toast(error.message, 'error');
      setPending(null);
    },
  });

  const inviteMutation = useMutation({
    mutationFn: (user: UserView) => platformApi.resendInvite(user.id),
    onSuccess: (result) => {
      setPending(null);
      setMenu(null);
      setInvite({
        token: result.inviteToken,
        email: result.user.email,
        expiresAt: result.inviteExpiresAt,
      });
      toast('Invitation regenerated');
      invalidate();
    },
    onError: (error: Error) => {
      toast(error.message, 'error');
      setPending(null);
    },
  });

  const tenantList = tenants.data?.content ?? [];
  const tenantById = useMemo(() => {
    const map = new Map<number, TenantSummary>();
    tenantList.forEach((tenant) => map.set(tenant.id, tenant));
    return map;
  }, [tenantList]);

  const businessTypeOptions = useMemo(() => {
    const codes = new Set<string>();
    tenantList.forEach((tenant) => {
      if (tenant.businessType) codes.add(tenant.businessType);
    });
    if (codes.size === 0) {
      Object.keys(BUSINESS_TYPE_LABELS).forEach((code) => codes.add(code));
    }
    return [...codes].sort();
  }, [tenantList]);

  const roleOptions = useMemo(() => {
    const codes = new Set<string>(ROLE_OPTIONS);
    (directory.data?.content ?? []).forEach((user) => user.roles.forEach((code) => codes.add(code)));
    return [...codes].sort();
  }, [directory.data]);

  const recentActive = useMemo(() => {
    const list = directory.data?.content ?? [];
    return list.filter((user) => {
      if (!user.lastLoginAt) return false;
      const time = new Date(user.lastLoginAt).getTime();
      return !Number.isNaN(time) && Date.now() - time <= RECENT_WINDOW_MS;
    }).length;
  }, [directory.data]);

  const directoryTruncated = (directory.data?.page.totalElements ?? 0) > (directory.data?.content.length ?? 0);

  const rows = users.data?.content ?? [];

  const visibleRows = useMemo(() => {
    return rows.filter((user) => {
      const tenant = user.tenantId != null ? tenantById.get(user.tenantId) : undefined;
      if (businessType !== 'ALL' && (tenant?.businessType ?? '') !== businessType) return false;
      if (role !== 'ALL' && !user.roles.includes(role)) return false;
      if (createdFrom && user.createdAt.slice(0, 10) < createdFrom) return false;
      if (createdTo && user.createdAt.slice(0, 10) > createdTo) return false;
      if (recentOnly) {
        if (!user.lastLoginAt) return false;
        const time = new Date(user.lastLoginAt).getTime();
        if (Number.isNaN(time) || Date.now() - time > RECENT_WINDOW_MS) return false;
      }
      return true;
    });
  }, [rows, businessType, role, createdFrom, createdTo, recentOnly, tenantById]);

  const clientFilterActive =
    businessType !== 'ALL' || role !== 'ALL' || Boolean(createdFrom) || Boolean(createdTo) || recentOnly;

  const totalUsers = stats.data?.users.total ?? users.data?.page.totalElements ?? 0;
  const activeUsers = stats.data?.users.active ?? 0;
  const pendingUsers = pendingCount.data?.page.totalElements ?? 0;
  const lockedUsers = lockedCount.data?.page.totalElements ?? 0;
  const suspendedUsers = suspendedCount.data?.page.totalElements ?? 0;

  const selectedUsers = useMemo(
    () => rows.filter((user) => selectedIds.includes(user.id)),
    [rows, selectedIds],
  );

  const allVisibleSelected = visibleRows.length > 0 && visibleRows.every((user) => selectedIds.includes(user.id));

  const clearFilters = () => {
    setSearch('');
    setStatus('ALL');
    setTenantId('ALL');
    setBusinessType('ALL');
    setRole('ALL');
    setRecentOnly(false);
    setCreatedFrom('');
    setCreatedTo('');
    setPage(0);
  };

  const dateLabel = useMemo(() => {
    if (createdFrom && createdTo) return `${formatDate(createdFrom)} – ${formatDate(createdTo)}`;
    if (createdFrom) return `From ${formatDate(createdFrom)}`;
    if (createdTo) return `Until ${formatDate(createdTo)}`;
    return 'Registration date';
  }, [createdFrom, createdTo]);

  const applyPreset = (preset: 'today' | '7d' | '30d' | 'month') => {
    const now = new Date();
    if (preset === 'today') {
      setDraftFrom(isoDate(now));
      setDraftTo(isoDate(now));
      return;
    }
    if (preset === '7d') {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      setDraftFrom(isoDate(start));
      setDraftTo(isoDate(now));
      return;
    }
    if (preset === '30d') {
      const start = new Date(now);
      start.setDate(now.getDate() - 29);
      setDraftFrom(isoDate(start));
      setDraftTo(isoDate(now));
      return;
    }
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    setDraftFrom(isoDate(start));
    setDraftTo(isoDate(now));
  };

  const exportUsers = (list: UserView[]) => {
    if (list.length === 0) {
      toast('Nothing to export', 'warning');
      return;
    }
    downloadCsv(
      `users-${new Date().toISOString().slice(0, 10)}.csv`,
      ['User ID', 'Name', 'Email', 'Phone', 'Tenant', 'Business Type', 'Roles', 'Status', 'Last Login', 'Created At'],
      list.map((user) => {
        const tenant = user.tenantId != null ? tenantById.get(user.tenantId) : undefined;
        return [
          user.id,
          fullName(user),
          user.email,
          user.phone ?? '',
          user.tenantName,
          tenant?.businessType ? (BUSINESS_TYPE_LABELS[tenant.businessType] ?? tenant.businessType) : 'Platform',
          user.roles.join(' / '),
          user.status,
          user.lastLoginAt ?? '',
          user.createdAt,
        ];
      }),
    );
  };

  const openDrawer = (user: UserView) => {
    setDrawerUser(user);
    setDrawerTab(0);
    setMenu(null);
  };

  const drawerTenant = drawerUser?.tenantId != null ? tenantById.get(drawerUser.tenantId) : undefined;
  const drawerRoles: RoleView[] = useMemo(() => {
    if (!drawerUser) return [];
    const all = roles.data ?? [];
    return all.filter((candidate) => drawerUser.roles.includes(candidate.code));
  }, [drawerUser, roles.data]);

  const performPending = () => {
    if (!pending) return;
    if (pending.kind === 'invite') {
      inviteMutation.mutate(pending.user);
      return;
    }
    statusMutation.mutate(pending);
  };

  const confirmContent = useMemo(() => {
    if (!pending) return { title: '', description: '', confirmLabel: 'Confirm', destructive: false };
    if (pending.kind === 'activate') {
      return {
        title: 'Activate user?',
        description: `${fullName(pending.user)} will be able to sign in again immediately.`,
        confirmLabel: 'Activate',
        destructive: false,
      };
    }
    if (pending.kind === 'suspend') {
      return {
        title: 'Suspend user?',
        description: `${fullName(pending.user)} will lose access to the platform until reactivated. Tenant data is not deleted.`,
        confirmLabel: 'Suspend',
        destructive: true,
      };
    }
    if (pending.kind === 'invite') {
      return {
        title: 'Resend invitation?',
        description: `A new invite token will be generated for ${pending.user.email}. The previous link becomes invalid.`,
        confirmLabel: 'Resend invite',
        destructive: false,
      };
    }
    const count = pending.users.length;
    const verb = pending.kind === 'bulk-activate' ? 'Activate' : 'Suspend';
    return {
      title: `${verb} ${count} user${count === 1 ? '' : 's'}?`,
      description: `${count} selected account${count === 1 ? '' : 's'} will be updated immediately.`,
      confirmLabel: `${verb} selected`,
      destructive: pending.kind === 'bulk-suspend',
    };
  }, [pending]);

  return (
    <>
      <PageHeader
        title="User Management"
        subtitle="Manage platform-wide users, account access, roles and security."
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              startIcon={<Download size={16} />}
              onClick={() => exportUsers(visibleRows)}
              disabled={visibleRows.length === 0}
            >
              Export Users
            </Button>
            <Button variant="contained" startIcon={<UserPlus size={16} />} onClick={() => setCreateOpen(true)}>
              Create User
            </Button>
            <Tooltip title="Refresh data">
              <Button
                variant="outlined"
                startIcon={<RefreshCw size={16} />}
                onClick={() => {
                  void queryClient.invalidateQueries({ queryKey: ['sa-users'] });
                  void queryClient.invalidateQueries({ queryKey: ['sa-users-directory'] });
                  void queryClient.invalidateQueries({ queryKey: ['sa-stats'] });
                }}
              >
                Refresh
              </Button>
            </Tooltip>
          </Stack>
        }
      />

      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          mb: 2.5,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
            xl: 'repeat(6, 1fr)',
          },
        }}
      >
        <KpiCard
          label="Total users"
          value={totalUsers}
          sub={`${activeUsers} active accounts`}
          icon={<Users size={18} />}
          tone="info"
          onClick={() => {
            clearFilters();
          }}
        />
        <KpiCard
          label="Active users"
          value={activeUsers}
          sub={totalUsers > 0 ? `${Math.round((activeUsers / totalUsers) * 100)}% of all users` : undefined}
          icon={<UserCheck size={18} />}
          tone="success"
          onClick={() => {
            clearFilters();
            setStatus('ACTIVE');
          }}
        />
        <KpiCard
          label="Pending invitations"
          value={pendingUsers}
          sub="Awaiting acceptance"
          icon={<Send size={18} />}
          tone="warning"
          onClick={() => {
            clearFilters();
            setStatus('PENDING');
          }}
        />
        <KpiCard
          label="Locked accounts"
          value={lockedUsers}
          sub="Sign-in blocked"
          icon={<Lock size={18} />}
          tone="error"
          onClick={() => {
            clearFilters();
            setStatus('LOCKED');
          }}
        />
        <KpiCard
          label="Suspended users"
          value={suspendedUsers}
          sub="Access revoked"
          icon={<UserX size={18} />}
          tone="error"
          onClick={() => {
            clearFilters();
            setStatus('SUSPENDED');
          }}
        />
        <KpiCard
          label="Recently active"
          value={recentActive}
          sub={directoryTruncated ? 'Last 7 days · latest 500 records' : 'Signed in within 7 days'}
          icon={<Activity size={18} />}
          tone="success"
          onClick={() => {
            clearFilters();
            setRecentOnly(true);
          }}
        />
      </Box>

      <Card sx={{ border: `1px solid ${BORDER}`, borderRadius: 2, boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)' }}>
        <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search by name, email, phone or user ID"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{ minWidth: { xs: '100%', md: 300 }, flex: { md: 1 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} color="#64748B" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            select
            size="small"
            label="Tenant"
            value={tenantId}
            onChange={(event) => {
              setTenantId(event.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="ALL">All tenants</MenuItem>
            {tenantList.map((tenant) => (
              <MenuItem key={tenant.id} value={String(tenant.id)}>
                {tenant.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Business type"
            value={businessType}
            onChange={(event) => setBusinessType(event.target.value)}
            sx={{ minWidth: 175 }}
          >
            <MenuItem value="ALL">All business types</MenuItem>
            {businessTypeOptions.map((code) => (
              <MenuItem key={code} value={code}>
                {BUSINESS_TYPE_LABELS[code] ?? code}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="ALL">All roles</MenuItem>
            {roleOptions.map((code) => (
              <MenuItem key={code} value={code}>
                {code.replace(/_/g, ' ')}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 165 }}
          >
            {STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Calendar size={15} />}
            onClick={(event) => {
              setDraftFrom(createdFrom);
              setDraftTo(createdTo);
              setDateAnchor(event.currentTarget);
            }}
            sx={{
              textTransform: 'none',
              color: createdFrom || createdTo ? NAVY : '#64748B',
              borderColor: createdFrom || createdTo ? '#CBD5E1' : BORDER,
              height: 40,
            }}
          >
            {dateLabel}
          </Button>
          {(search || status !== 'ALL' || tenantId !== 'ALL' || clientFilterActive) && (
            <Button size="small" startIcon={<Filter size={14} />} onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </Box>

        {clientFilterActive ? (
          <Box sx={{ px: 1.5, pb: 1.25 }}>
            <Alert severity="info" icon={<ShieldAlert size={16} />} sx={{ py: 0, fontSize: 12.5 }}>
              Role, business type, registration date and recent-activity filters apply to the loaded page. The platform
              API supports server-side search, status and tenant filters.
            </Alert>
          </Box>
        ) : null}

        {selectedIds.length > 0 ? (
          <Box sx={{ px: 1.5, pb: 1.25 }}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
              sx={{ bgcolor: '#F8FAFC', border: `1px solid ${BORDER}`, borderRadius: 2, px: 1.5, py: 1 }}
            >
              <Typography variant="body2" fontWeight={600}>
                {selectedIds.length} selected
              </Typography>
              <Button
                size="small"
                startIcon={<CheckCircle2 size={14} />}
                onClick={() => setPending({ kind: 'bulk-activate', users: selectedUsers })}
                disabled={statusMutation.isPending}
              >
                Activate
              </Button>
              <Button
                size="small"
                color="error"
                startIcon={<UserX size={14} />}
                onClick={() => setPending({ kind: 'bulk-suspend', users: selectedUsers })}
                disabled={statusMutation.isPending}
              >
                Suspend
              </Button>
              <Tooltip title="Role assignment endpoint is not available yet">
                <span>
                  <Button size="small" startIcon={<ShieldCheck size={14} />} disabled>
                    Assign role
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title="Account locking endpoint is not available yet">
                <span>
                  <Button size="small" startIcon={<Lock size={14} />} disabled>
                    Lock
                  </Button>
                </span>
              </Tooltip>
              <Button size="small" startIcon={<Download size={14} />} onClick={() => exportUsers(selectedUsers)}>
                Export selected
              </Button>
              <Box sx={{ flex: 1 }} />
              <IconButton size="small" onClick={() => setSelectedIds([])} aria-label="Clear selection">
                <X size={16} />
              </IconButton>
            </Stack>
          </Box>
        ) : null}

        <Divider />

        {users.isError ? (
          <Box sx={{ p: 2 }}>
            <ErrorState message={(users.error as Error).message} onRetry={() => void users.refetch()} />
          </Box>
        ) : null}

        {users.isPending ? (
          <Box sx={{ p: 2 }}>
            <Stack spacing={1.25}>
              {[0, 1, 2, 3, 4, 5].map((row) => (
                <Stack key={row} direction="row" spacing={2} alignItems="center">
                  <Skeleton variant="circular" width={34} height={34} />
                  <Skeleton variant="text" width={180} height={28} />
                  <Skeleton variant="text" width={120} height={28} />
                  <Skeleton variant="rounded" width={80} height={24} />
                  <Skeleton variant="text" width={110} height={28} />
                </Stack>
              ))}
            </Stack>
          </Box>
        ) : null}

        {users.data && visibleRows.length === 0 ? (
          <EmptyState
            title="No users found"
            description="Try adjusting the search or filters. If you just created a user, refresh the list."
            action={
              <Button variant="outlined" size="small" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        ) : null}

        {users.data && visibleRows.length > 0 ? (
          <>
            <Box sx={{ overflowX: 'auto' }}>
              <Table stickyHeader size="medium" sx={{ minWidth: 1080 }}>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        checked={allVisibleSelected}
                        indeterminate={!allVisibleSelected && visibleRows.some((user) => selectedIds.includes(user.id))}
                        onChange={(event) => {
                          if (event.target.checked) {
                            setSelectedIds((prev) =>
                              [...new Set([...prev, ...visibleRows.map((user) => user.id)])],
                            );
                          } else {
                            setSelectedIds((prev) =>
                              prev.filter((id) => !visibleRows.some((user) => user.id === id)),
                            );
                          }
                        }}
                        inputProps={{ 'aria-label': 'Select all visible users' }}
                      />
                    </TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Tenant / Business</TableCell>
                    <TableCell>Business Type</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Account Status</TableCell>
                    <TableCell>Last Login</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleRows.map((user) => {
                    const tenant = user.tenantId != null ? tenantById.get(user.tenantId) : undefined;
                    const businessLabel = tenant?.businessType
                      ? (BUSINESS_TYPE_LABELS[tenant.businessType] ?? tenant.businessType)
                      : user.tenantId == null
                        ? 'Platform'
                        : 'Not set';
                    const lastLogin = relativeTime(user.lastLoginAt);
                    return (
                      <TableRow key={user.id} hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            size="small"
                            checked={selectedIds.includes(user.id)}
                            onChange={(event) => {
                              setSelectedIds((prev) =>
                                event.target.checked
                                  ? [...new Set([...prev, user.id])]
                                  : prev.filter((id) => id !== user.id),
                              );
                            }}
                            inputProps={{ 'aria-label': `Select ${fullName(user)}` }}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1.25} alignItems="center">
                            <Avatar
                              sx={{
                                width: 36,
                                height: 36,
                                bgcolor: user.status === 'ACTIVE' ? '#E8F5EE' : '#F1F5F9',
                                color: user.status === 'ACTIVE' ? '#15803D' : '#475569',
                                fontSize: 12.5,
                                fontWeight: 700,
                              }}
                            >
                              {getInitials(user.firstName, user.lastName, user.email)}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={600} noWrap>
                                {fullName(user)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {user.email}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{user.tenantName || 'Platform'}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.tenantId != null ? `Tenant ID: ${user.tenantId}` : 'Platform level'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={businessLabel}
                            variant="outlined"
                            sx={{ fontSize: 11.5, borderColor: BORDER, color: '#475569' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                            {user.roles.slice(0, 2).map((code) => (
                              <Chip
                                key={code}
                                size="small"
                                label={code.replace(/_/g, ' ')}
                                sx={{ height: 22, fontSize: 10.5, bgcolor: '#F8FAFC', color: '#334155' }}
                              />
                            ))}
                            {user.roles.length > 2 ? (
                              <Chip
                                size="small"
                                label={`+${user.roles.length - 2}`}
                                sx={{ height: 22, fontSize: 10.5, bgcolor: '#F1F5F9' }}
                              />
                            ) : null}
                            {user.roles.length === 0 ? (
                              <Typography variant="caption" color="text.secondary">
                                No role
                              </Typography>
                            ) : null}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <StatusChip status={user.status} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{lastLogin ?? 'Never'}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'No sign-in recorded'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{formatDate(user.createdAt)}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            aria-label={`Actions for ${fullName(user)}`}
                            onClick={(event: ReactMouseEvent<HTMLElement>) =>
                              setMenu({ anchor: event.currentTarget, user })
                            }
                          >
                            <MoreVertical size={18} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
            <TablePagination
              component="div"
              count={users.data.page.totalElements}
              page={page}
              rowsPerPage={size}
              rowsPerPageOptions={[10, 25, 50, 100]}
              onPageChange={(_, next) => setPage(next)}
              onRowsPerPageChange={(event) => {
                setSize(Number(event.target.value));
                setPage(0);
              }}
            />
          </>
        ) : null}
      </Card>

      <Menu
        anchorEl={menu?.anchor ?? null}
        open={Boolean(menu)}
        onClose={() => setMenu(null)}
        slotProps={{ paper: { sx: { minWidth: 248 } } }}
      >
        <MenuItem
          onClick={() => {
            if (menu) openDrawer(menu.user);
          }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Eye size={16} />
            <Typography variant="body2">View profile</Typography>
          </Stack>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!menu) return;
            void navigator.clipboard?.writeText(String(menu.user.id));
            toast('User ID copied');
            setMenu(null);
          }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Copy size={16} />
            <Typography variant="body2">Copy user ID</Typography>
          </Stack>
        </MenuItem>
        <Divider />
        {menu?.user.status === 'ACTIVE' ? (
          <MenuItem
            onClick={() => {
              if (menu) setPending({ kind: 'suspend', user: menu.user });
            }}
            sx={{ color: '#B91C1C' }}
          >
            <Stack direction="row" spacing={1.25} alignItems="center">
              <UserX size={16} />
              <Typography variant="body2">Suspend user</Typography>
            </Stack>
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => {
              if (menu) setPending({ kind: 'activate', user: menu.user });
            }}
            sx={{ color: '#15803D' }}
          >
            <Stack direction="row" spacing={1.25} alignItems="center">
              <CheckCircle2 size={16} />
              <Typography variant="body2">Activate user</Typography>
            </Stack>
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            if (menu) setPending({ kind: 'invite', user: menu.user });
          }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Send size={16} />
            <Typography variant="body2">Resend invitation</Typography>
          </Stack>
        </MenuItem>
        <Divider />
        <PendingApiItem icon={<Pencil size={16} />} label="Edit user" onClick={() => undefined} />
        <PendingApiItem icon={<LockOpen size={16} />} label="Lock / unlock account" onClick={() => undefined} />
        <PendingApiItem icon={<KeyRound size={16} />} label="Reset password" onClick={() => undefined} />
        <PendingApiItem icon={<ShieldCheck size={16} />} label="Change role" onClick={() => undefined} />
        <PendingApiItem icon={<Trash2 size={16} />} label="Delete user" onClick={() => undefined} />
      </Menu>

      <Drawer
        anchor="right"
        open={Boolean(drawerUser)}
        onClose={() => setDrawerUser(null)}
        slotProps={{ paper: { sx: { width: { xs: '100%', sm: 480 } } } }}
      >
        {drawerUser ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ p: 2.5, borderBottom: `1px solid ${BORDER}` }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar
                    sx={{ width: 52, height: 52, bgcolor: '#EEF2F7', color: NAVY, fontWeight: 700, fontSize: 18 }}
                  >
                    {getInitials(drawerUser.firstName, drawerUser.lastName, drawerUser.email)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
                      {fullName(drawerUser)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {drawerUser.email}
                    </Typography>
                    <Stack direction="row" spacing={0.75} sx={{ mt: 0.75 }}>
                      <StatusChip status={drawerUser.status} />
                      <Chip
                        size="small"
                        label={`ID ${drawerUser.id}`}
                        sx={{ height: 24, fontSize: 11, bgcolor: '#F1F5F9' }}
                      />
                    </Stack>
                  </Box>
                </Stack>
                <IconButton size="small" onClick={() => setDrawerUser(null)} aria-label="Close profile">
                  <X size={18} />
                </IconButton>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                {drawerUser.status === 'ACTIVE' ? (
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    startIcon={<UserX size={14} />}
                    onClick={() => setPending({ kind: 'suspend', user: drawerUser })}
                  >
                    Suspend
                  </Button>
                ) : (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<CheckCircle2 size={14} />}
                    onClick={() => setPending({ kind: 'activate', user: drawerUser })}
                  >
                    Activate
                  </Button>
                )}
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Send size={14} />}
                  onClick={() => setPending({ kind: 'invite', user: drawerUser })}
                >
                  Resend invite
                </Button>
              </Stack>
            </Box>

            <Tabs
              value={drawerTab}
              onChange={(_, value: number) => setDrawerTab(value)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ px: 1.5, borderBottom: `1px solid ${BORDER}`, minHeight: 44 }}
            >
              <Tab label="Overview" sx={{ textTransform: 'none', minHeight: 44 }} />
              <Tab label="Roles & Permissions" sx={{ textTransform: 'none', minHeight: 44 }} />
              <Tab label="Login Activity" sx={{ textTransform: 'none', minHeight: 44 }} />
              <Tab label="Security" sx={{ textTransform: 'none', minHeight: 44 }} />
              <Tab label="Audit History" sx={{ textTransform: 'none', minHeight: 44 }} />
            </Tabs>

            <Box sx={{ p: 2.5, overflowY: 'auto', flex: 1 }}>
              {drawerTab === 0 ? (
                <Box>
                  <Typography variant="overline" sx={{ color: '#94A3B8', fontWeight: 700 }}>
                    Profile
                  </Typography>
                  <InfoRow label="Full name" value={fullName(drawerUser)} />
                  <InfoRow label="Email" value={drawerUser.email} />
                  <InfoRow label="Phone" value={drawerUser.phone ?? '—'} />
                  <InfoRow label="User ID" value={drawerUser.id} />
                  <InfoRow label="Email verified" value={drawerUser.emailVerified ? 'Yes' : 'No'} />
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="overline" sx={{ color: '#94A3B8', fontWeight: 700 }}>
                    Tenant
                  </Typography>
                  <InfoRow label="Tenant" value={drawerUser.tenantName || 'Platform'} />
                  <InfoRow label="Tenant ID" value={drawerUser.tenantId ?? '—'} />
                  <InfoRow
                    label="Business type"
                    value={
                      drawerTenant?.businessType
                        ? (BUSINESS_TYPE_LABELS[drawerTenant.businessType] ?? drawerTenant.businessType)
                        : drawerUser.tenantId == null
                          ? 'Platform'
                          : 'Not set'
                    }
                  />
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="overline" sx={{ color: '#94A3B8', fontWeight: 700 }}>
                    Activity
                  </Typography>
                  <InfoRow label="Created" value={formatDateTime(drawerUser.createdAt)} />
                  <InfoRow label="Last login" value={formatDateTime(drawerUser.lastLoginAt)} />
                </Box>
              ) : null}

              {drawerTab === 1 ? (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Roles currently assigned to this account.
                  </Typography>
                  {drawerUser.roles.length === 0 ? (
                    <Alert severity="warning">No roles assigned.</Alert>
                  ) : (
                    <Stack spacing={1.5}>
                      {drawerUser.roles.map((code) => {
                        const detail = drawerRoles.find((candidate) => candidate.code === code);
                        return (
                          <Box key={code} sx={{ border: `1px solid ${BORDER}`, borderRadius: 2, p: 1.5 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Stack direction="row" spacing={1} alignItems="center">
                                <ShieldCheck size={16} color="#475569" />
                                <Typography variant="body2" fontWeight={600}>
                                  {detail?.name ?? code.replace(/_/g, ' ')}
                                </Typography>
                              </Stack>
                              <Chip
                                size="small"
                                label={detail?.systemRole ? 'System' : 'Custom'}
                                sx={{ height: 20, fontSize: 10.5 }}
                              />
                            </Stack>
                            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
                              {detail?.description ?? code}
                            </Typography>
                            <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
                              {(detail?.permissions ?? []).slice(0, 8).map((permission) => (
                                <Chip
                                  key={permission}
                                  size="small"
                                  label={permission}
                                  sx={{ height: 20, fontSize: 10, bgcolor: '#F8FAFC' }}
                                />
                              ))}
                              {(detail?.permissions.length ?? 0) > 8 ? (
                                <Chip
                                  size="small"
                                  label={`+${(detail?.permissions.length ?? 0) - 8} more`}
                                  sx={{ height: 20, fontSize: 10 }}
                                />
                              ) : null}
                              {(detail?.permissions.length ?? 0) === 0 ? (
                                <Typography variant="caption" color="text.secondary">
                                  No permissions mapped
                                </Typography>
                              ) : null}
                            </Stack>
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                  <Alert severity="info" sx={{ mt: 2, fontSize: 12.5 }}>
                    Role changes require a user-role assignment endpoint that is not available in this build.
                  </Alert>
                </Box>
              ) : null}

              {drawerTab === 2 ? (
                <Box>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: '#EEF2F7',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <Activity size={18} color={NAVY} />
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {drawerUser.lastLoginAt ? 'Last sign-in' : 'No sign-in yet'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {drawerUser.lastLoginAt ? formatDateTime(drawerUser.lastLoginAt) : 'Waiting for first login'}
                      </Typography>
                    </Box>
                  </Stack>
                  <Alert severity="info" sx={{ fontSize: 12.5 }}>
                    Detailed login history requires a per-user activity endpoint (GET /api/v1/superadmin/users/&#123;id&#125;/login-activity)
                    which is not available yet.
                  </Alert>
                </Box>
              ) : null}

              {drawerTab === 3 ? (
                <Box>
                  <InfoRow label="Account status" value={<StatusChip status={drawerUser.status} />} />
                  <InfoRow label="Email verified" value={drawerUser.emailVerified ? 'Yes' : 'No'} />
                  <InfoRow label="Invite pending" value={drawerUser.status === 'PENDING' ? 'Yes' : 'No'} />
                  <InfoRow label="Lock state" value="Not tracked by API" />
                  <Divider sx={{ my: 1.5 }} />
                  <Alert severity="warning" sx={{ fontSize: 12.5 }}>
                    Account locking, forced password reset and lock history require dedicated security endpoints that are
                    not available in this build.
                  </Alert>
                  <Stack spacing={1} sx={{ mt: 2 }}>
                    <Button variant="outlined" size="small" startIcon={<KeyRound size={14} />} disabled>
                      Send password reset
                    </Button>
                    <Button variant="outlined" size="small" startIcon={<Lock size={14} />} disabled>
                      Lock account
                    </Button>
                  </Stack>
                </Box>
              ) : null}

              {drawerTab === 4 ? (
                <Box>
                  <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: '#EEF2F7',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Calendar size={18} color={NAVY} />
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Account created
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTime(drawerUser.createdAt)}
                      </Typography>
                    </Box>
                  </Stack>
                  <Alert severity="info" sx={{ fontSize: 12.5 }}>
                    Per-user audit history requires GET /api/v1/superadmin/users/&#123;id&#125;/audit which is not
                    available yet. Platform-wide audit entries are available on the Audit Logs page.
                  </Alert>
                </Box>
              ) : null}
            </Box>
          </Box>
        ) : null}
      </Drawer>

      <Popover
        open={Boolean(dateAnchor)}
        anchorEl={dateAnchor}
        onClose={() => setDateAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, width: 300 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
            Registration date
          </Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
            <Button size="small" variant="outlined" onClick={() => applyPreset('today')}>
              Today
            </Button>
            <Button size="small" variant="outlined" onClick={() => applyPreset('7d')}>
              Last 7 days
            </Button>
            <Button size="small" variant="outlined" onClick={() => applyPreset('30d')}>
              Last 30 days
            </Button>
            <Button size="small" variant="outlined" onClick={() => applyPreset('month')}>
              This month
            </Button>
          </Stack>
          <Stack spacing={1.25}>
            <TextField
              label="Start date"
              type="date"
              size="small"
              value={draftFrom}
              onChange={(event) => setDraftFrom(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="End date"
              type="date"
              size="small"
              value={draftTo}
              onChange={(event) => setDraftTo(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
          <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
            <Button
              size="small"
              onClick={() => {
                setDraftFrom('');
                setDraftTo('');
                setCreatedFrom('');
                setCreatedTo('');
                setDateAnchor(null);
              }}
            >
              Clear
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={() => {
                setCreatedFrom(draftFrom);
                setCreatedTo(draftTo);
                setDateAnchor(null);
              }}
            >
              Apply
            </Button>
          </Stack>
        </Box>
      </Popover>

      <ConfirmDialog
        open={Boolean(pending)}
        title={confirmContent.title}
        description={confirmContent.description}
        confirmLabel={confirmContent.confirmLabel}
        destructive={confirmContent.destructive}
        loading={statusMutation.isPending || inviteMutation.isPending}
        onConfirm={performPending}
        onCancel={() => setPending(null)}
      />

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Create user</DialogTitle>
        <DialogContent>
          <Alert severity="info" icon={<AlertTriangle size={16} />} sx={{ mb: 2, fontSize: 12.5 }}>
            Creating platform or tenant users requires POST /api/v1/superadmin/users, which is not available in this
            build. This form is a preview of the intended workflow and cannot submit yet.
          </Alert>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="First name" size="small" fullWidth />
              <TextField label="Last name" size="small" fullWidth />
            </Stack>
            <TextField label="Email" size="small" fullWidth type="email" />
            <TextField label="Phone number" size="small" fullWidth />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField select label="Tenant" size="small" fullWidth defaultValue="">
                <MenuItem value="">Platform (no tenant)</MenuItem>
                {tenantList.map((tenant) => (
                  <MenuItem key={tenant.id} value={String(tenant.id)}>
                    {tenant.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField select label="Role" size="small" fullWidth defaultValue="STAFF">
                {ROLE_OPTIONS.map((code) => (
                  <MenuItem key={code} value={code}>
                    {code.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField select label="Account status" size="small" fullWidth defaultValue="PENDING">
                <MenuItem value="PENDING">Pending invitation</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
              </TextField>
              <TextField label="Branch (optional)" size="small" fullWidth disabled placeholder="Branch assignment" />
            </Stack>
            <Button variant="text" size="small" sx={{ alignSelf: 'flex-start', textTransform: 'none' }} disabled>
              Invitation email will be sent on creation
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Close</Button>
          <Tooltip title="POST /api/v1/superadmin/users is not available yet">
            <span>
              <Button variant="contained" disabled>
                Create user
              </Button>
            </span>
          </Tooltip>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(invite)} onClose={() => setInvite(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Invitation token</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Share this one-time token with <strong>{invite?.email}</strong>. It expires on{' '}
            {invite ? formatDateTime(invite.expiresAt) : ''}.
          </Typography>
          <TextField
            value={invite?.token ?? ''}
            fullWidth
            size="small"
            slotProps={{ input: { readOnly: true, sx: { fontFamily: 'monospace', fontSize: 12 } } }}
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button
            startIcon={<Copy size={14} />}
            onClick={() => {
              if (!invite) return;
              void navigator.clipboard?.writeText(invite.token);
              toast('Invite token copied');
            }}
          >
            Copy token
          </Button>
          <Button variant="contained" onClick={() => setInvite(null)}>
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {users.isFetching && !users.isPending ? (
        <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1400 }}>
          <CircularProgress size={18} />
        </Box>
      ) : null}
    </>
  );
}
