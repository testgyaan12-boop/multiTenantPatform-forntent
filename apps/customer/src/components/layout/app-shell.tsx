import { useEffect } from 'react';
import { Outlet, useLocation, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { DEFAULT_RESTAURANT } from '@/lib/env';
import { useCartStore } from '@/stores/cart.store';
import { useSessionStore } from '@/stores/session.store';
import { useRestaurant } from '@/hooks/use-restaurant';
import { BottomNav } from './bottom-nav';
import { OfflineBanner } from '@/components/common/offline-banner';

export function AppShell() {
  const { restaurantSlug } = useParams();
  const slug = restaurantSlug ?? DEFAULT_RESTAURANT;
  const location = useLocation();
  const restaurant = useRestaurant(slug);
  const setRestaurant = useCartStore((state) => state.setRestaurant);
  const setOrderType = useCartStore((state) => state.setOrderType);
  const orderType = useCartStore((state) => state.orderType);

  useEffect(() => {
    const data = restaurant.data;
    if (data) {
      setRestaurant({ slug: data.slug, name: data.name, currency: data.currency });
    }
  }, [restaurant.data, setRestaurant]);

  useEffect(() => {
    const dineIn = useSessionStore.getState().getSession(slug, 'dine-in');
    if (dineIn && orderType !== 'dine-in') setOrderType('dine-in');
  }, [slug, orderType, setOrderType]);

  const hideNav = location.pathname.endsWith('/checkout');

  return (
    <div className="min-h-dvh">
      <OfflineBanner />
      <main className={cn('mx-auto w-full max-w-3xl', hideNav ? 'pb-8' : 'pb-28')}>
        <Outlet />
      </main>
      {!hideNav && <BottomNav slug={slug} />}
    </div>
  );
}
