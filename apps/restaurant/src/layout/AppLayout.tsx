import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  BarChart3,
  Bell,
  CalendarDays,
  ChevronLeft,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  MessageSquare,
  Store,
  Table2,
  User,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useCan } from '@/auth/useCan';
import { ConfirmDialog } from '@resto/ui';
import { useRestaurant } from '@/context/RestaurantContext';
import { openOrdersCount, useLiveOrders } from '@/hooks/useDashboardData';
import { HeaderFiltersProvider, useHeaderFilters } from './HeaderFilters';
import { accessFor } from './navAccess';

const SIDEBAR_WIDTH = 256;
const SIDEBAR_COLLAPSED = 76;

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end: boolean;
}

function navItemsFor(businessType: string | undefined): NavItem[] {
  const isRestaurant = (businessType || 'RESTAURANT') === 'RESTAURANT';
  const items: NavItem[] = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/orders', label: 'Orders', icon: ClipboardList, end: false },
    {
      to: '/menu',
      label: isRestaurant ? 'Menu' : 'Products',
      icon: UtensilsCrossed,
      end: false,
    },
    { to: '/inquiries', label: 'Enquiries', icon: MessageSquare, end: false },
  ];
  if (isRestaurant) {
    items.splice(4, 0, { to: '/tables', label: 'Tables & QR', icon: Table2, end: false });
  }
  items.push(
    { to: '/employees', label: 'Employees', icon: Users, end: false },
    { to: '/reports', label: 'Reports', icon: BarChart3, end: false },
    { to: '/branches', label: 'Branches', icon: Store, end: false },
  );
  return items;
}

function breadcrumbLabelsFor(businessType: string | undefined): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const item of navItemsFor(businessType)) {
    labels[item.to] = item.label;
  }
  labels['/profile'] = 'Restaurant Profile';
  return labels;
}

