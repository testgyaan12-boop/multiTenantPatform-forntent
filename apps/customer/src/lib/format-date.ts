import { format, formatDistanceToNow, isToday, parseISO } from 'date-fns';

export function formatDate(value: string | Date | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? parseISO(value) : value;
  if (isToday(date)) return `Today, ${format(date, 'h:mm a')}`;
  return format(date, 'MMM d, yyyy · h:mm a');
}

export function formatRelative(value: string | Date | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? parseISO(value) : value;
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatTime(value: string | Date | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? parseISO(value) : value;
  return format(date, 'h:mm a');
}
