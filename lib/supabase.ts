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

// Use `||` (not `??`): app.config.ts sets these to '' when the env is missing at
// config-eval time, and an empty string should fall through to the runtime env.
const supabaseUrl = (extra.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
const supabaseAnonKey = (
  extra.supabaseAnonKey ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  ''
).trim();

/** True when the URL/key look like the un-edited .env.example placeholders. */
const looksLikePlaceholder =
  /YOUR-PROJECT|YOUR-ANON/i.test(supabaseUrl) || /YOUR-ANON/i.test(supabaseAnonKey);

const hasValidUrl = /^https:\/\/.+\.supabase\.co/i.test(supabaseUrl);

/**
 * True once real credentials are present. Screens use this to show a friendly
 * "connect Supabase" state instead of firing requests at a bogus host (which
 * surfaces as a confusing "Failed to fetch" in the browser).
 */
export const isSupabaseConfigured =
  Boolean(supabaseUrl && supabaseAnonKey) && hasValidUrl && !looksLikePlaceholder;

if (!isSupabaseConfigured && __DEV__) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] Not configured. ' +
      (looksLikePlaceholder
        ? 'Your .env still has the .env.example placeholder values — paste your real Project URL + anon key.'
        : !hasValidUrl && supabaseUrl
          ? `EXPO_PUBLIC_SUPABASE_URL ("${supabaseUrl}") is not a valid https://<ref>.supabase.co URL.`
          : 'Set EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY in .env, then restart the dev server (env changes need a restart). See README.'),
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
