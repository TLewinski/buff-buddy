/**
 * state/authStore.ts
 *
 * Global auth state (Zustand). Holds the Supabase session, the bootstrapped
 * profile, and a status the navigator gates on. `initialize()` is called once
 * at app start: it restores any persisted session and subscribes to auth
 * changes, so logins survive app restarts.
 */

import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import * as auth from '../lib/auth';
import type { Profile } from '../lib/database.types';
import { supabase } from '../lib/supabase';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthState {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profile: Profile | null;

  /** Wire up session restore + listener. Returns an unsubscribe fn. */
  initialize: () => () => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  session: null,
  user: null,
  profile: null,

  initialize: () => {
    // 1. Restore any persisted session immediately.
    supabase.auth.getSession().then(({ data }) => {
      void applySession(set, data.session ?? null);
    });

    // 2. React to future auth changes (sign in/out, token refresh).
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(set, session);
    });

    return () => data.subscription.unsubscribe();
  },

  refreshProfile: async () => {
    const user = get().user;
    if (!user) return;
    const profile = await auth.ensureProfile(user.id);
    set({ profile });
  },

  signOut: async () => {
    await auth.signOut();
    // onAuthStateChange will also fire, but clear eagerly for snappy UI.
    set({ status: 'signedOut', session: null, user: null, profile: null });
  },
}));

/** Apply a session to the store and bootstrap the profile when signed in. */
async function applySession(
  set: (partial: Partial<AuthState>) => void,
  session: Session | null,
) {
  if (!session?.user) {
    set({ status: 'signedOut', session: null, user: null, profile: null });
    return;
  }
  set({ session, user: session.user });
  const profile = await auth.ensureProfile(session.user.id);
  set({ status: 'signedIn', profile });
}
