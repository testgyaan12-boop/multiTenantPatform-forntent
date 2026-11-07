import { Link } from 'react-router-dom';
import { ChevronRight, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '@/lib/format-currency';

interface CartBarProps {
  slug: string;
  count: number;
  subtotal: number;
  currency: string;
}

export function CartBar({ slug, count, subtotal, currency }: CartBarProps) {
  if (count <= 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(3.5rem+max(env(safe-area-inset-bottom),0.75rem)+0.5rem)] z-30 px-4">
      <div className="pointer-events-auto mx-auto flex max-w-xl items-center justify-between gap-3 rounded-xl bg-primary px-4 py-3 text-white shadow-lg">
        <span className="flex items-center gap-2.5 text-sm font-medium">
          <span className="relative">
            <ShoppingBag className="h-5 w-5" aria-hidden />
            <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold">
              {count}
            </span>
          </span>
          {count} {count === 1 ? 'item' : 'items'} · {formatCurrency(subtotal, currency)}
        </span>
        <Link
          to={`/r/${slug}/cart`}
          className="flex items-center gap-0.5 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-white/25"
        >
          View cart
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
