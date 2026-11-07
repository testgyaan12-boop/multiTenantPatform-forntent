import type { Employee, StaffTask } from '@resto/types';

export const ROLE_META: Record<string, { label: string; family: 'service' | 'kitchen' | 'ops' | 'finance'; color: string; bg: string }> = {
  TENANT_OWNER: { label: 'Owner', family: 'ops', color: '#B45309', bg: '#FEF3C7' },
  TENANT_MANAGER: { label: 'Manager', family: 'ops', color: '#7C3AED', bg: '#F3EEFF' },
  BRANCH_MANAGER: { label: 'Branch Manager', family: 'ops', color: '#7C3AED', bg: '#F3EEFF' },
  ORDER_CONFIRMATION: { label: 'Order Confirmation', family: 'ops', color: '#2563EB', bg: '#EEF4FF' },
  CHEF: { label: 'Chef', family: 'kitchen', color: '#DC2626', bg: '#FEECEB' },
  KITCHEN_HELPER: { label: 'Kitchen Helper', family: 'kitchen', color: '#F59E0B', bg: '#FFF4E5' },
  KITCHEN: { label: 'Kitchen', family: 'kitchen', color: '#DC2626', bg: '#FEECEB' },
  WAITER: { label: 'Waiter / Service', family: 'service', color: '#16A36A', bg: '#E7F8F0' },
  STAFF: { label: 'Service Staff', family: 'service', color: '#16A36A', bg: '#E7F8F0' },
  CASHIER: { label: 'Cashier', family: 'finance', color: '#0F766E', bg: '#E6F6F5' },
};

export const TASK_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'SERVE_TABLE', label: 'Serve Table' },
  { value: 'CLEAN_TABLE', label: 'Clean Table' },
  { value: 'PREPARE_ORDER', label: 'Prepare Order' },
  { value: 'CONFIRM_ORDER', label: 'Confirm Order' },
  { value: 'RESTOCK_SUPPLIES', label: 'Restock Supplies' },
  { value: 'KITCHEN_PREPARATION', label: 'Kitchen Preparation' },
  { value: 'CUSTOMER_ASSISTANCE', label: 'Customer Assistance' },
  { value: 'OPENING_CHECKLIST', label: 'Opening Checklist' },
  { value: 'CLOSING_CHECKLIST', label: 'Closing Checklist' },
  { value: 'CUSTOM_TASK', label: 'Custom Task' },
];

export const PRIORITY_META: Record<string, { label: string; color: string; bg: string }> = {
  LOW: { label: 'Low', color: '#718096', bg: '#F1F3F7' },
  NORMAL: { label: 'Normal', color: '#2563EB', bg: '#EEF4FF' },
  HIGH: { label: 'High', color: '#F59E0B', bg: '#FFF4E5' },
  URGENT: { label: 'Urgent', color: '#DC2626', bg: '#FEECEB' },
};

export const TASK_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  ASSIGNED: { label: 'Assigned', color: '#2563EB', bg: '#EEF4FF' },
  ACCEPTED: { label: 'Accepted', color: '#0F766E', bg: '#E6F6F5' },
  IN_PROGRESS: { label: 'In Progress', color: '#F59E0B', bg: '#FFF4E5' },
  BLOCKED: { label: 'Blocked', color: '#DC2626', bg: '#FEECEB' },
  COMPLETED: { label: 'Completed', color: '#16A36A', bg: '#E7F8F0' },
  CANCELLED: { label: 'Cancelled', color: '#718096', bg: '#F1F3F7' },
};

export const KANBAN_COLUMNS: { key: string; title: string; statuses: StaffTask['status'][] }[] = [
  { key: 'assigned', title: 'Assigned', statuses: ['ASSIGNED', 'ACCEPTED'] },
  { key: 'in_progress', title: 'In Progress', statuses: ['IN_PROGRESS'] },
  { key: 'blocked', title: 'Blocked', statuses: ['BLOCKED'] },
  { key: 'completed', title: 'Completed', statuses: ['COMPLETED'] },
];

