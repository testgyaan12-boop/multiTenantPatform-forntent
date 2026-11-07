import type { Order, OrderStatus } from '@resto/types';

export interface StatusMeta {
  label: string;
  bg: string;
  color: string;
}

export const statusMeta: Record<string, StatusMeta> = {
  PLACED: { label: 'New', bg: '#EFF4FF', color: '#2563EB' },
  CONFIRMED: { label: 'Confirmed', bg: '#E8F1FE', color: '#3B82F6' },
  PREPARING: { label: 'Preparing', bg: '#FFF4E5', color: '#F4511E' },
  READY: { label: 'Ready', bg: '#E7F8F0', color: '#16A36A' },
  SERVED: { label: 'Served', bg: '#EDF7F1', color: '#16A36A' },
  COMPLETED: { label: 'Completed', bg: '#F1F5F9', color: '#475467' },
  CANCELLED: { label: 'Cancelled', bg: '#FEECEB', color: '#B42318' },
};

export function metaFor(status: string): StatusMeta {
  return statusMeta[status] ?? { label: status, bg: '#F1F5F9', color: '#475467' };
}

export const nextStatus: Record<string, OrderStatus | null> = {
  PLACED: 'CONFIRMED',
  CONFIRMED: 'PREPARING',
  PREPARING: 'READY',
  READY: 'SERVED',
  SERVED: 'COMPLETED',
  COMPLETED: null,
  CANCELLED: null,
};

export const nextStatusLabel: Record<string, string> = {
  PLACED: 'Confirm order',
  CONFIRMED: 'Start preparation',
  PREPARING: 'Mark ready',
  READY: 'Mark served',
  SERVED: 'Mark completed',
};

export const canCancel: Record<string, boolean> = {
  PLACED: true,
  CONFIRMED: true,
  PREPARING: true,
  READY: false,
  SERVED: false,
  COMPLETED: false,
  CANCELLED: false,
};

export const statusTabs = [
  { value: '', label: 'All Orders' },
  { value: 'PLACED', label: 'New' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PREPARING', label: 'Preparing' },
  { value: 'READY', label: 'Ready' },
  { value: 'SERVED', label: 'Served' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export function orderTypeMeta(source?: string | null): { label: string; kind: 'dinein' | 'takeaway' | 'other' } {
  if (source === 'PICKUP') return { label: 'Takeaway', kind: 'takeaway' };
  if (source === 'QR') return { label: 'Dine-in', kind: 'dinein' };
  if (!source) return { label: '—', kind: 'other' };
  return { label: source, kind: 'other' };
}

export function timeAgo(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function exactTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

export function csvEscape(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildOrdersCsv(orders: Order[]): string {
  const header = [
    'Order number',
    'Type',
    'Table',
    'Status',
    'Payment status',
    'Customer',
    'Items',
    'Total',
    'Currency',
    'Placed at',
  ];
  const rows = orders.map((order) =>
    [
      order.orderNumber,
      orderTypeMeta(order.source).label,
      order.tableNumber ?? '',
      order.status,
      order.paymentStatus,
      order.customerName ?? 'Guest',
      order.items.length,
      order.grandTotal,
      order.currency,
      order.placedAt ?? order.createdAt,
    ]
      .map(csvEscape)
      .join(','),
  );
  return [header.join(','), ...rows].join('\n');
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
