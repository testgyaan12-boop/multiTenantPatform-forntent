import { service } from '@/services';
import { useSessionStore, type StoredSession } from '@/stores/session.store';
import type { OrderType } from '@/types';

function isFresh(session: StoredSession): boolean {
  return new Date(session.expiresAt).getTime() > Date.now();
}

export async function ensureGuestSession(
  slug: string,
  mode: OrderType,
): Promise<StoredSession> {
  const store = useSessionStore.getState();
  const existing = store.getSession(slug, mode);
  if (existing && isFresh(existing)) return existing;

  if (mode === 'dine-in') {
    throw {
      status: 410,
      code: 'session_expired',
      message: 'Your table session expired. Scan the table QR code again.',
    };
  }

  const info = await service.createSession({ restaurantSlug: slug });
  store.setSession(slug, info, 'pickup');
  const created = store.getSession(slug, 'pickup');
  if (!created) {
    throw { status: 0, code: 'session_error', message: 'Could not start your order session.' };
  }
  return created;
}

export function resolveOrderType(slug: string): OrderType {
  const dineIn = useSessionStore.getState().getSession(slug, 'dine-in');
  return dineIn && isFresh(dineIn) ? 'dine-in' : 'pickup';
}
