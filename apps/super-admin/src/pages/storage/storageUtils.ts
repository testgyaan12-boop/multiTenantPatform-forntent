export function formatBytes(bytes?: number | null): string {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  const digits = index === 0 || value >= 100 ? 0 : 1;
  return `${value.toFixed(digits)} ${units[index]}`;
}

export function formatCount(value?: number | null): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '0';
  }
  return new Intl.NumberFormat('en-IN').format(value);
}

export function formatDate(iso?: string | null): string {
  if (!iso) {
    return '-';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) {
    return '-';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function percentChange(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous <= 0) {
    return null;
  }
  return Math.round(((current - previous) / previous) * 100);
}

export type ProgressTone = 'success' | 'warning' | 'error';

export function progressTone(percent: number, warning: number, critical: number): ProgressTone {
  if (percent >= critical) {
    return 'error';
  }
  if (percent >= warning) {
    return 'warning';
  }
  return 'success';
}
