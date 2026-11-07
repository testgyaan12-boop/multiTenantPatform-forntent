import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ItemPage } from '@/pages/item-page';
import { useCartStore } from '@/stores/cart.store';
import { renderPage } from '@/test/render';

const PATH = '/r/:restaurantSlug/item/:itemKey';

describe('ItemPage', () => {
  it('loads the dish with its options', async () => {
    renderPage(<ItemPage />, { path: PATH, route: '/r/the-spice-house/item/1' });

    expect(await screen.findByRole('heading', { name: 'Paneer Tikka' })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Spice level' })).toBeInTheDocument();
    expect(screen.getByText(/char-grilled cottage cheese/i)).toBeInTheDocument();
  });

  it('resolves items by name slug', async () => {
    renderPage(<ItemPage />, { path: PATH, route: '/r/the-spice-house/item/butter-naan' });

    expect(await screen.findByRole('heading', { name: 'Butter Naan' })).toBeInTheDocument();
  });

  it('blocks adding until a required choice is made', async () => {
    const user = userEvent.setup();
    renderPage(<ItemPage />, { path: PATH, route: '/r/the-spice-house/item/1' });
    await screen.findByRole('heading', { name: 'Paneer Tikka' });

    await user.click(screen.getByRole('button', { name: /add to cart/i }));

    expect(
      await screen.findByText(/please choose spice level/i),
    ).toBeInTheDocument();
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('adds the configured dish to the cart', async () => {
    const user = userEvent.setup();
    renderPage(<ItemPage />, { path: PATH, route: '/r/the-spice-house/item/1' });
    await screen.findByRole('heading', { name: 'Paneer Tikka' });

    await user.click(screen.getByRole('radio', { name: /mild/i }));
    await user.click(screen.getByRole('button', { name: /add to cart/i }));

    await waitFor(() => expect(useCartStore.getState().items).toHaveLength(1));
    const line = useCartStore.getState().items[0];
    expect(line?.name).toBe('Paneer Tikka');
    expect(line?.modifiers[0]?.name).toBe('Mild');
    expect(line?.quantity).toBe(1);
  });

  it('honours quantity stepper up to the max', async () => {
    const user = userEvent.setup();
    renderPage(<ItemPage />, { path: PATH, route: '/r/the-spice-house/item/4' });
    await screen.findByRole('heading', { name: 'Butter Naan' });

    const increase = screen.getByRole('button', { name: /increase quantity/i });
    await user.click(increase);
    await user.click(increase);
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
