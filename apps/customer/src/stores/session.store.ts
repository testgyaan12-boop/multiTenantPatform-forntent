import { create } from 'zustand';
import type { GuestSessionInfo, OrderType } from '@/types';

export interface StoredSession {
  sessionToken: string;
  expiresAt: string;
  tableNumber?: string;
  branchName?: string;
  mode: OrderType;
  createdAt: number;
}

interface SessionState {
  sessions: Record<string, StoredSession>;
  setSession: (slug: string, info: GuestSessionInfo, mode: OrderType) => void;
  getSession: (slug: string, mode: OrderType) => StoredSession | null;
  clearSession: (slug: string, mode?: OrderType) => void;
  clearAll: () => void;
}

const STORAGE_KEY = 'resto-sessions-v1';

function load(): Record<string, StoredSession> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, StoredSession>;
    const now = Date.now();
    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => value.expiresAt && new Date(value.expiresAt).getTime() > now),
    );
  } catch {
    return {};
  }
}

function save(sessions: Record<string, StoredSession>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // storage unavailable - sessions stay in memory
  }
}

function sessionKey(slug: string, mode: OrderType): string {
  return `${slug}::${mode}`;
}

export const useSessionStore = create<SessionState>()((set, get) => ({
  sessions: typeof sessionStorage !== 'undefined' ? load() : {},
  setSession: (slug, info, mode) => {
    const sessions = {
      ...get().sessions,
      [sessionKey(slug, mode)]: {
        sessionToken: info.sessionToken,
        expiresAt: info.expiresAt,
        tableNumber: info.tableNumber,
        branchName: info.branchName,
        mode,
        createdAt: Date.now(),
      },
    };
    save(sessions);
    set({ sessions });
  },
  getSession: (slug, mode) => get().sessions[sessionKey(slug, mode)] ?? null,
  clearSession: (slug, mode) => {
    const sessions = { ...get().sessions };
    if (mode) {
      delete sessions[sessionKey(slug, mode)];
    } else {
      for (const key of Object.keys(sessions)) {
        if (key.startsWith(`${slug}::`)) delete sessions[key];
      }
    }
    save(sessions);
    set({ sessions });
  },
  clearAll: () => {
    save({});
    set({ sessions: {} });
  },
}));
