import { Link, useParams } from 'react-router-dom';
import { Bike, Info, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { MOCK_MODE } from '@/lib/env';
import { formatCurrency } from '@/lib/format-currency';
import { useRestaurant, useMenu } from '@/hooks/use-restaurant';
import { selectCartCount, selectSubtotal, useCartStore } from '@/stores/cart.store';
import { useSessionStore } from '@/stores/session.store';
import { PageHeader } from '@/components/layout/page-header';
import { FeaturedCard } from '@/components/food/featured-card';
import { ErrorState } from '@/components/common/error-state';
import { PageSkeleton } from '@/components/common/loading-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function HomePage() {
  const { restaurantSlug = '' } = useParams();
  const slug = restaurantSlug;
  const restaurant = useRestaurant(slug);
  const menu = useMenu(slug);
  const count = useCartStore(selectCartCount);
  const subtotal = useCartStore(selectSubtotal);
  const orderType = useCartStore((state) => state.orderType);
  const tableNumber = useSessionStore((state) => state.getSession(slug, 'dine-in')?.tableNumber);

  if (restaurant.isPending) {
    return (
      <>
        <PageHeader title="Loading…" back />
        <PageSkeleton />
      </>
    );
  }

  if (restaurant.isError || !restaurant.data) {
    return (
      <>
        <PageHeader title="Restaurant" back />
        <ErrorState error={restaurant.error} onRetry={() => void restaurant.refetch()} />
      </>
    );
  }

  const info = restaurant.data;
  const featured = (menu.data?.categories ?? [])
    .flatMap((category) => category.items)
    .filter((item) => item.isFeatured && item.isAvailable)
    .slice(0, 6);

  return (
    <>
      <PageHeader
        title={info.name}
        subtitle={orderType === 'dine-in' ? `Table ${tableNumber ?? '—'} · Dine-in` : 'Pickup order'}
        right={
          count > 0 ? (
            <Link
              to={`/r/${slug}/cart`}
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary"
              aria-label={`Cart with ${count} items`}
            >
              <ShoppingBag className="h-4.5 w-4.5" aria-hidden />
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
                {count}
              </span>
            </Link>
          ) : null
        }
      />

      <section className="px-4 pt-4">
        <div className="rounded-2xl bg-primary p-5 text-white">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-4.5 w-4.5" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wide opacity-90">
              Order ahead · {info.currency}
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-bold leading-tight">{info.name}</h2>
          {info.description ? (
            <p className="mt-1.5 text-sm leading-relaxed text-white/85">{info.description}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="accent">
              <Link to={`/r/${slug}/menu`}>Browse menu</Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              <Link to={`/r/${slug}/cart`}>
                <Bike className="h-4 w-4" aria-hidden />
                {count > 0
                  ? `Cart · ${formatCurrency(subtotal, info.currency)}`
                  : 'View cart'}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {MOCK_MODE ? (
        <section className="px-4 pt-4">
          <Alert variant="info">
            <Info className="h-4 w-4" aria-hidden />
            <AlertTitle>Demo mode</AlertTitle>
            <AlertDescription>
              Sample restaurant “The Spice House” with demo prices in ₹. Payments are simulated —
              nothing is charged.
            </AlertDescription>
          </Alert>
        </section>
      ) : null}

      {featured.length > 0 ? (
        <section className="pt-6">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-sm font-semibold">Guest favourites</h2>
            <Link to={`/r/${slug}/menu`} className="text-xs font-medium text-primary hover:underline">
              See all
            </Link>
          </div>
          <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-4 pb-1">
            {featured.map((item) => (
              <FeaturedCard
                key={item.id}
                item={item}
                currency={info.currency}
                href={`/r/${slug}/item/${item.id}`}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-3 px-4 pt-6 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <Badge variant={orderType === 'dine-in' ? 'default' : 'accent'}>
            {orderType === 'dine-in' ? `Dine-in · Table ${tableNumber ?? '—'}` : 'Pickup'}
          </Badge>
          <p className="mt-2 text-sm text-muted">
            {orderType === 'dine-in'
              ? 'Ordered from your table QR code — food comes to you.'
              : 'Grab it fresh at the counter. Scan a table QR to dine in instead.'}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <Badge variant="outline">Track live</Badge>
          <p className="mt-2 text-sm text-muted">
            Follow every stage — placed, confirmed, preparing, ready — from your order page.
          </p>
        </div>
      </section>
    </>
  );
}
