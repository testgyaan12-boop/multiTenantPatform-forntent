import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreditCard, Info, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { service } from '@/services';
import { errorMessage } from '@/lib/api-client';
import { formatCurrency } from '@/lib/format-currency';
import { estimateTotals, round, serviceLabel, taxLabel } from '@/lib/cart-totals';
import { rememberOrder } from '@/lib/order-history';
import type { CartTotals } from '@/types';
import { checkoutSchema, type CheckoutFormValues } from '@/schemas/checkout.schema';
import { useRestaurant } from '@/hooks/use-restaurant';
import { ensureGuestSession, resolveOrderType } from '@/hooks/use-ensure-session';
import { useCartStore } from '@/stores/cart.store';
import { useSessionStore } from '@/stores/session.store';
import { useProfileStore } from '@/stores/profile.store';
import { PageHeader } from '@/components/layout/page-header';
import { CartTotalsCard } from '@/components/cart/cart-totals';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

const TIP_PERCENTS = [0, 5, 10, 15];

function fieldError(form: ReturnType<typeof useForm<CheckoutFormValues>>, name: keyof CheckoutFormValues) {
  const error = form.formState.errors[name];
  return error ? error.message : undefined;
}

export function CheckoutPage() {
  const { restaurantSlug = '' } = useParams();
  const slug = restaurantSlug;
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);
  const clearLocalCart = useCartStore((state) => state.clear);
  const restaurant = useRestaurant(slug);
  const profile = useProfileStore((state) => state.profile);
  const orderType = resolveOrderType(slug);
  const tableNumber = useSessionStore((state) => state.getSession(slug, 'dine-in')?.tableNumber);

  const [step, setStep] = useState<'details' | 'review'>('details');
  const [serverTotals, setServerTotals] = useState<CartTotals | null>(null);
  const [sessionError, setSessionError] = useState<unknown>(null);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [tipPercent, setTipPercent] = useState(0);
  const idempotencyRef = useRef<string | null>(null);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: profile?.name ?? '',
      customerPhone: profile?.phone ?? '',
      customerEmail: profile?.email ?? '',
      notes: profile?.diningNotes ?? '',
    },
  });

  const currency = restaurant.data?.currency ?? 'USD';
  const estimate = estimateTotals({
    items,
    taxRate: restaurant.data?.taxRate ?? 0,
    serviceChargeRate: restaurant.data?.serviceChargeRate ?? 0,
    currency,
  });
  const subtotal = estimate.subtotal;
  const tipAmount = round((subtotal * tipPercent) / 100);

  if (items.length === 0 && !placed) {
    return <Navigate to={`/r/${slug}/cart`} replace />;
  }

  async function enterReview(values: CheckoutFormValues) {
    setSessionError(null);
    try {
      const session = await ensureGuestSession(slug, orderType);
      await service.clearCart(session.sessionToken);
      const totals = await service.prepareCheckout(
        session.sessionToken,
        items.map((item) => ({
          menuItemId: item.menuItemId,
          variantId: item.variantId,
          quantity: item.quantity,
          notes: item.notes,
          modifierIds: item.modifiers.map((modifier) => modifier.modifierId),
        })),
      );
      setServerTotals(totals);
      setStep('review');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return { session, values };
    } catch (error) {
      setSessionError(error);
      return null;
    }
  }

  async function placeOrder() {
    if (placing) return;
    setPlacing(true);
    setSessionError(null);
    try {
      const session = await ensureGuestSession(slug, orderType);
      const values = form.getValues();
      if (!idempotencyRef.current) {
        idempotencyRef.current =
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      }

      let order;
      try {
        order = await service.createOrder(session.sessionToken, {
          customerName: values.customerName,
          customerPhone: values.customerPhone,
          customerEmail: values.customerEmail,
          notes: values.notes,
          tipAmount,
        });
      } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'cart_empty') {
          toast.error('Your cart changed. Please review your order again.');
          setStep('details');
          return;
        }
        throw error;
      }

      try {
        await service.payOrder(order.publicToken, idempotencyRef.current);
      } catch (error) {
        toast.warning('Order placed, but payment needs your attention.', {
          description: errorMessage(error),
        });
        setPlaced(true);
        rememberOrder({
          publicToken: order.publicToken,
          orderNumber: order.orderNumber,
          restaurantSlug: slug,
          restaurantName: restaurant.data?.name ?? 'Restaurant',
        });
        navigate(`/r/${slug}/order/${order.publicToken}/tracking`, { replace: true });
        clearLocalCart();
        return;
      }

      toast.success('Order confirmed!', {
        description: `${order.orderNumber} · payment complete (demo)`,
      });
      rememberOrder({
        publicToken: order.publicToken,
        orderNumber: order.orderNumber,
        restaurantSlug: slug,
        restaurantName: restaurant.data?.name ?? 'Restaurant',
      });
      setPlaced(true);
      navigate(`/r/${slug}/order/${order.publicToken}/tracking`, { replace: true });
      clearLocalCart();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPlacing(false);
    }
  }

  const totalsRows = [
    { label: 'Subtotal', value: formatCurrency(estimate.subtotal, currency), strong: true },
    { label: taxLabel(restaurant.data), value: formatCurrency(estimate.taxTotal, currency) },
    { label: serviceLabel(restaurant.data), value: formatCurrency(estimate.serviceCharge, currency) },
    ...(tipAmount > 0
      ? [{ label: 'Tip', value: formatCurrency(tipAmount, currency) }]
      : []),
  ];

  if (placed) return null;

  return (
    <>
      <PageHeader
        title={step === 'details' ? 'Checkout' : 'Review order'}
        subtitle={
          orderType === 'dine-in' ? `Table ${tableNumber ?? '—'} · Dine-in` : 'Pickup order'
        }
        back
        right={
          <span className="text-xs font-medium text-muted">
            Step {step === 'details' ? '1' : '2'} of 2
          </span>
        }
      />

      <div className="space-y-4 px-4 py-4">
        {sessionError ? (
          <Alert variant="destructive">
            <AlertTitle>Session problem</AlertTitle>
            <AlertDescription>
              {errorMessage(sessionError)}{' '}
              <Link to={`/r/${slug}/cart`} className="font-medium underline">
                Back to cart
              </Link>
            </AlertDescription>
          </Alert>
        ) : null}

        {step === 'details' ? (
          <form
            onSubmit={form.handleSubmit((values) => void enterReview(values))}
            className="space-y-5"
            noValidate
          >
            <section className="rounded-xl border border-border bg-card p-4">
              <h2 className="mb-4 text-sm font-semibold">Your details</h2>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="customerName">Name *</Label>
                  <Input
                    id="customerName"
                    autoComplete="name"
                    aria-invalid={Boolean(fieldError(form, 'customerName'))}
                    {...form.register('customerName')}
                  />
                  {fieldError(form, 'customerName') ? (
                    <p className="text-xs text-destructive">{fieldError(form, 'customerName')}</p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="customerPhone">Mobile number *</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+1 555 0100"
                    aria-invalid={Boolean(fieldError(form, 'customerPhone'))}
                    {...form.register('customerPhone')}
                  />
                  {fieldError(form, 'customerPhone') ? (
                    <p className="text-xs text-destructive">{fieldError(form, 'customerPhone')}</p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="customerEmail">Email · optional</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    autoComplete="email"
                    aria-invalid={Boolean(fieldError(form, 'customerEmail'))}
                    {...form.register('customerEmail')}
                  />
                  {fieldError(form, 'customerEmail') ? (
                    <p className="text-xs text-destructive">{fieldError(form, 'customerEmail')}</p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="orderNotes">Order notes · optional</Label>
                  <Textarea
                    id="orderNotes"
                    rows={3}
                    placeholder="Allergies, timing, packaging…"
                    {...form.register('notes')}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Add a tip</h2>
                <span className="text-xs text-muted">100% goes to the team</span>
              </div>
              <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Tip amount">
                {TIP_PERCENTS.map((percent) => (
                  <button
                    key={percent}
                    type="button"
                    role="radio"
                    aria-checked={tipPercent === percent}
                    onClick={() => setTipPercent(percent)}
                    className={
                      tipPercent === percent
                        ? 'rounded-lg border border-primary bg-primary-soft py-2 text-sm font-semibold text-primary'
                        : 'rounded-lg border border-border bg-card py-2 text-sm text-muted hover:text-foreground'
                    }
                  >
                    {percent === 0 ? 'None' : `${percent}%`}
                  </button>
                ))}
              </div>
              {tipAmount > 0 ? (
                <p className="mt-2 text-xs text-muted">
                  Tip: {formatCurrency(tipAmount, currency)}
                </p>
              ) : null}
            </section>

            <CartTotalsCard
              rows={totalsRows}
              grandTotal={formatCurrency(estimate.grandTotal + tipAmount, currency)}
              currencyNote="Taxes and service charge are re-checked on the next step."
            />

            <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Preparing your order…' : 'Review order'}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <section className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">Order for {form.watch('customerName')}</h2>
                  <p className="mt-0.5 text-xs text-muted">
                    {orderType === 'dine-in'
                      ? `Dine-in · Table ${tableNumber ?? '—'}`
                      : 'Pickup at the counter'}{' '}
                    · {items.reduce((sum, item) => sum + item.quantity, 0)} items
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Edit details
                </button>
              </div>
            </section>

            {serverTotals ? (
              <CartTotalsCard
                rows={[
                  { label: 'Subtotal', value: formatCurrency(serverTotals.subtotal, currency), strong: true },
                  { label: taxLabel(restaurant.data), value: formatCurrency(serverTotals.taxTotal, currency) },
                  { label: serviceLabel(restaurant.data), value: formatCurrency(serverTotals.serviceCharge, currency) },
                  ...(serverTotals.tipTotal > 0
                    ? [{ label: 'Tip', value: formatCurrency(serverTotals.tipTotal, currency) }]
                    : []),
                  ...(serverTotals.discountTotal > 0
                    ? [{ label: 'Discount', value: `−${formatCurrency(serverTotals.discountTotal, currency)}`, muted: true }]
                    : []),
                ]}
                grandTotal={formatCurrency(serverTotals.grandTotal, currency)}
                currencyNote="Confirmed by the kitchen's pricing."
              />
            ) : null}

            <section className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <CreditCard className="h-4.5 w-4.5" aria-hidden />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Demo card ···· 4242</p>
                  <p className="text-xs text-muted">Sandbox payment — no real charge</p>
                </div>
                <Badge variant="outline">Sandbox</Badge>
              </div>
              <Separator className="my-3" />
              <p className="flex items-start gap-2 text-xs text-muted">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
                This is a demo checkout. Payment is simulated and you can safely cancel any time.
              </p>
            </section>

            <Alert variant="info">
              <Info className="h-4 w-4" aria-hidden />
              <AlertDescription>
                Placing the order reserves it immediately — you&apos;ll see live status right after.
              </AlertDescription>
            </Alert>

            <Button
              size="lg"
              className="w-full"
              onClick={() => void placeOrder()}
              disabled={placing}
            >
              {placing
                ? 'Placing order…'
                : serverTotals
                  ? `Place order · ${formatCurrency(serverTotals.grandTotal, currency)}`
                  : 'Place order'}
            </Button>
            <button
              type="button"
              onClick={() => setStep('details')}
              className="w-full text-center text-sm font-medium text-muted hover:text-foreground"
            >
              ← Back to details
            </button>
          </div>
        )}
      </div>
    </>
  );
}
