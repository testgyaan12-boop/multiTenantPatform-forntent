const INTL_CACHE = new Map<string, Intl.NumberFormat>();

export function formatCurrency(amount: number, _currency?: string): string {
  const code = 'INR';
  let formatter = INTL_CACHE.get(code);
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
        maximumFractionDigits: 2,
      });
    } catch {
      formatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
    }
    INTL_CACHE.set(code, formatter);
  }
  return formatter.format(amount);
}
