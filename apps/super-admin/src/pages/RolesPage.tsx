import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  TextField,
  Typography,
} from '@mui/material';
import {
  Activity,
  ArrowLeft,
  ChevronRight,
  Copy,
  FileText,
  Lock,
  Menu as MenuIcon,
  Plus,
  Pencil,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import { ConfirmDialog, EmptyState, ErrorState, LoadingState, PageHeader } from '@resto/ui';
import { platformApi, type PermissionView, type RoleView, type UserView } from '@/api';
import { useToast } from '@/components/toast';
import KpiCard from '@/components/KpiCard';

const DOMAINS = [
  { value: 'all', label: 'All Domains' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'ELECTRONICS', label: 'Electronics Store' },
  { value: 'VEHICLE', label: 'Vehicle Dealership' },
  { value: 'REAL_ESTATE', label: 'Builder / Broker' },
] as const;

const SCOPES = ['Platform', 'Tenant', 'Branch'] as const;

interface GroupDef {
  key: string;
  label: string;
  icon: React.ElementType;
  domain: string;
  description: string;
  codes: string[];
}

const GROUPS: GroupDef[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: Activity,
    domain: 'Platform',
    description: 'Platform dashboards and analytics',
    codes: ['dashboard.read', 'dashboard.analytics'],
  },
  {
    key: 'tenant',
    label: 'Tenant Management',
    icon: MenuIcon,
    domain: 'Platform',
    description: 'Tenants, domains and onboarding',
    codes: ['tenant.read', 'tenant.create', 'tenant.update', 'tenant.delete', 'tenant.suspend', 'tenant.activate'],
  },
  {
    key: 'branch',
    label: 'Branch Management',
    icon: ChevronRight,
    domain: 'Restaurant',
    description: 'Branches, locations and operating status',
    codes: ['branch.read', 'branch.create', 'branch.update', 'branch.delete', 'branch.activate', 'branch.deactivate'],
  },
  {
    key: 'user',
    label: 'User Management',
    icon: Users,
    domain: 'Platform',
    description: 'Users, roles and access',
    codes: ['user.read', 'user.create', 'user.update', 'user.delete', 'user.suspend', 'user.activate', 'user.invite'],
  },
  {
    key: 'menu',
    label: 'Menu Management (Restaurant)',
    icon: MenuIcon,
    domain: 'Restaurant',
    description: 'Categories, items and attributes',
    codes: ['menu.read', 'menu.create', 'menu.update', 'menu.delete'],
  },
  {
    key: 'order',
    label: 'Order Management (Restaurant)',
    icon: FileText,
    domain: 'Restaurant',
    description: 'Orders, tables and kitchen',
    codes: ['order.read', 'order.create', 'order.update', 'order.cancel', 'order.manage'],
  },
  {
    key: 'subscription',
    label: 'Subscription Management',
    icon: Lock,
    domain: 'Platform',
    description: 'Plans, subscriptions and invoices',
    codes: ['subscription.read', 'subscription.create', 'subscription.update', 'subscription.cancel'],
  },
  {
    key: 'reports',
    label: 'Reports & Analytics',
    icon: FileText,
    domain: 'Platform',
    description: 'Sales, customers and exports',
    codes: ['report.read', 'report.export', 'analytics.read'],
  },
  {
    key: 'financial',
    label: 'Financial Management',
    icon: Activity,
    domain: 'Platform',
    description: 'Payments and invoices',
    codes: ['payment.read', 'payment.manage', 'invoice.read', 'invoice.manage'],
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: ShieldCheck,
    domain: 'Platform',
    description: 'Platform settings and feature flags',
    codes: ['settings.read', 'settings.update'],
  },
] as const;

function actionOf(code: string): string {
  return code.split('.').pop() ?? '';
}