export const NEXT_STATUS_ACTIONS: Record<string, { status: StaffTask['status']; label: string }[]> = {
  ASSIGNED: [
    { status: 'ACCEPTED', label: 'Accept' },
    { status: 'IN_PROGRESS', label: 'Start' },
    { status: 'CANCELLED', label: 'Cancel' },
  ],
  ACCEPTED: [
    { status: 'IN_PROGRESS', label: 'Start' },
    { status: 'CANCELLED', label: 'Cancel' },
  ],
  IN_PROGRESS: [
    { status: 'COMPLETED', label: 'Complete' },
    { status: 'BLOCKED', label: 'Block' },
    { status: 'CANCELLED', label: 'Cancel' },
  ],
  BLOCKED: [
    { status: 'IN_PROGRESS', label: 'Resume' },
    { status: 'CANCELLED', label: 'Cancel' },
  ],
};

export type DateRangeKey = 'today' | 'yesterday' | '7d' | 'month' | 'custom';

export interface DateRange {
  from: string;
  to: string;
  label: string;
}

function isoDay(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function resolveDateRange(key: DateRangeKey, custom?: { from: string; to: string }): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (key) {
    case 'yesterday': {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { from: isoDay(y), to: isoDay(y), label: 'Yesterday' };
    }
    case '7d': {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return { from: isoDay(from), to: isoDay(today), label: 'Last 7 days' };
    }
    case 'month':
      return { from: isoDay(new Date(today.getFullYear(), today.getMonth(), 1)), to: isoDay(today), label: 'This month' };
    case 'custom':
      return {
        from: custom?.from || isoDay(today),
        to: custom?.to || isoDay(today),
        label: 'Custom range',
      };
    default:
      return { from: isoDay(today), to: isoDay(today), label: 'Today' };
  }
}

export function instantStartOf(dateStr: string): string {
  return `${dateStr}T00:00:00.000Z`;
}

export function instantEndOf(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString();
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function roleMeta(code?: string | null): { label: string; color: string; bg: string } {
  if (!code) return { label: 'Unassigned', color: '#718096', bg: '#F1F3F7' };
  const meta = ROLE_META[code];
  if (meta) return meta;
  return { label: code.replace(/_/g, ' '), color: '#718096', bg: '#F1F3F7' };
}

export function primaryRole(employee: Employee): string | null {
  return employee.roles?.[0] ?? null;
}

export function isKitchenRole(employee: Employee): boolean {
  return (employee.roles ?? []).some((code) => ROLE_META[code]?.family === 'kitchen');
}

export function isManagerRole(employee: Employee): boolean {
  return (employee.roles ?? []).some((code) => ROLE_META[code]?.family === 'ops');
}

export interface EmployeeFilters {
  search: string;
  role: string;
  status: '' | 'ACTIVE' | 'INACTIVE';
  duty: '' | 'on' | 'off';
}

export const defaultEmployeeFilters: EmployeeFilters = {
  search: '',
  role: '',
  status: '',
  duty: '',
};

export function filterEmployees(employees: Employee[], filters: EmployeeFilters): Employee[] {
  const term = filters.search.trim().toLowerCase();
  return employees.filter((employee) => {
    if (filters.role && !(employee.roles ?? []).includes(filters.role)) return false;
    if (filters.status && employee.status !== filters.status) return false;
    if (filters.duty === 'on' && !employee.onDuty) return false;
    if (filters.duty === 'off' && employee.onDuty) return false;
    if (term) {
      const haystack = `${employee.fullName} ${employee.email} ${employee.employeeCode}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });
}

export function activeEmployeeFilterCount(filters: EmployeeFilters): number {
  return [
    filters.search.trim() !== '',
    filters.role !== '',
    filters.status !== '',
    filters.duty !== '',
  ].filter(Boolean).length;
}

export function taskCompletion(_task: StaffTask): { done: number; total: number } {
  return { done: 0, total: 0 };
}

export function tasksForEmployee(tasks: StaffTask[], employeeId: number): StaffTask[] {
  return tasks.filter((task) => task.assignedToEmployeeId === employeeId);
}

export function formatMinutes(value?: number | null): string {
  if (value == null) return '—';
  if (value < 60) return `${Math.round(value)}m`;
  const hours = value / 60;
  return `${hours.toFixed(1)}h`;
}

export function downloadCsv(filename: string, rows: (string | number)[][]): void {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const text = String(cell ?? '');
          return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
        })
        .join(','),
    )
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
