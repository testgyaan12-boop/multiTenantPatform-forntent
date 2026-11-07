import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format-currency';
import { Separator } from '@/components/ui/separator';

export interface TotalsRow {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
}

interface CartTotalsCardProps {
  rows: TotalsRow[];
  grandTotalLabel?: string;
  grandTotal: string;
  currencyNote?: string;
}

export function CartTotalsCard({
  rows,
  grandTotalLabel = 'Total',
  grandTotal,
  currencyNote,
}: CartTotalsCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <dl className="space-y-2.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 text-sm">
            <dt className={cn('text-muted', row.strong && 'font-medium text-foreground')}>
              {row.label}
            </dt>
            <dd
              className={cn(
                'tabular-nums',
                row.strong ? 'font-semibold' : 'text-foreground/90',
                row.muted && 'text-success',
              )}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
      <Separator className="my-3" />
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold">{grandTotalLabel}</span>
        <span className="text-lg font-bold tabular-nums">{grandTotal}</span>
      </div>
      {currencyNote ? <p className="mt-1.5 text-right text-[11px] text-muted">{currencyNote}</p> : null}
    </div>
  );
}

export function money(amount: number, currency: string): string {
  return formatCurrency(amount, currency);
}
