import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Search, ShoppingBag, X } from 'lucide-react';
import { toast } from 'sonner';
import { service } from '@/services';
import { errorMessage } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { ItemDetail, MenuItemView } from '@/types';
import { useMenu, useRestaurant } from '@/hooks/use-restaurant';
import { selectCartCount, selectSubtotal, useCartStore } from '@/stores/cart.store';
import { useSessionStore } from '@/stores/session.store';
import { PageHeader } from '@/components/layout/page-header';
import { CategoryNav } from '@/components/food/category-nav';
import { MenuListItem } from '@/components/food/menu-list-item';
import { CartBar } from '@/components/cart/cart-bar';
import { VegMark } from '@/components/common/veg-mark';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { PageSkeleton } from '@/components/common/loading-state';
import { Input } from '@/components/ui/input';

function hasRequiredChoices(item: ItemDetail): boolean {
  return item.modifierGroups.some((group) => group.isRequired && group.minSelections > 0);
}

function defaultVariant(item: ItemDetail) {
  return item.variants.find((variant) => variant.isDefault) ?? item.variants[0];
}

export function MenuPage() {
  const { restaurantSlug = '' } = useParams();
  const slug = restaurantSlug;
  const menu = useMenu(slug);
  const restaurant = useRestaurant(slug);
  const [query, setQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const count = useCartStore(selectCartCount);
  const subtotal = useCartStore(selectSubtotal);
  const addItem = useCartStore((state) => state.addItem);
  const orderType = useCartStore((state) => state.orderType);
  const tableNumber = useSessionStore((state) => state.getSession(slug, 'dine-in')?.tableNumber);
  const currency = menu.data?.currency ?? restaurant.data?.currency ?? 'USD';
  const navigate = useNavigate();

  const categories = useMemo(() => {
    const all = menu.data?.categories ?? [];
    const needle = query.trim().toLowerCase();
    return all
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => {
          if (vegOnly && !item.isVegetarian) return false;
          if (!needle) return true;
          return (
            item.name.toLowerCase().includes(needle) ||
            (item.description ?? '').toLowerCase().includes(needle)
          );
        }),
      }))
      .filter((category) => category.items.length > 0);
  }, [menu.data, query, vegOnly]);

  async function handleAdd(item: MenuItemView) {
    if (addingId !== null) return;
    setAddingId(item.id);
    try {
      const detail = await service.getItem(slug, item.id);
      if (hasRequiredChoices(detail)) {
        navigate(`/r/${slug}/item/${item.id}`);
        return;
      }
      const variant = defaultVariant(detail);
      addItem({
        menuItemId: detail.id,
        name: detail.name,
        imageUrl: detail.imageUrl,
        basePrice: detail.price + (variant?.priceDelta ?? 0),
        ...(variant ? { variantId: variant.id, variantName: variant.name } : {}),
        modifiers: [],
        quantity: 1,
      });
      toast.success(`${detail.name} added to cart`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setAddingId(null);
    }
  }

  if (menu.isPending) {
    return (
      <>
        <PageHeader title="Menu" back />
        <PageSkeleton />
      </>
    );
  }

  if (menu.isError || !menu.data) {
    return (
      <>
        <PageHeader title="Menu" back />
        <ErrorState error={menu.error} onRetry={() => void menu.refetch()} />
      </>
    );
  }

  const noResults = categories.length === 0;

  return (
    <>
      <PageHeader
        title={menu.data.restaurantName}
        subtitle={
          orderType === 'dine-in' && tableNumber
            ? `Table ${tableNumber} · Dine-in`
            : 'Pickup order'
        }
        right={
          <Link
            to={`/r/${slug}/cart`}
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary"
            aria-label={`Cart with ${count} items`}
          >
            <ShoppingBag className="h-4.5 w-4.5" aria-hidden />
            {count > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
                {count}
              </span>
            ) : null}
          </Link>
        }
      />

      <div className="border-b border-border bg-background px-4 pb-3 pt-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search dishes…"
            aria-label="Search dishes"
            className="pr-9 pl-9"
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted hover:bg-background"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setVegOnly((value) => !value)}
            aria-pressed={vegOnly}
            className={cn(
              'flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors',
              vegOnly
                ? 'border-success bg-success-soft text-success'
                : 'border-border bg-card text-muted hover:text-foreground',
            )}
          >
            <VegMark vegetarian />
            Veg only
          </button>
          <Link
            to={`/r/${slug}/`}
            className="ml-auto text-[11px] text-muted hover:text-foreground"
          >
            {restaurant.data?.name ?? menu.data.restaurantName}
          </Link>
        </div>
      </div>

      <CategoryNav categories={categories} />

      <div className="px-4 pb-6 pt-4">
        {noResults ? (
          <EmptyState
            icon={Search}
            title="No dishes found"
            description={
              vegOnly
                ? 'No vegetarian dishes match your search. Try clearing the filter.'
                : 'Try a different dish name or clear your search.'
            }
            action={
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => {
                  setQuery('');
                  setVegOnly(false);
                }}
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <div className="space-y-7">
            {categories.map((category) => (
              <section key={category.id} id={`category-${category.id}`} className="scroll-mt-32">
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <h2 className="text-base font-semibold">{category.name}</h2>
                  <span className="text-xs text-muted">{category.items.length} items</span>
                </div>
                <ul className="space-y-3">
                  {category.items.map((item) => (
                    <MenuListItem
                      key={item.id}
                      item={item}
                      currency={currency}
                      href={`/r/${slug}/item/${item.id}`}
                      adding={addingId === item.id}
                      onAdd={() => void handleAdd(item)}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      <CartBar
        slug={slug}
        count={count}
        subtotal={subtotal}
        currency={currency}
      />
    </>
  );
}
