import { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Popover,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Bell,
  ChevronsLeft,
  ChevronsRight,
  Info,
  LogOut,
  Menu as MenuIcon,
  Search,
  Settings,
  User,
} from 'lucide-react';
import { APP_NAMES } from '@resto/config';
import { ConfirmDialog } from '@resto/ui';
import { useAuth } from '@/auth/AuthContext';
import { platformApi, tenantApi } from '@/api';
import { NAVY, ORANGE } from '@/theme';
import { navGroups, type NavItem } from './nav';
import type { TenantSummary } from '@resto/types';
export interface ShellScope {
  scope: TenantSummary | null;
  setScope: (tenant: TenantSummary | null) => void;
}
const EXPANDED = 256;
const COLLAPSED = 68;
function SidebarContent({
  collapsed,
  mobile,
  onNavigate,
}: {
  collapsed: boolean;
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.25}
        sx={{ px: collapsed && !mobile ? 1.75 : 2.5, py: 2.5, minHeight: 72 }}
      >
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 2,
            bgcolor: ORANGE,
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 800,
            fontSize: 17,
            flexShrink: 0,
          }}
        >
          R
        </Box>
        {(!collapsed || mobile) && (
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
              {APP_NAMES.superAdmin}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600 }}>
              Platform Admin
            </Typography>
          </Box>
        )}
      </Stack>
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: collapsed && !mobile ? 1 : 1.5,
          pb: 2,
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {navGroups.map((group) => (
          <Box key={group.title} sx={{ mb: 1.5 }}>
            {(!collapsed || mobile) && (
              <Typography
                sx={{
                  px: 1.5,
                  py: 0.75,
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                {group.title}
              </Typography>
            )}
            <List dense disablePadding>
              {group.items.map((item: NavItem) => {
                const active = item.end
                  ? location.pathname === item.to
                  : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
                const Icon = item.icon;
                const button = (
                  <ListItemButton
                    component={NavLink}
                    to={item.to}
                    onClick={onNavigate}
                    selected={active}
                    sx={{
                      borderRadius: 2,
                      mb: 0.25,
                      minHeight: 40,
                      color: active ? '#fff' : 'rgba(255,255,255,0.72)',
                      justifyContent: collapsed && !mobile ? 'center' : 'flex-start',
                      px: collapsed && !mobile ? 0 : 1.5,
                      '&.Mui-selected': { bgcolor: 'rgba(255,87,34,0.16)', color: '#fff' },
                      '&.Mui-selected:hover': { bgcolor: 'rgba(255,87,34,0.22)' },
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.07)' },
                      '& .MuiListItemIcon-root': {
                        minWidth: 0,
                        mr: collapsed && !mobile ? 0 : 1.5,
                        color: active ? ORANGE : 'inherit',
                        justifyContent: 'center',
                      },
                    }}
                  >
                    <ListItemIcon>
                      <Icon size={18} />
                    </ListItemIcon>
                    {(!collapsed || mobile) && (
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{ fontSize: 13.5, fontWeight: active ? 700 : 500 }}
                      />
                    )}
                  </ListItemButton>
                );
                return collapsed && !mobile ? (
                  <Tooltip key={item.to} title={item.label} placement="right">
                    {button}
                  </Tooltip>
                ) : (
                  <Box key={item.to}>{button}</Box>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>
      <Box sx={{ p: 1.25, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <Typography sx={{ px: 1, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
          {collapsed && !mobile ? 'v1' : 'Resto SaaS · v1'}
        </Typography>
      </Box>
    </Box>
  );
}
function GlobalSearch({ onPick }: { onPick: (tenant: TenantSummary) => void }) {
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const search = useQuery({
    queryKey: ['tenants', 'search', term],
    queryFn: () => tenantApi.list({ page: 0, size: 5, search: term }),
    enabled: term.trim().length >= 2,
  });
  const items = search.data?.content ?? [];
  return (
    <Box sx={{ position: 'relative', width: 260, display: { xs: 'none', md: 'block' } }}>
      <TextField
        size="small"
        fullWidth
        placeholder="Search tenants…"
        value={term}
        onChange={(event) => {
          setTerm(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search size={16} color="#5A6478" />
              </InputAdornment>
            ),
          },
        }}
      />
      {open && term.trim().length >= 2 && (
        <Box
          sx={{
            position: 'absolute',
            top: 44,
            left: 0,
            right: 0,
            zIndex: 1300,
            bgcolor: '#fff',
            border: '1px solid #E4E9F2',
            borderRadius: 2,
            boxShadow: '0 12px 32px rgba(17,29,50,0.12)',
            p: 1,
          }}
        >
          {search.isFetching && items.length === 0 ? (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 1 }}>
              <CircularProgress size={14} />
              <Typography variant="body2" color="text.secondary">
                Searching…
              </Typography>
            </Stack>
          ) : items.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
              No tenants found.
            </Typography>
          ) : (
            items.map((tenant) => (
              <ListItemButton
                key={tenant.id}
                onMouseDown={(event) => {
                  event.preventDefault();
                  onPick(tenant);
                  setTerm('');
                  setOpen(false);
                }}
                sx={{ borderRadius: 1.5 }}
              >
                <ListItemText
                  primary={tenant.name}
                  secondary={`/${tenant.slug} · ${tenant.status}`}
                  primaryTypographyProps={{ fontSize: 13.5, fontWeight: 600 }}
                  secondaryTypographyProps={{ fontSize: 11.5 }}
                />
              </ListItemButton>
            ))
          )}
        </Box>
      )}
    </Box>
  );
}
function Breadcrumbs() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  const crumbs: { label: string }[] = [];
  if (parts.length === 0) {
    crumbs.push({ label: 'Dashboard' });
  } else {
    crumbs.push({ label: 'Dashboard' });
    const map: Record<string, string> = {};
    navGroups.forEach((group) =>
      group.items.forEach((item) => {
        map[item.to.replace(/^\//, '')] = item.label;
      }),
    );
    parts.forEach((part, index) => {
      const key = parts.slice(0, index + 1).join('/');
      if (map[key]) crumbs.push({ label: map[key] });
      else if (index === 0 && key === 'tenants') crumbs.push({ label: 'Tenants' });
      else if (index === 0 && key === 'profile') crumbs.push({ label: 'My Profile' });
      else crumbs.push({ label: index === parts.length - 1 ? 'Details' : part });
    });
  }
  return (
    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
      {crumbs.map((crumb, index) => (
        <Stack key={`${crumb.label}-${index}`} direction="row" spacing={0.75} alignItems="center">
          {index > 0 && <Typography sx={{ color: '#9AA3B5', fontSize: 13 }}>/</Typography>}
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: index === crumbs.length - 1 ? 700 : 500,
              color: index === crumbs.length - 1 ? NAVY : '#5A6478',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {crumb.label}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}
export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scope, setScope] = useState<TenantSummary | null>(null);
  const [notifAnchor, setNotifAnchor] = useState<HTMLElement | null>(null);
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [notifPage, setNotifPage] = useState(0);
  const scopeTenants = useQuery({
    queryKey: ['tenants', 'scope-list'],
    queryFn: () => tenantApi.list({ page: 0, size: 100, sort: 'name', direction: 'asc' }),
    staleTime: 5 * 60_000,
  });
  const queryClient = useQueryClient();
  const unreadNotifs = useQuery({
    queryKey: ['sa-notifications', 'unread-count'],
    queryFn: () => platformApi.notifications({ unreadOnly: true, size: 1 }),
    refetchInterval: 30_000,
  });
  const notifPageData = useQuery({
    queryKey: ['sa-notifications', 'popover', notifPage],
    queryFn: () => platformApi.notifications({ page: notifPage, size: 5 }),
    enabled: Boolean(notifAnchor),
  });
  const markRead = useMutation({
    mutationFn: (id: number) => platformApi.markNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sa-notifications'] });
    },
  });
  const markAllRead = useMutation({
    mutationFn: async () => {
      const list = await platformApi.notifications({ unreadOnly: true, size: 50 });
      await Promise.all(list.content.map((n) => platformApi.markNotificationRead(n.id)));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sa-notifications'] });
    },
  });
  const unreadCount = unreadNotifs.data?.page.totalElements ?? 0;
  const shell: ShellScope = useMemo(() => ({ scope, setScope }), [scope]);
  const width = collapsed ? COLLAPSED : EXPANDED;
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box
        component="nav"
        sx={{
          width,
          flexShrink: 0,
          display: { xs: 'none', md: 'block' },
          position: 'fixed',
          inset: 0,
          right: 'auto',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: NAVY,
          borderRight: '1px solid rgba(255,255,255,0.06)',
          transition: 'width 0.2s ease',
        }}
      >
        <SidebarContent collapsed={collapsed} />
        <IconButton
          onClick={() => setCollapsed((value) => !value)}
          size="small"
          sx={{
            position: 'absolute',
            top: 80,
            right: -12,
            bgcolor: '#fff',
            border: '1px solid #E4E9F2',
            width: 24,
            height: 24,
            '&:hover': { bgcolor: '#fff' },
            zIndex: 2,
          }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
        </IconButton>
      </Box>
      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        variant="temporary"
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: EXPANDED, boxSizing: 'border-box' },
        }}
      >
        <SidebarContent collapsed={false} mobile onNavigate={() => setMobileOpen(false)} />
      </Drawer>
      <Box
        component="header"
        sx={{
          position: 'fixed',
          top: 0,
          left: { xs: 0, md: `${width}px` },
          right: 0,
          height: 64,
          bgcolor: '#fff',
          borderBottom: '1px solid #E4E9F2',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: { xs: 1.5, md: 3 },
          zIndex: (theme) => theme.zIndex.appBar,
          transition: 'left 0.2s ease',
        }}
      >
        <IconButton
          size="small"
          onClick={() => setMobileOpen(true)}
          sx={{ display: { xs: 'inline-flex', md: 'none' } }}
          aria-label="Open menu"
        >
          <MenuIcon size={20} />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0, display: { xs: 'none', sm: 'block' } }}>
          <Breadcrumbs />
        </Box>
        <GlobalSearch
          onPick={(tenant) => {
            setScope(tenant);
            navigate(`/tenants/${tenant.id}`);
          }}
        />
        <Select
          size="small"
          value={scope ? String(scope.id) : 'all'}
          onChange={(event) => {
            const value = event.target.value;
            if (value === 'all') setScope(null);
            else {
              const tenant =
                scopeTenants.data?.content.find((item) => String(item.id) === value) ?? null;
              setScope(tenant);
            }
          }}
          sx={{ minWidth: 150, maxWidth: 200, fontSize: 13, display: { xs: 'none', lg: 'flex' } }}
          renderValue={(value) => (value === 'all' ? 'All tenants' : (scope?.name ?? 'Selected'))}
          aria-label="Tenant scope"
        >
          <MenuItem value="all">All tenants</MenuItem>
          {(scopeTenants.data?.content ?? []).map((tenant) => (
            <MenuItem key={tenant.id} value={String(tenant.id)}>
              {tenant.name}
            </MenuItem>
          ))}
        </Select>
        <Tooltip title="Notifications">
          <IconButton
            size="small"
            onClick={(event) => setNotifAnchor(event.currentTarget)}
            aria-label={`Notifications (${unreadCount} unread)`}
          >
            <Badge badgeContent={unreadCount} color="error" max={99}>
              <Bell size={18} />
            </Badge>
          </IconButton>
        </Tooltip>
        <IconButton
          size="small"
          onClick={(event) => setProfileAnchor(event.currentTarget)}
          aria-label="Profile menu"
        >
          <Avatar sx={{ width: 32, height: 32, bgcolor: NAVY, fontSize: 13 }}>
            {user?.firstName?.charAt(0).toUpperCase() ?? 'A'}
          </Avatar>
        </IconButton>
      </Box>
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          pt: '64px',
          ml: { xs: 0, md: `${width}px` },
          transition: 'margin-left 0.2s ease',
        }}
      >
        <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2.5, md: 3.5 }, maxWidth: 1440, mx: 'auto' }}>
          <Outlet context={shell} />
        </Box>
      </Box>
      <Popover
        open={Boolean(notifAnchor)}
        anchorEl={notifAnchor}
        onClose={() => setNotifAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ p: 2, width: 340 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1" fontWeight={700}>
              Notifications
            </Typography>
            {unreadCount > 0 ? (
              <Button
                size="small"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
              >
                Mark all read
              </Button>
            ) : null}
          </Stack>
          <Divider sx={{ my: 1 }} />
          {notifPageData.isPending ? (
            <Stack alignItems="center" sx={{ py: 2 }}>
              <CircularProgress size={22} />
            </Stack>
          ) : notifPageData.isError ? (
            <Typography variant="body2" color="error" sx={{ py: 1 }}>
              Failed to load notifications.
            </Typography>
          ) : (notifPageData.data?.content ?? []).length === 0 ? (
            <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ py: 1 }}>
              <Info size={16} color="#5A6478" style={{ flexShrink: 0, marginTop: 2 }} />
              <Typography variant="body2" color="text.secondary">
                No notifications.
              </Typography>
            </Stack>
          ) : (
            <Stack divider={<Divider />} sx={{ maxHeight: 320, overflowY: 'auto' }}>
              {(notifPageData.data?.content ?? []).map((notif) => (
                <Stack key={notif.id} spacing={0.5} sx={{ py: 1.25 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.3 }}>
                    {notif.subject ?? notif.templateCode ?? `Notification #${notif.id}`}
                  </Typography>
                  {notif.body ? (
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3 }}>
                      {notif.body}
                    </Typography>
                  ) : null}
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ fontSize: 10.5, color: '#9AA3B5' }}>
                      {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : ''}
                    </Typography>
                    {notif.readAt ? (
                      <Chip
                        size="small"
                        label="Read"
                        variant="outlined"
                        sx={{ height: 18, fontSize: 10 }}
                      />
                    ) : (
                      <Button
                        size="small"
                        sx={{ py: 0, fontSize: 11 }}
                        onClick={() => markRead.mutate(notif.id)}
                        disabled={markRead.isPending}
                      >
                        Mark read
                      </Button>
                    )}
                  </Stack>
                </Stack>
              ))}
            </Stack>
          )}
          <Divider sx={{ my: 1 }} />
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Button
              size="small"
              disabled={notifPage === 0}
              onClick={() => setNotifPage((p) => Math.max(0, p - 1))}
            >
              Prev
            </Button>
            <Button
              size="small"
              disabled={(notifPageData.data?.content.length ?? 0) < 5}
              onClick={() => setNotifPage((p) => p + 1)}
            >
              Next
            </Button>
            <Button
              size="small"
              onClick={() => {
                setNotifAnchor(null);
                navigate('/notifications');
              }}
            >
              View all
            </Button>
          </Stack>
        </Box>
      </Popover>
      <Menu
        anchorEl={profileAnchor}
        open={Boolean(profileAnchor)}
        onClose={() => setProfileAnchor(null)}
        slotProps={{ paper: { sx: { mt: 1, minWidth: 220 } } }}
      >
        <Box sx={{ px: 2, py: 1.25 }}>
          <Typography variant="subtitle2">
            {user ? `${user.firstName} ${user.lastName}` : 'Admin'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.email}
          </Typography>
          <Box sx={{ mt: 0.75 }}>
            <Chip
              size="small"
              label={(user?.roles ?? []).join(', ') || 'SUPER_ADMIN'}
              color="primary"
              variant="outlined"
            />
          </Box>
        </Box>
        <Divider />
        <MenuItem
          onClick={() => {
            setProfileAnchor(null);
            navigate('/profile');
          }}
        >
          <ListItemIcon>
            <User size={16} />
          </ListItemIcon>
          My Profile
        </MenuItem>
        <MenuItem
          onClick={() => {
            setProfileAnchor(null);
            navigate('/settings');
          }}
        >
          <ListItemIcon>
            <Settings size={16} />
          </ListItemIcon>
          Settings
        </MenuItem>
        <MenuItem
          onClick={() => {
            setProfileAnchor(null);
            setSignOutOpen(true);
          }}
        >
          <ListItemIcon>
            <LogOut size={16} />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>
      <ConfirmDialog
        open={signOutOpen}
        title="Sign out?"
        description="You will need to sign in again to access the platform."
        confirmLabel="Sign out"
        destructive
        loading={signingOut}
        onCancel={() => setSignOutOpen(false)}
        onConfirm={() => {
          setSigningOut(true);
          void (async () => {
            await logout();
            navigate('/login', { replace: true });
          })();
        }}
      />
    </Box>
  );
}
