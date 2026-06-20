/**
 * lib/auth.ts
 *
 * Thin, provider-agnostic auth helpers over Supabase. v1 ships email/password
 * only, but the layer is structured so adding Google / Apple later is a single
 * `signInWithProvider('google')` call with no restructuring — the rest of the
 * app talks to the auth store, not to Supabase directly.
 */

import type { Provider } from '@supabase/supabase-js';
import { STARTING_STATE } from '../config/economy';
import type { Profile } from './database.types';
import { isSupabaseConfigured, supabase } from './supabase';

const NOT_CONFIGURED =
  'Backend not connected. Add your Supabase keys to .env (see README) and reload.';

export interface AuthResult {
  /** True when the call succeeded. */
  ok: boolean;
  /** Human-readable error to show the user, if any. */
  error?: string;
  /** Set when sign-up succeeded but email confirmation is still required. */
  needsEmailConfirmation?: boolean;
}

function guard(): AuthResult | null {
  return isSupabaseConfigured ? null : { ok: false, error: NOT_CONFIGURED };
}

/** Turn raw Supabase/network errors into something a user can act on. */
function friendlyError(message: string): string {
  if (/failed to fetch|network request failed|load failed/i.test(message)) {
    return (
      "Couldn't reach the server. Check your internet connection, that your " +
      'Supabase Project URL is correct, and that the project is not paused.'
    );
  }
  return message;
}

export async function signUp(email: string, password: string): Promise<AuthResult> {
  const blocked = guard();
  if (blocked) return blocked;

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  });
  if (error) return { ok: false, error: friendlyError(error.message) };

  // When email confirmation is enabled, signUp returns a user but no session.
  const needsEmailConfirmation = !data.session && !!data.user;
  return { ok: true, needsEmailConfirmation };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const blocked = guard();
  if (blocked) return blocked;

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) return { ok: false, error: friendlyError(error.message) };
  return { ok: true };
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured) return;
  await supabase.auth.signOut();
}

/**
 * Placeholder for v1: OAuth providers are out of scope but wired so they drop
 * in later with no restructuring. Add the provider in the Supabase dashboard,
 * then call this from a button.
 */
export async function signInWithProvider(provider: Provider): Promise<AuthResult> {
  const blocked = guard();
  if (blocked) return blocked;
  const { error } = await supabase.auth.signInWithOAuth({ provider });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Ensure a profile row exists for the signed-in user, creating it with starting
 * values on first login. Returns the profile (or null if unreachable).
 */
export async function ensureProfile(userId: string): Promise<Profile | null> {
  if (!isSupabaseConfigured) return null;

  const { data: existing, error: selectError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (selectError) {
    if (__DEV__) console.warn('[auth] profile select failed:', selectError.message);
    return null;
  }
  if (existing) return existing as Profile;

  const { data: created, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      coins: STARTING_STATE.coins,
      current_streak: STARTING_STATE.currentStreak,
      longest_streak: STARTING_STATE.longestStreak,
      equipped_pet_id: null,
    })
    .select('*')
    .single();

  if (insertError) {
    if (__DEV__) console.warn('[auth] profile bootstrap failed:', insertError.message);
    return null;
  }
  return created as Profile;
}
