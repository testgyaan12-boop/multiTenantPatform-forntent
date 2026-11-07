import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { QrCode } from 'lucide-react';
import { service } from '@/services';
import { useSessionStore } from '@/stores/session.store';
import { useCartStore } from '@/stores/cart.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorState } from '@/components/common/error-state';

export function TableEntryPage() {
  const { tableCode } = useParams();
  const navigate = useNavigate();
  const setSession = useSessionStore((state) => state.setSession);
  const setOrderType = useCartStore((state) => state.setOrderType);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const info = await service.createSession({ tableCode });
        if (cancelled) return;
        if (!info.restaurantSlug) {
          throw { status: 404, code: 'not_found', message: 'This QR code has no restaurant attached.' };
        }
        setSession(info.restaurantSlug, info, 'dine-in');
        setOrderType('dine-in');
        navigate(`/r/${info.restaurantSlug}/menu`, { replace: true });
      } catch (caught) {
        if (!cancelled) setError(caught);
      }
    }

    void start();
    return () => {
      cancelled = true;
    };
  }, [tableCode, navigate, setSession, setOrderType]);

  if (error) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
        <Card>
          <CardContent className="pt-5">
            <ErrorState error={error} title="We couldn't scan that table" />
            <div className="flex justify-center pb-4">
              <Button asChild variant="outline" size="sm">
                <Link to="/">Start without a table</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white">
        <QrCode className="h-8 w-8" aria-hidden />
      </span>
      <div>
        <h1 className="text-lg font-semibold">Joining your table…</h1>
        <p className="mt-1 text-sm text-muted">Preparing the menu for you.</p>
      </div>
      <div className="h-1.5 w-40 overflow-hidden rounded-full bg-border">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
      </div>
    </main>
  );
}
