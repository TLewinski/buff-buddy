/**
 * lib/supabase.ts
 *
 * Supabase client — auth, Postgres, and persistent cloud storage.
 *
 * Session persistence uses AsyncStorage so logins survive app restarts.
 * The auth layer is intentionally thin and provider-agnostic: adding Google /
 * Apple OAuth later is `supabase.auth.signInWithOAuth(...)` with no
 * restructuring required here.
 *
 * Credentials are read from environment variables exposed at build time via
 * Expo's `extra` config (see app.json) and `.env`. The agent cannot create the
 * Supabase project or keys — see README for which values to paste in.
 */

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

type Extra = { supabaseUrl?: string; supabaseAnonKey?: string };

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

const supabaseUrl = extra.supabaseUrl ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey =
  extra.supabaseAnonKey ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * True once real credentials are present. Screens can use this to show a
 * friendly "connect Supabase" state instead of crashing during Phase 1, before
 * the project owner has pasted in their keys.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured && __DEV__) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copy .env.example to .env and fill in your project keys. See README.',
  );
}

export const supabase = createClient(
  // Fall back to harmless placeholders so the client constructs without
  // throwing while keys are absent. Any network call will simply fail until
  // real keys are provided.
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'public-anon-key-placeholder',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
