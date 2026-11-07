import { Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/format-currency';
import type { StoredCartItem } from '@/stores/cart.store';
import { estimateItemTotal } from '@/stores/cart.store';
import { ItemImage } from '@/components/common/item-image';
import { QuantityStepper } from '@/components/common/quantity-stepper';

interface CartLineRowProps {
  item: StoredCartItem;
  currency: string;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

export function CartLineRow({ item, currency, onQuantityChange, onRemove }: CartLineRowProps) {
  return (
    <li className="flex gap-3 rounded-xl border border-border bg-card p-3">
      <ItemImage src={item.imageUrl} alt={item.name} className="h-20 w-20 shrink-0 rounded-lg" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{item.name}</p>
            {item.variantName ? <p className="text-xs text-muted">{item.variantName}</p> : null}
          </div>
          <button
            type="button"
            aria-label={`Remove ${item.name}`}
            onClick={onRemove}
            className="rounded-full p-1.5 text-muted transition-colors hover:bg-destructive-soft hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
        {item.modifiers.length > 0 ? (
          <p className="truncate text-xs text-muted">
            {item.modifiers.map((modifier) => modifier.name).join(', ')}
          </p>
        ) : null}
        {item.notes ? <p className="truncate text-xs italic text-muted">“{item.notes}”</p> : null}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <QuantityStepper
            compact
            value={item.quantity}
            onChange={onQuantityChange}
            label={`quantity of ${item.name}`}
          />
          <span className="text-sm font-semibold">{formatCurrency(estimateItemTotal(item), currency)}</span>
        </div>
      </div>
    </li>
  );
}
