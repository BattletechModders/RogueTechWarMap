import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';

const createMapBackedStorage = (): Storage => {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
  };
};

const installStorage = (name: 'localStorage' | 'sessionStorage') => {
  if (typeof window === 'undefined') return;
  const existing = window[name] as Storage | undefined;
  if (!existing || typeof existing.setItem !== 'function') {
    Object.defineProperty(window, name, {
      configurable: true,
      value: createMapBackedStorage(),
    });
  }
};

installStorage('localStorage');
installStorage('sessionStorage');

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  if (typeof window !== 'undefined') {
    window.localStorage.clear();
    window.sessionStorage.clear();
  }
});

if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }

  if (!('ResizeObserver' in window)) {
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    // @ts-expect-error - jsdom lacks ResizeObserver
    window.ResizeObserver = ResizeObserver;
  }
}
