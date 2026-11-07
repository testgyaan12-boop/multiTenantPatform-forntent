import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Send } from 'lucide-react';
import { EnquiryDialog } from '@/components/store/enquiry-dialog';
import { ErrorState } from '@/components/common/error-state';
import { ItemImage } from '@/components/common/item-image';
import { PageSkeleton } from '@/components/common/loading-state';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useStore, useStoreItem } from '@/hooks/use-store';
import { formatCurrency } from '@/lib/format-currency';

export function StoreItemPage() {
  const { storeSlug, itemId } = useParams<{ storeSlug: string; itemId: string }>();
  const parsedId = Number(itemId);
  const validId = Number.isFinite(parsedId) ? parsedId : undefined;
  const store = useStore(storeSlug);
  const item = useStoreItem(storeSlug, validId);
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  if (item.isLoading || store.isLoading) return <PageSkeleton />;
  if (item.isError || store.isError) {
    return (
      <div className="min-h-dvh">
        <PageHeader title="Product" back />
        <div className="mx-auto max-w-3xl px-4 py-6">
          <ErrorState
            error={item.error ?? store.error}
            title="Product not found"
            onRetry={() => item.refetch()}
          />
        </div>
      </div>
    );
  }

  const info = store.data;
  const product = item.data;
  if (!info || !product) return <PageSkeleton />;

  const currency = product.currency ?? info.currency;
  const stockBadge = (() => {
    if (!product.available) return <Badge variant="outline">Unavailable</Badge>;
    if (product.stockQty === 0) return <Badge variant="outline">Out of stock</Badge>;
    if (product.stockQty != null && product.stockQty > 0 && product.stockQty <= 3) {
      return <Badge variant="outline">Only {product.stockQty} left</Badge>;
    }
    if (product.featured) return <Badge>Popular</Badge>;
    return null;
  })();

  return (
    <div className="min-h-dvh pb-16">
      <PageHeader title={product.name} subtitle={info.name} back />
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-4">
        {product.imageUrl ? (
          <ItemImage
            src={product.imageUrl}
            alt={product.name}
            className="h-56 w-full rounded-xl object-cover"
            eager
          />
        ) : (
          <div className="flex h-56 w-full items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
            No image available
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{product.name}</h2>
            <p className="mt-1 text-2xl font-bold">{formatCurrency(product.price, currency)}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-1">
            {stockBadge}
            {product.sku ? (
              <Badge variant="accent">{product.sku}</Badge>
            ) : null}
          </div>
        </div>

        {product.description ? (
          <p className="text-sm leading-relaxed text-muted">{product.description}</p>
        ) : null}

        {product.attributes.length > 0 ? (
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-2 text-sm font-semibold">Specifications</h3>
              <dl className="divide-y divide-border text-sm">
                {product.attributes.map((attribute) => (
                  <div key={attribute.key} className="flex justify-between gap-4 py-2">
                    <dt className="text-muted">{attribute.key}</dt>
                    <dd className="text-right font-medium">{attribute.value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        ) : null}

        {product.variants.length > 0 ? (
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-2 text-sm font-semibold">Options</h3>
              <ul className="divide-y divide-border text-sm">
                {product.variants.map((variant) => (
                  <li key={variant.id} className="flex items-center justify-between gap-4 py-2">
                    <span>
                      {variant.name}
                      {variant.isDefault ? (
                        <span className="ml-2 text-xs text-muted">(default)</span>
                      ) : null}
                    </span>
                    <span className="font-medium">
                      {variant.priceDelta === 0
                        ? 'Included'
                        : `+${formatCurrency(variant.priceDelta, currency)}`}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        <Button
          className="w-full"
          size="lg"
          disabled={!product.available || product.stockQty === 0}
          onClick={() => setEnquiryOpen(true)}
        >
          <Send className="mr-2 h-4 w-4" />
          Send enquiry
        </Button>
        {info.bookingPayment.enabled && info.bookingPayment.amount > 0 ? (
          <p className="text-center text-xs text-muted">
            A booking payment of {formatCurrency(info.bookingPayment.amount, currency)} applies after
            you send your enquiry.
          </p>
        ) : null}
      </main>

      <EnquiryDialog
        open={enquiryOpen}
        onOpenChange={setEnquiryOpen}
        slug={info.slug}
        currency={currency}
        itemName={product.name}
      />
    </div>
  );
}
