import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MenuPage } from '@/pages/menu-page';
import { renderPage } from '@/test/render';

const PATH = '/r/:restaurantSlug/menu';
const ROUTE = '/r/the-spice-house/menu';

describe('MenuPage', () => {
  it('renders categories and dishes from the mock menu', async () => {
    renderPage(<MenuPage />, { path: PATH, route: ROUTE });

    expect(await screen.findByText('Paneer Tikka')).toBeInTheDocument();
    expect(screen.getByText('Chicken Biryani')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Starters' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Mains' })).toBeInTheDocument();
    expect(screen.getByText('Sold out')).toBeInTheDocument();
  });

  it('filters dishes with the search box', async () => {
    const user = userEvent.setup();
    renderPage(<MenuPage />, { path: PATH, route: ROUTE });
    await screen.findByText('Paneer Tikka');

    await user.type(screen.getByLabelText('Search dishes'), 'biryani');

    await waitFor(() => expect(screen.queryByText('Paneer Tikka')).not.toBeInTheDocument());
    expect(screen.getByText('Chicken Biryani')).toBeInTheDocument();
  });

  it('shows an empty state when nothing matches', async () => {
    const user = userEvent.setup();
    renderPage(<MenuPage />, { path: PATH, route: ROUTE });
    await screen.findByText('Paneer Tikka');

    await user.type(screen.getByLabelText('Search dishes'), 'zzzz-no-dish');

    expect(await screen.findByText('No dishes found')).toBeInTheDocument();
  });

  it('veg-only toggle hides non-vegetarian dishes', async () => {
    const user = userEvent.setup();
    renderPage(<MenuPage />, { path: PATH, route: ROUTE });
    await screen.findByText('Chicken Biryani');

    await user.click(screen.getByRole('button', { name: /veg only/i }));

    await waitFor(() => expect(screen.queryByText('Chicken Biryani')).not.toBeInTheDocument());
    expect(screen.getByText('Paneer Tikka')).toBeInTheDocument();
  });

  it('adds a simple dish straight to the cart', async () => {
    const user = userEvent.setup();
    renderPage(<MenuPage />, { path: PATH, route: ROUTE });
    await screen.findByText('Butter Naan');

    await user.click(screen.getByRole('button', { name: 'Add Butter Naan to cart' }));

    await waitFor(() => expect(screen.queryByText('Butter Naan')).toBeInTheDocument());
    await screen.findByText('Butter Naan added to cart');
  });
});
