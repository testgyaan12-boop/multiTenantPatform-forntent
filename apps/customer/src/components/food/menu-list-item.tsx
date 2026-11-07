import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/format-currency';
import { cn } from '@/lib/utils';
import type { MenuItemView } from '@/types';
import { VegMark } from '@/components/common/veg-mark';
import { ItemImage } from '@/components/common/item-image';
import { Badge } from '@/components/ui/badge';

interface MenuListItemProps {
  item: MenuItemView;
  currency: string;
  href: string;
  onAdd?: () => void;
  adding?: boolean;
}

export function MenuListItem({ item, currency, href, onAdd, adding = false }: MenuListItemProps) {
  return (
    <li>
      <div
        className={cn(
          'flex gap-3 rounded-xl border border-border bg-card p-3',
          !item.isAvailable && 'opacity-70',
        )}
      >
        <Link to={href} className="shrink-0" aria-label={`View ${item.name}`}>
          <ItemImage
            src={item.imageUrl}
            alt={item.name}
            className="h-24 w-24 rounded-lg sm:h-28 sm:w-28"
          />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start gap-2">
            <VegMark vegetarian={item.isVegetarian} />
            <Link to={href} className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-sm font-semibold leading-snug">
                <span className="truncate">{item.name}</span>
                {item.isFeatured ? <Badge variant="accent">Chef&apos;s pick</Badge> : null}
              </span>
            </Link>
          </div>
          {item.description ? (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{item.description}</p>
          ) : null}
          <div className="mt-auto flex items-center justify-between gap-2 pt-2">
            <span className="text-sm font-semibold">{formatCurrency(item.price, currency)}</span>
            {item.isAvailable ? (
              <button
                type="button"
                disabled={adding}
                onClick={onAdd}
                aria-label={`Add ${item.name} to cart`}
                className="flex h-8 items-center gap-1 rounded-full bg-primary px-3.5 text-xs font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                {adding ? 'Adding…' : 'Add'}
              </button>
            ) : (
              <Badge variant="outline">Sold out</Badge>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
