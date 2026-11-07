import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartPage } from '@/pages/cart-page';
import { useCartStore } from '@/stores/cart.store';
import { renderPage } from '@/test/render';

const PATH = '/r/:restaurantSlug/cart';

describe('CartPage', () => {
  it('shows an empty state without items', async () => {
    renderPage(<CartPage />, { path: PATH, route: '/r/the-spice-house/cart' });

    expect(await screen.findByText('Your cart is empty')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse menu' })).toHaveAttribute(
      'href',
      '/r/the-spice-house/menu',
    );
  });

  it('lists lines and estimates totals', async () => {
    useCartStore.setState({
      restaurant: { slug: 'the-spice-house', name: 'The Spice House', currency: 'INR' },
      items: [
        {
          key: 'line-1',
          menuItemId: 4,
          name: 'Butter Naan',
          basePrice: 49,
          modifiers: [],
          quantity: 2,
        },
      ],
    });

    renderPage(<CartPage />, { path: PATH, route: '/r/the-spice-house/cart' });

    expect(await screen.findByText('Butter Naan')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /go to checkout/i })).toBeInTheDocument();
    expect((await screen.findAllByText('₹98')).length).toBeGreaterThanOrEqual(2);
  });

  it('clears the cart from the header action', async () => {
    const user = userEvent.setup();
    useCartStore.setState({
      restaurant: { slug: 'the-spice-house', name: 'The Spice House', currency: 'INR' },
      items: [
        { key: 'line-1', menuItemId: 4, name: 'Butter Naan', basePrice: 49, modifiers: [], quantity: 1 },
      ],
    });

    renderPage(<CartPage />, { path: PATH, route: '/r/the-spice-house/cart' });
    await screen.findByText('Butter Naan');

    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(await screen.findByText('Your cart is empty')).toBeInTheDocument();
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
