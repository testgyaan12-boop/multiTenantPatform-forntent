import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Bell,
  CreditCard,
  Flag,
  GitBranch,
  LayoutDashboard,
  LifeBuoy,
  Puzzle,
  Receipt,
  ScrollText,
  Settings,
  ShieldCheck,
  Store,
  Tags,
  TicketPercent,
  TrendingUp,
  Upload,
  UserCheck,
  Users,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    title: 'Tenant Management',
    items: [
      { to: '/tenants', label: 'Tenants', icon: Store },
      { to: '/branches', label: 'Branches', icon: GitBranch },
      { to: '/onboarding', label: 'Onboarding Requests', icon: UserCheck },
    ],
  },
  {
    title: 'Commercial',
    items: [
      { to: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
      { to: '/plans', label: 'Plans & Pricing', icon: Tags },
      { to: '/invoices', label: 'Invoices & Payments', icon: Receipt },
      { to: '/coupons', label: 'Coupons & Promotions', icon: TicketPercent },
    ],
  },
  {
    title: 'User & Access',
    items: [
      { to: '/users', label: 'Users', icon: Users },
      { to: '/roles', label: 'Roles & Permissions', icon: ShieldCheck },
    ],
  },
  {
    title: 'Monitoring & Analytics',
    items: [
      { to: '/reports', label: 'Platform Reports', icon: TrendingUp },
      { to: '/revenue', label: 'Revenue Analytics', icon: Activity },
      { to: '/audit', label: 'Audit Logs', icon: ScrollText },
    ],
  },
  {
    title: 'System',
    items: [
      { to: '/notifications', label: 'Notifications', icon: Bell },
      { to: '/settings', label: 'System Settings', icon: Settings },
      { to: '/feature-flags', label: 'Feature Flags', icon: Flag },
      { to: '/integrations', label: 'Integrations', icon: Puzzle },
      { to: '/storage', label: 'Storage / Cloudinary', icon: Upload },
      { to: '/help', label: 'Help & Support', icon: LifeBuoy },
    ],
  },
];
