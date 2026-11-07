import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { CheckoutPage } from '@/pages/checkout-page';
import { HomePage } from '@/pages/home-page';
import { IndexRedirectPage } from '@/pages/index-redirect-page';
import { ItemPage } from '@/pages/item-page';
import { CartPage } from '@/pages/cart-page';
import { MenuPage } from '@/pages/menu-page';
import { NotFoundPage } from '@/pages/not-found-page';
import { OrderDetailsPage } from '@/pages/order-details-page';
import { OrderHistoryPage } from '@/pages/order-history-page';
import { ProfilePage } from '@/pages/profile-page';
import { StoreItemPage } from '@/pages/store-item-page';
import { StorePage } from '@/pages/store-page';
import { TableEntryPage } from '@/pages/table-entry-page';
import { TrackingPage } from '@/pages/tracking-page';

export const router = createBrowserRouter([
  { path: '/', element: <IndexRedirectPage /> },
  { path: '/t/:tableCode', element: <TableEntryPage /> },
  {
    path: '/s/:storeSlug',
    children: [
      { index: true, element: <StorePage /> },
      { path: 'p/:itemId', element: <StoreItemPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: '/r/:restaurantSlug',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'menu', element: <MenuPage /> },
      { path: 'item/:itemKey', element: <ItemPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'orders', element: <OrderHistoryPage /> },
      { path: 'orders/:orderId', element: <OrderDetailsPage /> },
      { path: 'order/:orderId/tracking', element: <TrackingPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
