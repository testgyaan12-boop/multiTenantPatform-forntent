import type { DiningTable, Order } from '@resto/types';
import type { LucideIcon } from 'lucide-react';
import { Brush, CalendarClock, CheckCircle2, HelpCircle, Users } from 'lucide-react';

export type DerivedStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING' | 'UNKNOWN';

export interface StatusMeta {
  label: string;
  color: string;
  bg: string;
  icon: LucideIcon;
}

export const statusMeta: Record<DerivedStatus, StatusMeta> = {
  AVAILABLE: { label: 'Available', color: '#16A36A', bg: '#E7F8F0', icon: CheckCircle2 },
  OCCUPIED: { label: 'Occupied', color: '#DC2626', bg: '#FEECEB', icon: Users },
  RESERVED: { label: 'Reserved', color: '#7C3AED', bg: '#F3EEFF', icon: CalendarClock },
  CLEANING: { label: 'Cleaning', color: '#F59E0B', bg: '#FFF4E5', icon: Brush },
  UNKNOWN: { label: 'Unknown', color: '#667085', bg: '#F1F3F7', icon: HelpCircle },
};

/** Order statuses that keep a dine-in table busy (backend frees the table on COMPLETED/CANCELLED). */
export const ACTIVE_ORDER_STATUSES = ['PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED'];

export function isActiveOrder(order: Order): boolean {
  return (
    order.tableId != null &&
    order.tableId > 0 &&
    ACTIVE_ORDER_STATUSES.includes(order.status)
  );
}

/** Earliest active order per table (stable while an order progresses through statuses). */
export function activeOrdersByTable(orders: Order[]): Map<number, Order> {
  const byTable = new Map<number, Order>();
  const active = orders.filter(isActiveOrder).sort((a, b) =>
    (a.placedAt ?? a.createdAt).localeCompare(b.placedAt ?? b.createdAt),
  );
  for (const order of active) {
    const tableId = order.tableId as number;
    if (!byTable.has(tableId)) byTable.set(tableId, order);
  }
  return byTable;
}

export function deriveStatus(table: DiningTable, order: Order | undefined): DerivedStatus {
  if (order) return 'OCCUPIED';
  const stored = (table.status ?? 'AVAILABLE').toUpperCase();
  if (stored === 'AVAILABLE' || stored === 'RESERVED' || stored === 'CLEANING') {
    return stored;
  }
  return stored === 'OCCUPIED' ? 'AVAILABLE' : 'UNKNOWN';
}

export function publicUrl(table: DiningTable): string {
  const configured = import.meta.env.VITE_CUSTOMER_URL as string | undefined;
  const base =
    configured && configured.trim()
      ? configured.replace(/\/+$/, '')
      : `${window.location.protocol}//${window.location.hostname}:5175`;
  return `${base}/t/${table.qrToken}`;
}

export function timeAgoLabel(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function exactTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

export interface TableFilters {
  search: string;
  status: '' | DerivedStatus;
  sort: 'number-asc' | 'number-desc' | 'capacity-asc' | 'capacity-desc';
}

export const defaultTableFilters: TableFilters = {
  search: '',
  status: '',
  sort: 'number-asc',
};

const numberCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export function filterTables(
  tables: DiningTable[],
  statusByTable: Map<number, DerivedStatus>,
  filters: TableFilters,
): DiningTable[] {
  const term = filters.search.trim().toLowerCase();
  const filtered = tables.filter((table) => {
    if (filters.status && statusByTable.get(table.id) !== filters.status) return false;
    if (term) {
      const inNumber = table.tableNumber.toLowerCase().includes(term);
      const inName = (table.name ?? '').toLowerCase().includes(term);
      if (!inNumber && !inName) return false;
    }
    return true;
  });

  const sorted = [...filtered];
  switch (filters.sort) {
    case 'number-desc':
      sorted.sort((a, b) => numberCollator.compare(b.tableNumber, a.tableNumber));
      break;
    case 'capacity-asc':
      sorted.sort((a, b) => a.capacity - b.capacity || numberCollator.compare(a.tableNumber, b.tableNumber));
      break;
    case 'capacity-desc':
      sorted.sort((a, b) => b.capacity - a.capacity || numberCollator.compare(a.tableNumber, b.tableNumber));
      break;
    default:
      sorted.sort((a, b) => numberCollator.compare(a.tableNumber, b.tableNumber));
  }
  return sorted;
}

export function activeTableFilterCount(filters: TableFilters): number {
  return [filters.search.trim() !== '', filters.status !== '', filters.sort !== 'number-asc'].filter(
    Boolean,
  ).length;
}

export interface TableSummary {
  total: number;
  available: number;
  occupied: number;
  seating: number;
}

export function summarizeTables(
  tables: DiningTable[],
  statusByTable: Map<number, DerivedStatus>,
): TableSummary {
  let available = 0;
  let occupied = 0;
  let seating = 0;
  for (const table of tables) {
    const status = statusByTable.get(table.id) ?? 'AVAILABLE';
    if (status === 'AVAILABLE') available += 1;
    if (status === 'OCCUPIED') occupied += 1;
    seating += Number(table.capacity ?? 0);
  }
  return { total: tables.length, available, occupied, seating };
}

export function downloadCanvasPng(canvas: HTMLCanvasElement, filename: string): void {
  const url = canvas.toDataURL('image/png');
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function qrFilename(table: DiningTable): string {
  const safe = table.tableNumber.replace(/[^a-zA-Z0-9_-]+/g, '-');
  return `qr-table-${safe}.png`;
}
