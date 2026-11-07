# @resto/customer — Restaurant Ordering Portal

Mobile-first customer-facing ordering app for the multi-tenant Restaurant SaaS. Customers scan a table QR code (or open a restaurant link), browse the menu, build a cart, check out, and track the order live — no account required.

## Stack

- React 19 + TypeScript + Vite 7
- Tailwind CSS v4 (`@theme` design tokens in `src/styles/globals.css`)
- shadcn-style UI primitives (`src/components/ui/*`, Radix + CVA + tailwind-merge)
- Zustand (cart, sessions, profile — persisted to storage)
- TanStack Query (server state, live-order polling)
- React Hook Form + Zod (checkout/profile validation)
- Sonner (toasts), Lucide (icons), date-fns (formatting)
- Vitest + React Testing Library (unit + page tests)

## Routes

| Path | Purpose |
| --- | --- |
| `/` | Redirects to `/r/:slug` (mock: `the-spice-house`, real: `demo-bistro`) |
| `/t/:tableCode` | QR entry — creates a dine-in guest session, then redirects to the menu |
| `/r/:restaurantSlug` | Landing — restaurant hero, featured dishes, order mode |
| `/r/:restaurantSlug/menu` | Full menu — search, veg filter, category scroll-spy, quick add |
| `/r/:restaurantSlug/item/:itemKey` | Dish detail — sizes, required/optional add-ons, quantity, notes |
| `/r/:restaurantSlug/cart` | Cart — quantity steppers, estimated tax/service totals |
| `/r/:restaurantSlug/checkout` | 2-step checkout — details + tip → server-priced review → place & pay |
| `/r/:restaurantSlug/order/:orderId/tracking` | Live status (5s/15s polling), payment retry, timeline |
| `/r/:restaurantSlug/orders` | Order history (Active / History tabs) |
| `/r/:restaurantSlug/orders/:orderId` | Full order details |
| `/r/:restaurantSlug/profile` | Local preferences + clear-data control |

`orderId` in URLs is the order's public token.

## Modes

- **Mock mode** (`VITE_MOCK=true`): full offline demo — “The Spice House”, ₹ prices, sample menu, simulated orders whose status advances with elapsed time, simulated payment. Used by default in `dev` and by the test suite.
- **Real mode**: talks to the Spring Boot API (`VITE_API_BASE_URL`, default `http://localhost:8080/api/v1`) using the public guest-session endpoints (`X-Guest-Session` header, `Idempotency-Key` on payment).

Environment variables (`.env.local`):

```bash
VITE_MOCK=true                 # 'false' to use the real API
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_DEFAULT_RESTAURANT=the-spice-house   # real default: demo-bistro
```

Payments are **always sandbox/demo** in this portal (`IS_SANDBOX_PAYMENT`); the UI labels them accordingly and never claims a real charge.

## State & storage

| Key | Where | Contents |
| --- | --- | --- |
| `resto-cart-v1` | localStorage (Zustand persist) | Cart lines, order type, restaurant context |
| `resto-sessions-v1` | sessionStorage | Guest session tokens per `${slug}::${dine-in\|pickup}` |
| `resto-profile-v1` | localStorage | Contact details + preferences |
| `resto-orders-v1` | localStorage | Saved order refs (public tokens) for history |

- **Cart is client-owned**; totals shown before checkout are estimates from the restaurant's tax/service rates.
- **Checkout is server-authoritative**: on "Review order" the portal creates/uses a guest session, clears the server cart (`DELETE /public/cart`), syncs lines (`POST /public/cart/items`), and renders the totals returned by `GET /public/cart`. Order placement + demo payment follow (`POST /public/orders`, `POST /public/orders/:token/pay`).
- Dine-in sessions come only from a valid table QR; an expired session shows a "scan again" error instead of silently falling back.

## Commands

```bash
pnpm --filter @resto/customer dev        # http://localhost:5175 (mock mode)
pnpm --filter @resto/customer typecheck  # tsc --noEmit
pnpm --filter @resto/customer test       # vitest run (mock mode forced)
pnpm --filter @resto/customer build      # typecheck + vite build
```

## Structure

```
src/
  app/          providers (query client, toaster), router
  pages/        one file per route + __tests__/
  components/
    ui/         shadcn-style primitives (button, dialog, sheet, tabs…)
    layout/     app shell (bottom nav, offline banner), page header, bottom nav
    common/     error/empty/loading states, veg mark, stepper, image
    food/       menu list item, featured card, category scroll-spy
    cart/       line row, totals card, sticky cart bar
    orders/     status badge/timeline, order card, item list
  stores/       zustand stores (cart, session, profile)
  services/     PortalService contract → mock/ or real.ts (factory: index.ts)
  hooks/        restaurant/menu queries, online status, session bootstrap
  lib/          env, api client (portal errors), totals, formatting, order history
```

## Accessibility & UX

- Mobile-first layout (bottom nav hidden on checkout), safe-area insets, reduced-motion support.
- Focus-visible outlines, aria-labelled steppers/roles for options, `role="alert"` errors, polite quantity announcements.
- Offline banner + paused polling when the connection drops; last known order status is retained.
- Loading skeletons, empty/error states with retry everywhere.
