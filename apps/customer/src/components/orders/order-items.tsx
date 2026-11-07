import { formatCurrency } from '@/lib/format-currency';
import type { OrderItemView } from '@/types';
import { Separator } from '@/components/ui/separator';

interface OrderItemsListProps {
  items: OrderItemView[];
  currency: string;
}

export function OrderItemsList({ items, currency }: OrderItemsListProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold">Items</h2>
      <ul className="space-y-3.5">
        {items.map((item, index) => (
          <li key={`${item.id}-${index}`} className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary tabular-nums">
                {item.quantity}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.name}</p>
                {item.modifiers.length > 0 ? (
                  <p className="text-xs text-muted">
                    {item.modifiers.map((modifier) => modifier.name).join(', ')}
                  </p>
                ) : null}
                {item.notes ? <p className="text-xs italic text-muted">“{item.notes}”</p> : null}
              </div>
            </div>
            <span className="shrink-0 text-sm tabular-nums">
              {formatCurrency(item.lineTotal, currency)}
            </span>
          </li>
        ))}
      </ul>
      <Separator className="my-3" />
      <p className="text-right text-sm font-semibold tabular-nums">
        {formatCurrency(
          items.reduce((sum, item) => sum + item.lineTotal, 0),
          currency,
        )}
      </p>
    </div>
  );
}
