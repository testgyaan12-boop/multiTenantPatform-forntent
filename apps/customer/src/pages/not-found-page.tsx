import { Link, useLocation, useParams } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  const { restaurantSlug } = useParams();
  const location = useLocation();
  const insideRestaurant = Boolean(restaurantSlug) || location.pathname.startsWith('/r/');
  const home = restaurantSlug ? `/r/${restaurantSlug}/menu` : '/';

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-accent-dark">
        <Compass className="h-8 w-8" aria-hidden />
      </span>
      <div>
        <h1 className="text-xl font-semibold">Page not found</h1>
        <p className="mt-1 text-sm text-muted">
          {insideRestaurant
            ? "This page doesn't exist for this restaurant."
            : 'The link may be outdated or mistyped.'}
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild>
          <Link to={home}>Back to menu</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/">Home</Link>
        </Button>
      </div>
    </main>
  );
}