function domainOf(code: string): string {
  const map: Record<string, string> = {
    dashboard: 'Platform',
    tenant: 'Platform',
    branch: 'Restaurant',
    user: 'Platform',
    menu: 'Restaurant',
    order: 'Restaurant',
    subscription: 'Platform',
    report: 'Platform',
    analytics: 'Platform',
    payment: 'Platform',
    invoice: 'Platform',
    settings: 'Platform',
  };
  const prefix = code.split('.')[0] ?? '';
  return map[prefix] ?? 'Platform';
}

function setsEqual(a: Set<number>, b: Set<number>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

export function RolesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const rolesQuery = useQuery({ queryKey: ['sa-roles'], queryFn: () => platformApi.roles() });
  const permissionsQuery = useQuery({ queryKey: ['sa-permissions'], queryFn: () => platformApi.permissions() });

  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState<typeof DOMAINS[number]['value']>('all');
  const [scopeFilter, setScopeFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'permissions' | 'users'>('permissions');
  const [editingRole, setEditingRole] = useState<RoleView | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<Set<number>>(new Set());
  const [originalPerms, setOriginalPerms] = useState<Set<number>>(new Set());
  const [dirty, setDirty] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1);
  const [createForm, setCreateForm] = useState<{
    code: string;
    name: string;
    description: string;
    domain: string;
    scope: 'Platform' | 'Tenant' | 'Branch';
  }>({
    code: '',
    name: '',
    description: '',
    domain: 'RESTAURANT',
    scope: 'Tenant',
  });
  const [createPerms, setCreatePerms] = useState<Set<number>>(new Set());
  const [creating, setCreating] = useState(false);

  const [catalogOpen, setCatalogOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const saveRolePerms = useMutation({
    mutationFn: () =>
      platformApi.updateRolePermissions(editingRole!.id, Array.from(selectedPerms)),
    onSuccess: () => {
      toast('Role permissions saved');
      setDirty(false);
      setOriginalPerms(new Set(selectedPerms));
      void queryClient.invalidateQueries({ queryKey: ['sa-roles'] });
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  const createRole = useMutation({
    mutationFn: () => platformApi.createRole(createForm),
    onSuccess: () => {
      toast('Custom role created');
      setCreating(false);
      setCreateOpen(false);
      setCreateStep(1);
      setCreateForm({
        code: '',
        name: '',
        description: '',
        domain: 'RESTAURANT',
        scope: 'Tenant',
      });
      setCreatePerms(new Set());
      void queryClient.invalidateQueries({ queryKey: ['sa-roles'] });
    },
            onError: (error: Error) => {
              setCreating(false);
              toast(error.message, 'error');
            },
          });

          const [confirmOpen, setConfirmOpen] = useState(false);
          const [confirmAction, setConfirmAction] = useState<'delete-role' | 'remove-user' | 'save-permissions' | null>(null);
          const [confirmTarget, setConfirmTarget] = useState<{
            id?: number;
            userId?: number;
            roleCode?: string;
            userName?: string;
            roleName?: string;
          } | null>(null);

          const handleConfirm = () => {
            if (confirmAction === 'delete-role' && confirmTarget?.id != null) {
              deleteRole.mutate(confirmTarget.id);
            } else if (confirmAction === 'remove-user' && confirmTarget?.userId != null && confirmTarget.roleCode) {
              removeRole.mutate({ userId: confirmTarget.userId, roleCode: confirmTarget.roleCode });
            } else if (confirmAction === 'save-permissions') {
              savePermissions();
            }
            setConfirmOpen(false);
            setConfirmAction(null);
            setConfirmTarget(null);
          };

          const deleteRole = useMutation({
    mutationFn: (id: number) => platformApi.deleteRole(id),
    onSuccess: () => {
      toast('Role deleted');
      setDrawerOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['sa-roles'] });
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  const removeRole = useMutation({
    mutationFn: ({ userId, roleCode }: { userId: number; roleCode: string }) =>
      platformApi.removeUserRole(userId, roleCode),
    onSuccess: () => {
      toast('Role removed');
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  const permissions = useMemo(() => permissionsQuery.data ?? [], [permissionsQuery.data]);
  const roles = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data]);

  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      const text = search.trim().toLowerCase();
      const matchesSearch =
        !text ||
        role.name.toLowerCase().includes(text) ||
        role.code.toLowerCase().includes(text) ||
        (role.description ?? '').toLowerCase().includes(text);
      if (!matchesSearch) return false;
      if (domainFilter !== 'all') {
        if (domainOf(role.code) !== domainFilter) return false;
      }
      if (scopeFilter) {
        const roleScope = role.systemRole ? 'Platform' : role.tenantId ? 'Tenant' : 'Platform';
        if (roleScope !== scopeFilter) return false;
      }
      return true;
    });
  }, [roles, search, domainFilter, scopeFilter]);

  const totalRoles = roles.length;
  const systemRoles = roles.filter((r) => r.systemRole).length;
  const customRoles = totalRoles - systemRoles;
  const totalPermissions = permissions.length;

  const openRole = (role: RoleView) => {
    setEditingRole(role);
    setSelectedPerms(new Set(role.permissionIds));
    setOriginalPerms(new Set(role.permissionIds));
    setDirty(false);
    setDrawerTab('permissions');
    setDrawerOpen(true);
  };

  const handlePermChange = (id: number, checked: boolean) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      setDirty(!setsEqual(next, originalPerms));
      return next;
    });
  };

  const selectGroup = (group: GroupDef, checked: boolean) => {
    const idSet = new Set(permissions.filter((p) => group.codes.includes(p.code)).map((p) => p.id));
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      idSet.forEach((id) => (checked ? next.add(id) : next.delete(id)));
      setDirty(!setsEqual(next, originalPerms));
      return next;
    });
  };

  const clearAll = () => {
    setSelectedPerms(new Set());
    setDirty(true);
  };

  const resetDefaults = () => {
    setSelectedPerms(new Set(originalPerms));
    setDirty(false);
  };

  const savePermissions = () => {
    saveRolePerms.mutate();
  };

  const scopeLabel = (role: RoleView): string => {
    if (role.systemRole) return 'Platform';
    return role.tenantId ? `Tenant #${role.tenantId}` : 'Platform';
  };

  const rows = useMemo(() => {
    const start = page * pageSize;
    return filteredRoles.slice(start, start + pageSize);
  }, [filteredRoles, page, pageSize]);

  const auditRefetch = useCallback(() => {
    setAuditLoading(true);
    platformApi
      .auditLogs({ search: '', page: 0, size: 100 })
      .then((data) => {
        const logs = (data.content ?? []).filter(
          (log: any) => log.entityType === 'Role' || log.action?.includes('ROLE') || log.action?.includes('USER_ROLE'),
        );
        setAuditLogs(logs.slice(0, 50));
      })
      .finally(() => setAuditLoading(false));
  }, []);

  useEffect(() => {
    if (auditOpen) auditRefetch();
  }, [auditOpen, auditRefetch]);

  return (
    <>
      <PageHeader
        title="Roles & Permissions"
        subtitle="Manage platform roles, tenant roles and access permissions across all business domains."
        actions={
          <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="contained"
              startIcon={<Plus size={16} />}
              onClick={() => {
                setCreateStep(1);
                setCreateForm({
                  code: '',
                  name: '',
                  description: '',
                  domain: 'RESTAURANT',
                  scope: 'Tenant',
                });
                setCreatePerms(new Set());
                setCreateOpen(true);
              }}
            >
              Create Custom Role
            </Button>
            <Button size="small" variant="outlined" startIcon={<ShieldCheck size={16} />} onClick={() => setCatalogOpen(true)}>
              Permission Catalog
            </Button>
            <Button size="small" variant="outlined" startIcon={<Activity size={16} />} onClick={() => setAuditOpen(true)}>
              Audit History
            </Button>
          </Stack>
        }
      />

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
        }}
      >
        <KpiCard label="Total Roles" value={totalRoles} sub="All platform and custom roles" icon={<ShieldCheck size={20} />} tone="default" />
        <KpiCard label="System Roles" value={systemRoles} sub="Seeded, protected roles" icon={<Lock size={20} />} tone="info" />
        <KpiCard label="Custom Roles" value={customRoles} sub="Editable, deletable roles" icon={<Copy size={20} />} tone="success" />
        <KpiCard label="Total Permissions" value={totalPermissions} sub="Granular access controls" icon={<MenuIcon size={20} />} tone="warning" />
      </Box>

      <Card sx={{ border: '1px solid #E4E9F2', borderRadius: 2, overflow: 'hidden' }}>
        <CardContent sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              label="Search roles or permissions"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: { xs: '100%', sm: 260 } }}
            />
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {DOMAINS.map((d) => (
                <Chip
                  key={d.value}
                  size="small"
                  label={d.label}
                  onClick={() => setDomainFilter(d.value)}
                  color={domainFilter === d.value ? 'primary' : 'default'}
                  variant={domainFilter === d.value ? 'filled' : 'outlined'}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {SCOPES.map((s) => (
                <Chip
                  key={s}
                  size="small"
                  label={s}
                  onClick={() => setScopeFilter(scopeFilter === s ? '' : s)}
                  color={scopeFilter === s ? 'primary' : 'default'}
                  variant={scopeFilter === s ? 'filled' : 'outlined'}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
            <Button size="small" variant="outlined" startIcon={<RefreshCw size={16} />} onClick={() => void rolesQuery.refetch()} />
          </Stack>

          {rolesQuery.isPending ? (
            <LoadingState label="Loading roles" />
          ) : rolesQuery.isError ? (
            <ErrorState message={rolesQuery.error.message} onRetry={() => void rolesQuery.refetch()} />
          ) : filteredRoles.length === 0 ? (
            <EmptyState title="No roles found" description="Try adjusting the search or filters." />
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell style={{ fontWeight: 600 }}>Role</TableCell>
                  <TableCell style={{ fontWeight: 600, fontFamily: 'monospace' }}>Role Code</TableCell>
                  <TableCell style={{ fontWeight: 600 }}>Domain</TableCell>
                  <TableCell style={{ fontWeight: 600 }}>Scope</TableCell>
                  <TableCell style={{ fontWeight: 600 }}>Permissions</TableCell>
                  <TableCell style={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell align="right" style={{ fontWeight: 600 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((role) => (
                  <TableRow key={role.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} sx={{ color: '#111D32' }}>
                        {role.name}
                      </Typography>
                      <Typography sx={{ fontSize: 11.5, color: '#5A6478' }}>{role.description ?? '—'}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12.5, color: '#5A6478' }}>
                      {role.code}
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={domainOf(role.code)} variant="outlined" color="default" />
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={scopeLabel(role)} variant="outlined" color="default" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{role.permissions.length} granted</Typography>
                      <Typography sx={{ fontSize: 11, color: '#8A93A6' }}>
                        {role.permissions.slice(0, 3).join(', ')}
                        {role.permissions.length > 3 ? '…' : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={role.systemRole ? 'System' : 'Custom'} variant="outlined" color="default" />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} useFlexGap>
                        <Button size="small" variant="text" startIcon={<Pencil size={14} />} onClick={() => openRole(role)} title="Edit permissions" />
                        {!role.systemRole && (
                          <Button
                            size="small"
                            variant="text"
                            startIcon={<Copy size={14} />}
                            onClick={() => {
                              setCreateForm({
                                code: `${role.code}_COPY`,
                                name: `${role.name} (Copy)`,
                                description: role.description ?? '',
                                domain: domainOf(role.code),
                                scope: (scopeLabel(role) as 'Platform' | 'Tenant' | 'Branch'),
                              });
                              setCreatePerms(new Set(role.permissionIds.map((id) => id)));
                              setCreateStep(2);
                              setCreateOpen(true);
                            }}
                            title="Duplicate role"
                          />
                        )}
                        <Button
                          size="small"
                          variant="text"
                          startIcon={<Users size={14} />}
                          onClick={() => {
                            setEditingRole(role);
                            setSelectedPerms(new Set(role.permissionIds));
                            setOriginalPerms(new Set(role.permissionIds));
                            setDirty(false);
                            setDrawerTab('users');
                            setDrawerOpen(true);
                          }}
                          title="View assigned users"
                        />
                        {!role.systemRole && (
                          <Button
                            size="small"
                            variant="text"
                            startIcon={<Trash2 size={14} />}
                            onClick={() => {
                              setConfirmTarget({ id: role.id, roleName: role.name });
                              setConfirmAction('delete-role');
                              setConfirmOpen(true);
                            }}
                            title="Delete role"
                            sx={{ color: '#D32F2F' }}
                          />
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {page * pageSize + 1}-{Math.min((page + 1) * pageSize, filteredRoles.length)} of {filteredRoles.length}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Button size="small" variant="outlined" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                Previous
              </Button>
              <Button
                size="small"
                variant="outlined"
                disabled={(page + 1) * pageSize >= filteredRoles.length}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
              <TextField
                size="small"
                type="number"
                value={pageSize}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v) && v > 0) setPageSize(v);
                }}
                inputProps={{ min: 1, step: 1 }}
                sx={{ width: 60 }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} anchor="right" sx={{ width: { sm: 560, md: 700 } }}>
        <Paper sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid #E4E9F2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {drawerTab === 'permissions' ? 'Manage Permissions' : 'Assigned Users'}
              </Typography>
              <Typography variant="caption" color="text.secondary">{editingRole?.name} ({editingRole?.code})</Typography>
            </Box>
            <Button size="small" variant="text" startIcon={<ArrowLeft size={16} />} onClick={() => setDrawerOpen(false)}>
              Back to roles
            </Button>
          </Box>

          <Tabs value={drawerTab} onChange={(_, v) => setDrawerTab(v as 'permissions' | 'users')} sx={{ flexShrink: 0, borderBottom: '1px solid #E4E9F2' }}>
            <Tab icon={<ShieldCheck size={18} />} label="Permissions" />
            <Tab icon={<Users size={18} />} label="Assigned Users" />
          </Tabs>

          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            {drawerTab === 'permissions' ? (
              <PermissionsMatrix
                permissions={permissions}
                groups={GROUPS}
                selected={selectedPerms}
                dirty={dirty}
                onChange={handlePermChange}
                onSelectGroup={selectGroup}
                onClearAll={clearAll}
                onReset={resetDefaults}
                onSave={() => {
                  setConfirmAction('save-permissions');
                  setConfirmOpen(true);
                }}
                saving={saveRolePerms.isPending}
              />
            ) : (
              <AssignedUsersList
                role={editingRole ?? undefined}
                users={platformApi.usersInRole}
                removeUser={({ userId, roleCode, userName }) => {
                  setConfirmTarget({ userId, roleCode, userName });
                  setConfirmAction('remove-user');
                  setConfirmOpen(true);
                }}
              />
            )}
          </Box>

          {drawerTab === 'permissions' && (
            <Box sx={{ p: 2, borderTop: '1px solid #E4E9F2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexShrink: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip size="small" label={dirty ? 'Unsaved changes' : 'Saved'} color={dirty ? 'warning' : 'default'} />
              </Box>
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined" onClick={() => setDrawerOpen(false)} disabled={saveRolePerms.isPending}>
                  Cancel
                </Button>
                <Button size="small" variant="contained" startIcon={<Save size={16} />} onClick={() => { setConfirmAction('save-permissions'); setConfirmOpen(true); }} disabled={saveRolePerms.isPending || !dirty}>
                  Save Changes
                </Button>
              </Stack>
            </Box>
          )}
        </Paper>
      </Drawer>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Custom Role — Step {createStep} of 3</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {createStep === 1 && (
            <Stack spacing={2}>
              <TextField fullWidth label="Role Name" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
              <TextField
                fullWidth
                label="Role Code"
                value={createForm.code}
                onChange={(e) => setCreateForm({ ...createForm, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })}
              />
              <TextField fullWidth label="Description" value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} />
              <TextField
                fullWidth
                select
                label="Business Domain"
                value={createForm.domain}
                onChange={(e) => setCreateForm({ ...createForm, domain: e.target.value as 'RESTAURANT' | 'ELECTRONICS' | 'VEHICLE' | 'REAL_ESTATE' })}
              >
                {DOMAINS.slice(1).map((d) => (
                  <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                select
                label="Scope"
                value={createForm.scope}
                onChange={(e) => setCreateForm({ ...createForm, scope: e.target.value as 'Platform' | 'Tenant' | 'Branch' })}
              >
                <MenuItem value="Platform">Platform</MenuItem>
                <MenuItem value="Tenant">Tenant</MenuItem>
                <MenuItem value="Branch">Branch</MenuItem>
              </TextField>
              <Alert severity="info">Custom roles are platform-level. Tenant-scoped roles apply within a single tenant.</Alert>
            </Stack>
          )}
          {createStep === 2 && (
            <Stack spacing={2}>
              <Box sx={{ maxHeight: 420, overflow: 'auto', border: '1px solid #E4E9F2', borderRadius: 1, p: 1 }}>
                {GROUPS.map((group) => {
                  const groupPerms = permissions.filter((p) => group.codes.includes(p.code));
                  const grantedCount = groupPerms.filter((p) => createPerms.has(p.id)).length;
                  const allSelected = groupPerms.length > 0 && groupPerms.every((p) => createPerms.has(p.id));
                  return (
                    <Card key={group.key} sx={{ border: '1px solid #E4E9F2', borderRadius: 1, mb: 1 }}>
                      <CardContent sx={{ p: 1.5 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 170 }}>
                            <group.icon size={18} strokeWidth={1.5} />
                            <Typography variant="body2" fontWeight={600}>{group.label}</Typography>
                          </Box>
                          <Checkbox size="small" checked={allSelected} onChange={() => {
                            const next = new Set(createPerms);
                            groupPerms.forEach((p) => (allSelected ? next.delete(p.id) : next.add(p.id)));
                            setCreatePerms(next);
                          }} />
                          <Typography variant="caption" color="text.secondary">{grantedCount} / {groupPerms.length}</Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>{group.description}</Typography>
                        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {groupPerms.map((p) => (
                            <Chip key={p.id} size="small" label={`${p.name} (${actionOf(p.code)})`} color={createPerms.has(p.id) ? 'primary' : 'default'} variant={createPerms.has(p.id) ? 'filled' : 'outlined'} sx={{ cursor: 'pointer', fontSize: 11.5 }} onClick={() => {
                              const next = new Set(createPerms);
                              if (createPerms.has(p.id)) next.delete(p.id);
                              else next.add(p.id);
                              setCreatePerms(next);
                            }} />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            </Stack>
          )}
          {createStep === 3 && (
            <Stack spacing={2}>
              <Typography variant="body2" fontWeight={600}>{createForm.name}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>{createForm.code}</Typography>
              <List>
                {[
                  ['Business domain', createForm.domain],
                  ['Scope', createForm.scope],
                  ['Description', createForm.description ?? '—'],
                  ['Permissions', `${createPerms.size} selected`],
                ].map(([label, value]) => (
                  <ListItem key={label} sx={{ px: 0, py: 0.5, borderBottom: '1px solid #F0F2F5' }}>
                    <ListItemText primary={value} secondary={label} sx={{ px: 0 }} />
                  </ListItem>
                ))}
              </List>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button size="small" variant="outlined" onClick={() => setCreateOpen(false)} disabled={creating}>
            Cancel
          </Button>
          {createStep < 3 && (
            <Button size="small" variant="contained" onClick={() => setCreateStep((s) => ((s + 1) as 1 | 2 | 3))} disabled={creating}>
              Next
            </Button>
          )}
          {createStep === 3 && (
            <Button size="small" variant="contained" onClick={() => createRole.mutate()} disabled={creating || !createForm.name || !createForm.code}>
              {creating ? 'Creating...' : 'Save Role'}
            </Button>
          )}
          {createStep > 1 && (
            <Button size="small" variant="text" onClick={() => setCreateStep((s) => ((s - 1) as 1 | 2 | 3))} disabled={creating}>
              Back
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={catalogOpen} onClose={() => setCatalogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Permission Catalog</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField fullWidth size="small" label="Search permissions" onChange={() => {}} />
          <Box sx={{ mt: 2, maxHeight: 500, overflow: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell style={{ fontWeight: 600 }}>Permission</TableCell>
                  <TableCell style={{ fontWeight: 600, fontFamily: 'monospace' }}>Code</TableCell>
                  <TableCell style={{ fontWeight: 600 }}>Module</TableCell>
                  <TableCell style={{ fontWeight: 600 }}>Domain</TableCell>
                  <TableCell style={{ fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {permissions
                  .slice()
                  .sort((a, b) => a.code.localeCompare(b.code))
                  .map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.name}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{p.code}</TableCell>
                      <TableCell>{actionOf(p.code)}</TableCell>
                      <TableCell>{domainOf(p.code)}</TableCell>
                      <TableCell><Chip size="small" label="Active" color="success" /></TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button size="small" variant="outlined" onClick={() => setCatalogOpen(false)}>Done</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={auditOpen} onClose={() => setAuditOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Audit History — Role & Permission Changes</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {auditLoading ? (
            <LoadingState label="Loading audit log" />
          ) : auditLogs.length === 0 ? (
            <EmptyState title="No audit events" description="Role and permission changes appear here." />
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell style={{ fontWeight: 600 }}>Date / Time</TableCell>
                  <TableCell style={{ fontWeight: 600 }}>Actor</TableCell>
                  <TableCell style={{ fontWeight: 600 }}>Action</TableCell>
                  <TableCell style={{ fontWeight: 600 }}>Role</TableCell>
                  <TableCell style={{ fontWeight: 600 }}>Detail</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.createdAt}</TableCell>
                    <TableCell>{log.actorEmail ?? 'system'}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>{log.entityId ?? '-'}</TableCell>
                    <TableCell>{log.newValue ?? log.oldValue ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button size="small" variant="outlined" onClick={() => setAuditOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

        <ConfirmDialog
        open={confirmOpen}
        title={
          confirmAction === 'delete-role'
            ? `Soft-delete role "${confirmTarget?.roleName}"?`
            : confirmAction === 'save-permissions'
              ? 'Save permission changes?'
              : `Remove user from role "${confirmTarget?.roleCode}"?`
        }
        description={
          confirmAction === 'delete-role'
            ? `This will mark "${confirmTarget?.roleName}" as deleted (isDelete). It will no longer be assignable to new users. Existing users keep their role until reassigned.`
            : confirmAction === 'save-permissions'
              ? `Saving will apply the permission changes to "${editingRole?.name}" for all users with this role.`
              : `Remove "${confirmTarget?.userName}" from the role "${confirmTarget?.roleCode}"?`
        }
        confirmLabel={
          confirmAction === 'delete-role'
            ? 'Soft-delete'
            : confirmAction === 'save-permissions'
              ? 'Save Changes'
              : 'Remove'
        }
        cancelLabel="Cancel"
        destructive={confirmAction === 'delete-role'}
        loading={deleteRole.isPending || removeRole.isPending || saveRolePerms.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
}

interface PermissionsMatrixProps {
  permissions: PermissionView[];
  groups: readonly GroupDef[];
  selected: Set<number>;
  dirty: boolean;
  onChange: (id: number, checked: boolean) => void;
  onSelectGroup: (group: GroupDef, checked: boolean) => void;
  onClearAll: () => void;
  onReset: () => void;
  onSave: () => void;
  saving: boolean;
}

function PermissionsMatrix({
  permissions,
  groups,
  selected,
  dirty,
  onChange,
  onSelectGroup,
  onClearAll,
  onReset,
  onSave,
  saving,
}: PermissionsMatrixProps) {
  return (
    <Card sx={{ border: '1px solid #E4E9F2', borderRadius: 2, overflow: 'hidden' }}>
      <CardContent sx={{ p: 2 }}>
        <Alert severity="warning" variant="outlined" sx={{ mb: 2 }}>
          Changing permissions immediately affects what users with this role can do. Save to apply the changes.
        </Alert>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Button size="small" variant="outlined" onClick={onClearAll} disabled={saving}>
            Clear All
          </Button>
          <Button size="small" variant="outlined" onClick={onReset} disabled={saving || !dirty}>
            Reset to Default
          </Button>
          <Button size="small" variant="contained" startIcon={<Save size={16} />} onClick={onSave} disabled={saving || !dirty}>
            Save Changes
          </Button>
        </Box>
        {groups.map((group) => {
          const groupPerms = permissions.filter((p) => group.codes.includes(p.code));
          const granted = groupPerms.filter((p) => selected.has(p.id));
          const allSelected = groupPerms.length > 0 && granted.length === groupPerms.length;
          return (
            <Card key={group.key} sx={{ border: '1px solid #E4E9F2', borderRadius: 1, mb: 1.5, overflow: 'hidden' }}>
              <CardContent sx={{ p: 1.5 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 170 }}>
                    <group.icon size={18} strokeWidth={1.5} />
                    <Typography variant="body2" fontWeight={600}>{group.label}</Typography>
                  </Box>
                  <Checkbox size="small" checked={allSelected} onChange={() => onSelectGroup(group, !allSelected)} />
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    {granted.length} / {groupPerms.length} granted
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{group.domain}</Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                  {group.description}
                </Typography>
                <Box sx={{ display: 'grid', gap: 0.75, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' } }}>
                  {groupPerms.map((p) => {
                    const checked = selected.has(p.id);
                    return (
                      <FormControlLabel
                        key={p.id}
                        control={
                            <Checkbox
                              size="small"
                              checked={checked}
                              onChange={(e) => onChange(p.id, e.target.checked)}
                              sx={{ ml: 0 }}
                            />
                        }
                        label={
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                            <Typography variant="body2" fontWeight={500} sx={{ color: checked ? '#111D32' : '#5A6478' }}>
                              {p.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#8A93A6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {actionOf(p.code)}
                            </Typography>
                          </Box>
                        }
                      />
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}

interface AssignedUsersListProps {
  role: RoleView | undefined;
  users: (id: number) => Promise<UserView[]>;
  removeUser: (vars: { userId: number; roleCode: string; userName: string }) => void;
}

function AssignedUsersList({ role, users, removeUser }: AssignedUsersListProps) {
  const [userList, setUserList] = useState<UserView[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!role) return;
    setLoading(true);
    users(role.id)
      .then((data) => setUserList(data))
      .catch(() => setUserList([]))
      .finally(() => setLoading(false));
  }, [role, users]);

  return (
    <Card sx={{ border: '1px solid #E4E9F2', borderRadius: 2, overflow: 'hidden' }}>
      <CardContent sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="body2" fontWeight={600}>Users assigned to {role?.name}</Typography>
          {loading ? (
            <LoadingState />
          ) : userList.length === 0 ? (
            <EmptyState title="No users assigned" description="Assign users to grant them this role." />
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell style={{ fontWeight: 600 }}>User</TableCell>
                  <TableCell style={{ fontWeight: 600 }}>Email</TableCell>
                  <TableCell style={{ fontWeight: 600 }}>Tenant</TableCell>
                  <TableCell style={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell align="right" style={{ fontWeight: 600 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userList.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{u.firstName} {u.lastName}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12.5, color: '#5A6478' }}>{u.email}</TableCell>
                    <TableCell sx={{ fontSize: 12.5, color: '#5A6478' }}>{u.tenantName ?? '-'}</TableCell>
                    <TableCell><Chip size="small" label={u.status} variant="outlined" color="default" /></TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="text" startIcon={<Trash2 size={14} />} onClick={() => removeUser({ userId: u.id, roleCode: role!.code, userName: u.firstName + ' ' + u.lastName })} sx={{ color: '#D32F2F' }}>
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
