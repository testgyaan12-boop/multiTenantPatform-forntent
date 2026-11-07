import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, Clock, Flame } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { service } from '@/services';
import { cn, slugify } from '@/lib/utils';
import { formatCurrency } from '@/lib/format-currency';
import type { ModifierGroupView } from '@/types';
import { useMenu, useRestaurant } from '@/hooks/use-restaurant';
import { useCartStore } from '@/stores/cart.store';
import { PageHeader } from '@/components/layout/page-header';
import { ItemImage } from '@/components/common/item-image';
import { VegMark } from '@/components/common/veg-mark';
import { QuantityStepper } from '@/components/common/quantity-stepper';
import { ErrorState } from '@/components/common/error-state';
import { PageSkeleton } from '@/components/common/loading-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

const MAX_QUANTITY = 20;

function isNumeric(value: string): boolean {
  return /^\d+$/.test(value);
}

function defaultVariantId(group: { id: number; isDefault: boolean }[]): number | null {
  return group.find((variant) => variant.isDefault)?.id ?? group[0]?.id ?? null;
}

export function ItemPage() {
  const { restaurantSlug = '', itemKey = '' } = useParams();
  const slug = restaurantSlug;
  const navigate = useNavigate();
  const menu = useMenu(slug);
  const restaurant = useRestaurant(slug);
  const addItem = useCartStore((state) => state.addItem);
  const currency = restaurant.data?.currency ?? menu.data?.currency ?? 'USD';

  const resolvedId = useMemo(() => {
    if (isNumeric(itemKey)) return Number(itemKey);
    const items = (menu.data?.categories ?? []).flatMap((category) => category.items);
    return items.find((item) => slugify(item.name) === itemKey)?.id ?? null;
  }, [itemKey, menu.data]);

  const detail = useQuery({
    queryKey: ['item', slug, resolvedId],
    queryFn: () => service.getItem(slug, resolvedId as number),
    enabled: resolvedId !== null,
    staleTime: 5 * 60_000,
  });

  const item = detail.data;
  const [variantId, setVariantId] = useState<number | null>(null);
  const [selections, setSelections] = useState<Record<number, number[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!item) return;
    setVariantId(defaultVariantId(item.variants));
    setSelections(
      Object.fromEntries(item.modifierGroups.map((group) => [group.id, []])) as Record<
        number,
        number[]
      >,
    );
    setShowErrors(false);
    setQuantity(1);
    setNotes('');
  }, [item]);

  const modifierTotal = useMemo(() => {
    if (!item) return 0;
    let total = 0;
    for (const group of item.modifierGroups) {
      for (const modifierId of selections[group.id] ?? []) {
        const modifier = group.modifiers.find((candidate) => candidate.id === modifierId);
        if (modifier) total += modifier.priceDelta;
      }
    }
    return total;
  }, [item, selections]);

  const variantDelta = useMemo(() => {
    if (!item) return 0;
    return item.variants.find((variant) => variant.id === variantId)?.priceDelta ?? 0;
  }, [item, variantId]);

  const lineTotal = item ? (item.price + variantDelta + modifierTotal) * quantity : 0;

  function groupError(group: ModifierGroupView): string | null {
    const chosen = selections[group.id]?.length ?? 0;
    if (group.isRequired && chosen < group.minSelections) {
      if (group.selectionType === 'SINGLE') return `Please choose ${group.name.toLowerCase()}.`;
      return `Select at least ${group.minSelections} for ${group.name.toLowerCase()}.`;
    }
    return null;
  }

  function toggleModifier(group: ModifierGroupView, modifierId: number) {
    setSelections((current) => {
      const chosen = current[group.id] ?? [];
      if (group.selectionType === 'SINGLE') {
        return { ...current, [group.id]: [modifierId] };
      }
      if (chosen.includes(modifierId)) {
        return { ...current, [group.id]: chosen.filter((id) => id !== modifierId) };
      }
      if (chosen.length >= group.maxSelections) return current;
      return { ...current, [group.id]: [...chosen, modifierId] };
    });
  }

  function handleAdd() {
    if (!item) return;
    const errors = item.modifierGroups.map(groupError).filter(Boolean);
    if (errors.length > 0 || (item.variants.length > 0 && variantId === null)) {
      setShowErrors(true);
      toast.error('Please finish choosing your options.');
      return;
    }

    const variant = item.variants.find((candidate) => candidate.id === variantId) ?? null;
    const modifiers = item.modifierGroups.flatMap((group) =>
      (selections[group.id] ?? []).map((modifierId) => {
        const modifier = group.modifiers.find((candidate) => candidate.id === modifierId);
        return {
          modifierId,
          name: modifier?.name ?? '',
          priceDelta: modifier?.priceDelta ?? 0,
        };
      }),
    );

    addItem({
      menuItemId: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      basePrice: item.price + variantDelta,
      ...(variant ? { variantId: variant.id, variantName: variant.name } : {}),
      modifiers,
      quantity,
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    });
    toast.success(`${item.name} added to cart`);
    navigate(`/r/${slug}/menu`);
  }

  if (detail.isPending || menu.isPending) {
    return (
      <>
        <PageHeader title="Dish details" back />
        <PageSkeleton />
      </>
    );
  }

  if (detail.isError || !item) {
    return (
      <>
        <PageHeader title="Dish details" back />
        <ErrorState
          error={detail.error}
          title="We couldn't load this dish"
          onRetry={() => void detail.refetch()}
        />
        <div className="flex justify-center pb-8">
          <Button asChild variant="outline" size="sm">
            <Link to={`/r/${slug}/menu`}>Back to menu</Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Dish details" subtitle={item.name} back />

      <div className="relative">
        <ItemImage
          src={item.imageUrl}
          alt={item.name}
          eager
          className="h-56 w-full sm:h-72"
        />
        {!item.isAvailable ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Badge variant="destructive" className="px-4 py-1.5 text-sm">
              Sold out right now
            </Badge>
          </div>
        ) : null}
      </div>

      <div className="space-y-6 px-4 pt-4">
        <header>
          <div className="flex items-start gap-2">
            <span className="mt-1">
              <VegMark vegetarian={item.isVegetarian} />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold leading-tight">{item.name}</h1>
              <p className="mt-1 text-xl font-semibold text-primary">
                {formatCurrency(item.price + variantDelta, currency)}
              </p>
            </div>
            {item.isFeatured ? <Badge variant="accent">Chef&apos;s pick</Badge> : null}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-3 text-xs text-muted">
            {item.prepTimeMinutes ? (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                {item.prepTimeMinutes} min
              </span>
            ) : null}
            {item.calories ? (
              <span className="flex items-center gap-1">
                <Flame className="h-3.5 w-3.5" aria-hidden />
                {item.calories} kcal
              </span>
            ) : null}
          </div>
          {item.description ? (
            <p className="mt-3 text-sm leading-relaxed text-muted">{item.description}</p>
          ) : null}
        </header>

        {item.variants.length > 0 ? (
          <section>
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                Size <span className="text-muted">· required</span>
              </h2>
            </div>
            <div className="grid gap-2" role="radiogroup" aria-label="Choose a size">
              {item.variants.map((variant) => {
                const active = variantId === variant.id;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setVariantId(variant.id)}
                    className={cn(
                      'flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm transition-colors',
                      active
                        ? 'border-primary bg-primary-soft'
                        : 'border-border bg-card hover:border-primary/40',
                    )}
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <span
                        className={cn(
                          'flex h-4.5 w-4.5 items-center justify-center rounded-full border',
                          active ? 'border-primary bg-primary text-white' : 'border-muted',
                        )}
                      >
                        {active ? <Check className="h-3 w-3" aria-hidden /> : null}
                      </span>
                      {variant.name}
                    </span>
                    <span className="text-muted">
                      {variant.priceDelta > 0
                        ? `+${formatCurrency(variant.priceDelta, currency)}`
                        : 'Included'}
                    </span>
                  </button>
                );
              })}
            </div>
            {showErrors && item.variants.length > 0 && variantId === null ? (
              <p className="mt-1.5 text-xs text-destructive">Please choose a size.</p>
            ) : null}
          </section>
        ) : null}

        {item.modifierGroups.map((group) => {
          const chosen = selections[group.id] ?? [];
          const error = showErrors ? groupError(group) : null;
          const multi = group.selectionType === 'MULTI';
          return (
            <section key={group.id}>
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="text-sm font-semibold">
                  {group.name}{' '}
                  <span className={group.isRequired ? 'text-muted' : 'text-muted/70'}>
                    · {group.isRequired ? 'required' : `optional${multi ? ` · up to ${group.maxSelections}` : ''}`}
                  </span>
                </h2>
                {multi ? (
                  <span className="text-xs text-muted">
                    {chosen.length}/{group.maxSelections}
                  </span>
                ) : null}
              </div>
              <div
                role={multi ? 'group' : 'radiogroup'}
                aria-label={group.name}
                className="grid gap-2"
              >
                {group.modifiers.map((modifier) => {
                  const active = chosen.includes(modifier.id);
                  const disabled =
                    !active && multi && chosen.length >= group.maxSelections;
                  return (
                    <button
                      key={modifier.id}
                      type="button"
                      role={multi ? 'checkbox' : 'radio'}
                      aria-checked={active}
                      disabled={disabled}
                      onClick={() => toggleModifier(group, modifier.id)}
                      className={cn(
                        'flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm transition-colors disabled:opacity-45',
                        active
                          ? 'border-primary bg-primary-soft'
                          : 'border-border bg-card hover:border-primary/40',
                      )}
                    >
                      <span className="flex items-center gap-2.5 font-medium">
                        <span
                          className={cn(
                            multi ? 'rounded-[4px]' : 'rounded-full',
                            'flex h-4.5 w-4.5 items-center justify-center border',
                            active ? 'border-primary bg-primary text-white' : 'border-muted',
                          )}
                        >
                          {active ? <Check className="h-3 w-3" aria-hidden /> : null}
                        </span>
                        {modifier.name}
                      </span>
                      <span className="text-muted">
                        {modifier.priceDelta > 0
                          ? `+${formatCurrency(modifier.priceDelta, currency)}`
                          : 'Free'}
                      </span>
                    </button>
                  );
                })}
              </div>
              {error ? <p className="mt-1.5 text-xs text-destructive">{error}</p> : null}
            </section>
          );
        })}

        <section>
          <label htmlFor="item-notes" className="mb-2 block text-sm font-semibold">
            Add a note <span className="font-normal text-muted">· optional</span>
          </label>
          <Textarea
            id="item-notes"
            value={notes}
            maxLength={200}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="e.g. less spicy, no onions…"
          />
        </section>

        <Separator />

        <section className="flex items-center justify-between gap-3 pb-2">
          <div>
            <p className="text-sm font-semibold">Quantity</p>
            <p className="text-xs text-muted">Max {MAX_QUANTITY} per item</p>
          </div>
          <QuantityStepper
            value={quantity}
            onChange={(value) => setQuantity(Math.min(MAX_QUANTITY, Math.max(1, value)))}
            max={MAX_QUANTITY}
          />
        </section>
      </div>

      <div className="sticky bottom-[calc(3.5rem+max(env(safe-area-inset-bottom),0.75rem))] z-30 mt-4 border-t border-border bg-card/95 px-4 py-3 backdrop-blur">
        <Button
          size="lg"
          className="w-full"
          disabled={!item.isAvailable}
          onClick={handleAdd}
        >
          {item.isAvailable ? (
            <>
              Add to cart · {formatCurrency(lineTotal, currency)}
            </>
          ) : (
            'Currently unavailable'
          )}
        </Button>
      </div>
    </>
  );
}