const dateRangeOptions = [
  { value: 1, label: 'Today' },
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
];

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function SidebarContent({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { profile, branches, activeBranchId, setActiveBranchId } = useRestaurant();
  const { can } = useCan();
  const navItems = navItemsFor(profile?.businessType).filter((item) => {
    const access = accessFor(item.to);
    return !access || can(access.read);
  });
  const liveOrders = useLiveOrders();
  const pendingBadge = liveOrders.data ? openOrdersCount(liveOrders.data.content) : 0;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: '#152033',
        color: '#E8ECF3',
        overflowX: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: collapsed ? 2 : 2.5, py: 2.5 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            bgcolor: '#F4511E',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <UtensilsCrossed size={18} color="#ffffff" />
        </Box>
        {!collapsed ? (
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2, color: '#ffffff' }}>
              Resto Manager
            </Typography>
            <Typography sx={{ fontSize: 12, color: '#8896AB', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile?.name ?? 'Restaurant OS'}
            </Typography>
          </Box>
        ) : null}
      </Box>

      {!collapsed ? (
        <Box sx={{ px: 2, pb: 2 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#8896AB', mb: 0.75 }}>
            Current branch
          </Typography>
          <Select
            fullWidth
            displayEmpty
            size="small"
            value={activeBranchId ?? ''}
            onChange={(event) => setActiveBranchId(Number(event.target.value))}
            sx={{
              color: '#ffffff',
              fontSize: 13,
              bgcolor: 'rgba(255,255,255,0.06)',
              borderRadius: '10px',
              '.MuiSelect-select': { py: 1 },
              '.MuiOutlinedInput-notchedOutline': { border: '1px solid rgba(255,255,255,0.12)' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#F4511E' },
            }}
            MenuProps={{
              PaperProps: { sx: { bgcolor: '#ffffff' } },
            }}
          >
            {branches.length === 0 ? <MenuItem value="">No branches</MenuItem> : null}
            {branches.map((branch) => (
              <MenuItem key={branch.id} value={branch.id}>
                {branch.name}
              </MenuItem>
            ))}
          </Select>
        </Box>
      ) : null}

      <List sx={{ px: collapsed ? 1 : 1.5, py: 1, flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const button = (
            <ListItemButton
              component={NavLink}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              sx={{
                borderRadius: '10px',
                mb: 0.5,
                minHeight: 44,
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: collapsed ? 1 : 1.5,
                color: '#C6CFDC',
                '&.active': {
                  bgcolor: '#F4511E',
                  color: '#ffffff',
                  '& .MuiListItemIcon-root': { color: '#ffffff' },
                },
                '&:hover': { bgcolor: 'rgba(255,255,255,0.07)', color: '#ffffff' },
              }}
            >
              <ListItemIcon sx={{ minWidth: collapsed ? 0 : 32, color: 'inherit', justifyContent: 'center' }}>
                {item.label === 'Orders' && pendingBadge > 0 ? (
                  <Badge
                    badgeContent={pendingBadge > 99 ? '99+' : pendingBadge}
                    color="primary"
                    sx={{ '& .MuiBadge-badge': { fontWeight: 700, fontSize: 10, minWidth: 16, height: 16 } }}
                  >
                    <Icon size={19} />
                  </Badge>
                ) : (
                  <Icon size={19} />
                )}
              </ListItemIcon>
              {!collapsed ? <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} /> : null}
            </ListItemButton>
          );
          return collapsed ? (
            <Tooltip key={item.to} title={item.label} placement="right">
              {button}
            </Tooltip>
          ) : (
            <Box key={item.to}>{button}</Box>
          );
        })}
      </List>

      {!collapsed ? (
        <Box sx={{ px: 2.5, pb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <UtensilsCrossed size={14} color="#F4511E" />
          <Typography sx={{ fontSize: 11.5, color: '#8896AB', lineHeight: 1.4 }}>
            Crafted with care for great kitchens
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
}

function BranchHeaderSelect() {
  const { branches, activeBranchId, setActiveBranchId } = useRestaurant();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  if (!isDesktop || branches.length === 0) return null;
  return (
    <Select
      value={activeBranchId ?? ''}
      onChange={(event) => setActiveBranchId(Number(event.target.value))}
      sx={{ minWidth: 160, fontSize: 13 }}
      aria-label="Branch"
    >
      {branches.map((branch) => (
        <MenuItem key={branch.id} value={branch.id}>
          {branch.name}
        </MenuItem>
      ))}
    </Select>
  );
}

function DashboardHeader({
  onOpenMenu,
  collapsed,
  onToggleCollapse,
}: {
  onOpenMenu: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const { user, logout } = useAuth();
  const { profile } = useRestaurant();
  const { days, setDays } = useHeaderFilters();
  const navigate = useNavigate();
  const location = useLocation();
  const [notificationsAnchor, setNotificationsAnchor] = useState<HTMLElement | null>(null);
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);

  const pageName =
    breadcrumbLabelsFor(profile?.businessType)[location.pathname] ??
    (location.pathname.startsWith('/t/') ? 'Table' : 'Dashboard');
  const hour = new Date().getHours();
  const greeting = greetingForHour(hour);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        zIndex: (currentTheme) => currentTheme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ gap: { xs: 1, sm: 2 }, minHeight: { xs: 60, md: 64 }, px: { xs: 1.5, md: 3 } }}>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="Open navigation"
          onClick={onOpenMenu}
          sx={{ display: { md: 'none' } }}
        >
          <MenuIcon size={20} />
        </IconButton>
        <IconButton
          color="inherit"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={onToggleCollapse}
          sx={{ display: { xs: 'none', md: 'inline-flex' } }}
        >
          {collapsed ? <MenuIcon size={19} /> : <ChevronLeft size={19} />}
        </IconButton>

        <Box sx={{ minWidth: 0, display: { xs: 'none', sm: 'block' } }}>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.2 }}>
            {profile?.name ? `${profile.name} · ` : ''}
            {pageName}
          </Typography>
          <Typography variant="h4" sx={{ fontSize: { xs: 15, md: 17 }, lineHeight: 1.3 }}>
            {greeting}, {user?.firstName ?? 'there'}
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1.5 } }}>
          <BranchHeaderSelect />

          <Tooltip title="Date range">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, border: '1px solid', borderColor: 'divider', borderRadius: '10px', px: { xs: 0.75, sm: 1 }, py: 0.25 }}>
              <CalendarDays size={15} color="#718096" />
              <Select
                value={days}
                onChange={(event) => setDays(Number(event.target.value))}
                variant="standard"
                disableUnderline
                inputProps={{ 'aria-label': 'Date range' }}
                sx={{ fontSize: 13, fontWeight: 600, pr: '0 !important', '.MuiSelect-icon': { display: 'none' } }}
              >
                {dateRangeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          </Tooltip>

          <Tooltip title="Notifications">
            <IconButton
              color="inherit"
              aria-label="Notifications"
              onClick={(event) => setNotificationsAnchor(event.currentTarget)}
            >
              <Bell size={19} />
            </IconButton>
          </Tooltip>

          <IconButton
            color="inherit"
            aria-label="Profile menu"
            onClick={(event) => setProfileAnchor(event.currentTarget)}
            sx={{ ml: { xs: 0, sm: 0.25 } }}
          >
            <Avatar sx={{ width: 34, height: 34, bgcolor: '#152033', fontSize: 14, fontWeight: 700 }}>
              {(user?.firstName?.charAt(0) ?? 'R').toUpperCase()}
            </Avatar>
          </IconButton>
        </Box>

        <Menu
          anchorEl={notificationsAnchor}
          open={notificationsAnchor !== null}
          onClose={() => setNotificationsAnchor(null)}
          slotProps={{ paper: { sx: { minWidth: 260, mt: 1, borderRadius: '12px', border: '1px solid', borderColor: 'divider' } } }}
        >
          <Box sx={{ px: 2, py: 1.25 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Notifications</Typography>
            <Typography sx={{ fontSize: 13, color: 'text.secondary', py: 1.5 }}>
              No new notifications right now.
            </Typography>
          </Box>
        </Menu>

        <Menu
          anchorEl={profileAnchor}
          open={profileAnchor !== null}
          onClose={() => setProfileAnchor(null)}
          slotProps={{ paper: { sx: { minWidth: 240, mt: 1, borderRadius: '12px', border: '1px solid', borderColor: 'divider' } } }}
        >
          <Box sx={{ px: 2, py: 1.5, display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Avatar sx={{ width: 40, height: 40, bgcolor: '#152033', fontSize: 16, fontWeight: 700 }}>
              {(user?.firstName?.charAt(0) ?? 'R').toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>
                {user ? `${user.firstName} ${user.lastName}` : 'Signed in'}
              </Typography>
              <Typography sx={{ fontSize: 12, color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email}
              </Typography>
              <Typography sx={{ fontSize: 11, color: 'text.secondary', textTransform: 'capitalize' }}>
                {user?.roles?.[0]?.toLowerCase().replace(/_/g, ' ') ?? 'staff'}
              </Typography>
            </Box>
          </Box>
          <Divider />
          <MenuItem
            onClick={() => {
              setProfileAnchor(null);
              navigate('/profile');
            }}
            sx={{ gap: 1.5, fontSize: 14, fontWeight: 600 }}
          >
            <User size={17} />
            Restaurant Profile
          </MenuItem>
          <MenuItem
            onClick={() => {
              setProfileAnchor(null);
              setSignOutOpen(true);
            }}
            sx={{ gap: 1.5, fontSize: 14, fontWeight: 600 }}
          >
            <LogOut size={17} />
            Sign out
          </MenuItem>
        </Menu>

        <ConfirmDialog
          open={signOutOpen}
          title="Sign out?"
          description="You will be signed out of Resto Manager on this device."
          confirmLabel="Sign out"
          cancelLabel="Cancel"
          destructive
          loading={signingOut}
          onCancel={() => setSignOutOpen(false)}
          onConfirm={async () => {
            setSigningOut(true);
            try {
              await logout();
              navigate('/login', { replace: true });
            } finally {
              setSigningOut(false);
              setSignOutOpen(false);
            }
          }}
        />
      </Toolbar>
    </AppBar>
  );
}

export function AppLayout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH;

  return (
    <HeaderFiltersProvider>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <Box
          component="nav"
          sx={{ width: { md: sidebarWidth }, flexShrink: 0, display: { xs: 'none', md: 'block' } }}
          aria-label="Main navigation"
        >
          <Drawer
            variant="permanent"
            sx={{
              width: sidebarWidth,
              '& .MuiDrawer-paper': {
                width: sidebarWidth,
                boxSizing: 'border-box',
                border: 'none',
                transition: 'width 0.2s ease',
                overflowX: 'hidden',
              },
            }}
          >
            <SidebarContent collapsed={collapsed} />
          </Drawer>
        </Box>

        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, boxSizing: 'border-box', border: 'none' },
          }}
        >
          <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </Drawer>

        <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <DashboardHeader
            onOpenMenu={() => setMobileOpen(true)}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((value) => !value)}
          />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              width: '100%',
              maxWidth: isDesktop ? 1440 : '100%',
              mx: 'auto',
              px: { xs: 1.5, sm: 2.5, lg: 3 },
              py: { xs: 2, md: 3 },
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Box>
    </HeaderFiltersProvider>
  );
}
