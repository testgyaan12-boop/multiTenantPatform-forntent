import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '@/lib/format-currency';
import { estimateTotals, serviceLabel, taxLabel } from '@/lib/cart-totals';
import { useRestaurant } from '@/hooks/use-restaurant';
import { useCartStore } from '@/stores/cart.store';
import { useSessionStore } from '@/stores/session.store';
import { PageHeader } from '@/components/layout/page-header';
import { CartLineRow } from '@/components/cart/cart-line-row';
import { CartTotalsCard } from '@/components/cart/cart-totals';
import { EmptyState } from '@/components/common/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function CartPage() {
  const { restaurantSlug = '' } = useParams();
  const slug = restaurantSlug;
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clear = useCartStore((state) => state.clear);
  const orderType = useCartStore((state) => state.orderType);
  const tableNumber = useSessionStore((state) => state.getSession(slug, 'dine-in')?.tableNumber);
  const restaurant = useRestaurant(slug);

  const currency = restaurant.data?.currency ?? 'USD';
  const totals = estimateTotals({
    items,
    taxRate: restaurant.data?.taxRate ?? 0,
    serviceChargeRate: restaurant.data?.serviceChargeRate ?? 0,
    currency,
  });

  return (
    <>
      <PageHeader
        title="Your cart"
        subtitle={
          items.length > 0
            ? `${items.reduce((sum, item) => sum + item.quantity, 0)} items`
            : 'Nothing here yet'
        }
        back
        right={
          items.length > 0 ? (
            <button
              type="button"
              onClick={clear}
              className="text-xs font-medium text-muted underline-offset-4 hover:text-destructive hover:underline"
            >
              Clear
            </button>
          ) : null
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Browse the menu and add something delicious."
          action={
            <Button asChild>
              <Link to={`/r/${slug}/menu`}>Browse menu</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4 px-4 py-4">
          <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
            <div>
              <p className="text-sm font-semibold">
                {orderType === 'dine-in' ? `Dine-in · Table ${tableNumber ?? '—'}` : 'Pickup order'}
              </p>
              <p className="text-xs text-muted">
                {orderType === 'dine-in'
                  ? 'Your order goes straight to the table.'
                  : 'Collect fresh at the counter.'}
              </p>
            </div>
            <Badge variant={orderType === 'dine-in' ? 'default' : 'accent'}>
              {orderType === 'dine-in' ? 'Dine-in' : 'Pickup'}
            </Badge>
          </div>

          <ul className="space-y-3">
            {items.map((item) => (
              <CartLineRow
                key={item.key}
                item={item}
                currency={currency}
                onQuantityChange={(quantity) => updateQuantity(item.key, quantity)}
                onRemove={() => removeItem(item.key)}
              />
            ))}
          </ul>

          <Link
            to={`/r/${slug}/menu`}
            className="inline-block text-sm font-medium text-primary hover:underline"
          >
            ← Add more items
          </Link>

          {restaurant.isPending ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <CartTotalsCard
              rows={[
                { label: 'Subtotal', value: formatCurrency(totals.subtotal, currency), strong: true },
                { label: taxLabel(restaurant.data), value: formatCurrency(totals.taxTotal, currency) },
                {
                  label: serviceLabel(restaurant.data),
                  value: formatCurrency(totals.serviceCharge, currency),
                },
              ]}
              grandTotal={formatCurrency(totals.grandTotal, currency)}
              currencyNote="Final totals are confirmed by the kitchen before payment."
            />
          )}

          <Button
            size="lg"
            className="w-full"
            onClick={() => navigate(`/r/${slug}/checkout`)}
            disabled={restaurant.isPending}
          >
            Go to checkout
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      )}
    </>
  );
}
