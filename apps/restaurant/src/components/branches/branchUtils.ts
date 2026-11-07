import type { Branch } from '@resto/types';

export const BRANCH_STATUS_META: Record<
  Branch['status'],
  { label: string; color: string; bg: string }
> = {
  ACTIVE: { label: 'Active', color: '#16A36A', bg: '#E7F8F0' },
  PAUSED: { label: 'Paused', color: '#F59E0B', bg: '#FFF4E5' },
  INACTIVE: { label: 'Inactive', color: '#718096', bg: '#F1F3F7' },
};

export type BranchStatusFilter = '' | 'ACTIVE' | 'PAUSED' | 'INACTIVE';

export interface BranchFilters {
  search: string;
  status: BranchStatusFilter;
}

export const defaultBranchFilters: BranchFilters = { search: '', status: '' };

export function filterBranches(branches: Branch[], filters: BranchFilters): Branch[] {
  const term = filters.search.trim().toLowerCase();
  return branches.filter((branch) => {
    if (filters.status && (branch.status ?? 'ACTIVE') !== filters.status) return false;
    if (term) {
      const haystack = `${branch.name} ${branch.code} ${branch.city} ${branch.addressLine1}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });
}

export function formatBranchAddress(branch: Branch): string {
  const parts = [branch.addressLine1, branch.city].filter(Boolean);
  return parts.join(', ') || '—';
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function downloadBranchesCsv(filename: string, branches: Branch[]): void {
  const rows: (string | number)[][] = [
    ['Code', 'Name', 'Address', 'City', 'Phone', 'Status', 'Default', 'Timezone', 'Currency', 'Manager'],
    ...branches.map((branch) => [
      branch.code,
      branch.name,
      branch.addressLine1,
      branch.city,
      branch.phone ?? '',
      branch.status ?? 'ACTIVE',
      branch.isDefault ? 'Yes' : 'No',
      branch.timezone ?? '',
      branch.currency ?? '',
      branch.managerName ?? '',
    ]),
  ];
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
