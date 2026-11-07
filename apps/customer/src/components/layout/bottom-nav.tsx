import { NavLink } from 'react-router-dom';
import { ReceiptText, ShoppingBag, UtensilsCrossed, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { selectCartCount, useCartStore } from '@/stores/cart.store';

interface BottomNavProps {
  slug: string;
}

export function BottomNav({ slug }: BottomNavProps) {
  const count = useCartStore(selectCartCount);
  const base = `/r/${slug}`;

  const items = [
    { to: `${base}/menu`, label: 'Menu', icon: UtensilsCrossed },
    { to: `${base}/cart`, label: 'Cart', icon: ShoppingBag, badge: count },
    { to: `${base}/orders`, label: 'Orders', icon: ReceiptText },
    { to: `${base}/profile`, label: 'Profile', icon: UserRound },
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur safe-bottom"
    >
      <ul className="mx-auto flex max-w-3xl items-stretch justify-around">
        {items.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted hover:text-foreground',
                )
              }
            >
              <span className="relative">
                <item.icon className="h-5 w-5" aria-hidden />
                {item.badge ? (
                  <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
                    {item.badge}
                  </span>
                ) : null}
              </span>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
