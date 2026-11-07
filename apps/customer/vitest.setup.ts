import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { useCartStore } from '@/stores/cart.store';
import { useSessionStore } from '@/stores/session.store';
import { useProfileStore } from '@/stores/profile.store';

class ObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

if (!('IntersectionObserver' in globalThis)) {
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: ObserverStub,
  });
}

if (!window.scrollTo) {
  window.scrollTo = () => {};
} else {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  useCartStore.setState({ restaurant: null, orderType: 'pickup', items: [] });
  useSessionStore.setState({ sessions: {} });
  useProfileStore.setState({ profile: null, savedProfile: false });
});
