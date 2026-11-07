export function formatInr(
  value: number | string | null | undefined,
  options?: { compact?: boolean; maximumFractionDigits?: number },
): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  const amount = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(amount)) {
    return '-';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    notation: options?.compact ? 'compact' : 'standard',
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(amount);
}
