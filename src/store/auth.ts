import axios from 'axios';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage, PUSH_TOKEN_KEY, storage } from '@/lib/storage';
import type { Membership, Role, Session, SessionUser } from '@/types/api';

/** The mobile experiences. Other school staff and Overwatch use the web app. */
export type AppRole = 'STUDENT' | 'PARENT' | 'TUCK_SHOP';
const MOBILE_ROLES: AppRole[] = ['STUDENT', 'PARENT', 'TUCK_SHOP'];

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: SessionUser | null;
  activeRole: AppRole | null;
  signIn: (session: Session) => void;
  setUser: (user: SessionUser) => void;
  switchRole: (role: AppRole) => void;
  /** Forget the session locally (used when the server says the session is gone). */
  clear: () => void;
  /** Revoke the refresh token on the server, then forget the session. */
  signOut: (apiUrl: string) => void;
};

export function mobileRoles(memberships: Membership[] = []): AppRole[] {
  const roles = new Set<Role>(memberships.map((m) => m.role));
  return MOBILE_ROLES.filter((r) => roles.has(r));
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      activeRole: null,
      signIn: ({ accessToken, refreshToken, user }) => {
        const available = mobileRoles(user.memberships);
        const previous = get().activeRole;
        set({ accessToken, refreshToken, user, activeRole: previous && available.includes(previous) ? previous : (available[0] ?? null) });
      },
      setUser: (user) => set({ user }),
      switchRole: (role) => set({ activeRole: role }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
      signOut: (apiUrl) => {
        const { refreshToken, accessToken } = get();
        const pushToken = storage.getString(PUSH_TOKEN_KEY);
        storage.remove(PUSH_TOKEN_KEY);
        // Sign out on the phone straight away; tell the server in the background so slow Wi-Fi never blocks it.
        set({ accessToken: null, refreshToken: null, user: null });
        void (async () => {
          // Stop this phone getting the person's notifications. The access token stays valid for a few minutes.
          if (pushToken && accessToken) {
            await axios.post(`${apiUrl}/me/push-tokens/remove`, { token: pushToken }, { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 8000 }).catch(() => {});
          }
          if (refreshToken) await axios.post(`${apiUrl}/auth/logout`, { refreshToken }, { timeout: 8000 }).catch(() => {});
        })();
      },
    }),
    {
      name: 'nexus-auth',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: ({ accessToken, refreshToken, user, activeRole }) => ({ accessToken, refreshToken, user, activeRole }),
    },
  ),
);
