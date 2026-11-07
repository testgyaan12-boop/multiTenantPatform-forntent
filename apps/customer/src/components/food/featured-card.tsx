import { Link } from 'react-router-dom';
import { formatCurrency } from '@/lib/format-currency';
import type { MenuItemView } from '@/types';
import { ItemImage } from '@/components/common/item-image';
import { VegMark } from '@/components/common/veg-mark';

interface FeaturedCardProps {
  item: MenuItemView;
  currency: string;
  href: string;
}

export function FeaturedCard({ item, currency, href }: FeaturedCardProps) {
  return (
    <Link
      to={href}
      className="w-40 shrink-0 overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
    >
      <ItemImage src={item.imageUrl} alt={item.name} className="h-24 w-full" />
      <div className="space-y-1 p-3">
        <div className="flex items-center gap-1.5">
          <VegMark vegetarian={item.isVegetarian} />
          <span className="truncate text-sm font-semibold">{item.name}</span>
        </div>
        <p className="text-sm font-medium text-primary">{formatCurrency(item.price, currency)}</p>
      </div>
    </Link>
  );
}
