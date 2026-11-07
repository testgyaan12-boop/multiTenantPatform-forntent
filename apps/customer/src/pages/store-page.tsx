import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BadgeIndianRupee, Clock, Mail, Phone, Send, Store } from 'lucide-react';
import { EnquiryDialog } from '@/components/store/enquiry-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { ItemImage } from '@/components/common/item-image';
import { PageSkeleton } from '@/components/common/loading-state';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useStore, useStoreProducts } from '@/hooks/use-store';
import { formatCurrency } from '@/lib/format-currency';
import type { StoreProduct } from '@/types';

const TYPE_LABELS: Record<string, string> = {
  RESTAURANT: 'Restaurant',
  ELECTRONICS: 'Electronics store',
  VEHICLE: 'Vehicle dealership',
  REAL_ESTATE: 'Real estate',
};

function StockBadge({ product }: { product: StoreProduct }) {
  if (!product.available) return <Badge variant="outline">Unavailable</Badge>;
  if (product.stockQty === 0) return <Badge variant="outline">Out of stock</Badge>;
  if (product.stockQty != null && product.stockQty > 0 && product.stockQty <= 3) {
    return <Badge variant="outline">Only {product.stockQty} left</Badge>;
  }
  return null;
}

export function StorePage() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const store = useStore(storeSlug);
  const products = useStoreProducts(storeSlug);
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  if (store.isLoading || products.isLoading) return <PageSkeleton />;
  if (store.isError) {
    return (
      <div className="min-h-dvh">
        <PageHeader title="Store" back />
        <div className="mx-auto max-w-3xl px-4 py-6">
          <ErrorState error={store.error} title="Store not found" onRetry={() => store.refetch()} />
        </div>
      </div>
    );
  }
  if (products.isError) {
    return (
      <div className="min-h-dvh">
        <PageHeader title={store.data?.name ?? 'Store'} back />
        <div className="mx-auto max-w-3xl px-4 py-6">
          <ErrorState error={products.error} title="Could not load products" onRetry={() => products.refetch()} />
        </div>
      </div>
    );
  }

  const info = store.data;
  const data = products.data;
  if (!info || !data) return <PageSkeleton />;

  const currency = info.currency;
  const totalItems = data.categories.reduce((sum, category) => sum + category.items.length, 0);

  return (
    <div className="min-h-dvh pb-16">
      <PageHeader
        title={info.name}
        subtitle={[TYPE_LABELS[info.businessType] ?? info.businessType, info.cuisine]
          .filter(Boolean)
          .join(' · ')}
        right={
          <Button size="sm" onClick={() => setEnquiryOpen(true)}>
            <Send className="mr-1.5 h-4 w-4" />
            Enquire
          </Button>
        }
      />
      <main className="mx-auto max-w-3xl px-4 py-4">
        <Card>
          <CardContent className="flex gap-4 p-4">
            {info.logoUrl ? (
              <ItemImage src={info.logoUrl} alt={info.name} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Store className="h-7 w-7 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0 space-y-1">
              {info.description ? (
                <p className="text-sm text-muted line-clamp-2">{info.description}</p>
              ) : null}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                {info.operatingHours ? (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {info.operatingHours}
                  </span>
                ) : null}
                {info.contactPhone ? (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {info.contactPhone}
                  </span>
                ) : null}
                {info.contactEmail ? (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {info.contactEmail}
                  </span>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        {info.bookingPayment.enabled && info.bookingPayment.amount > 0 ? (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
            <BadgeIndianRupee className="h-4 w-4 shrink-0" />
            <span>
              Booking payment of{' '}
              <span className="font-semibold">{formatCurrency(info.bookingPayment.amount, currency)}</span>{' '}
              applies when you send an enquiry for a booking.
            </span>
          </div>
        ) : null}

        <div className="mt-5 space-y-6">
          {totalItems === 0 ? (
            <EmptyState
              title="No products yet"
              description="This store has not published any products."
            />
          ) : (
            data.categories.map((category) => (
              <section key={category.id}>
                <h2 className="mb-3 text-base font-semibold">{category.name}</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {category.items.map((item) => (
                    <Link key={item.id} to={`/s/${info.slug}/p/${item.id}`} className="group">
                      <Card className="h-full transition-colors group-hover:border-primary/50">
                        <CardContent className="p-3">
                          {item.imageUrl ? (
                            <ItemImage
                              src={item.imageUrl}
                              alt={item.name}
                              className="mb-2 h-24 w-full rounded-md object-cover"
                            />
                          ) : (
                            <div className="mb-2 flex h-24 w-full items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                              No image
                            </div>
                          )}
                          <p className="line-clamp-1 text-sm font-medium">{item.name}</p>
                          <p className="mt-0.5 text-sm font-semibold">{formatCurrency(item.price, currency)}</p>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            <StockBadge product={item} />
                            {item.featured ? <Badge variant="default">Popular</Badge> : null}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </main>

      <EnquiryDialog
        open={enquiryOpen}
        onOpenChange={setEnquiryOpen}
        slug={info.slug}
        currency={currency}
      />
    </div>
  );
}
