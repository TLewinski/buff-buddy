/**
 * lib/store.ts
 *
 * Store reads + mutations: buying cosmetics (permanent, stored in `inventory`)
 * and boosts (consumable, stored in `active_boosts`), equipping cosmetics, and
 * the boost multipliers applied at workout finish.
 */

import { BOOSTS, type BoostId, type CosmeticCategory } from '../config/economy';
import { getStoreItem, STORE_ITEMS, type StoreItem } from '../config/store';
import { supabase } from './supabase';

export interface StoreEntry extends StoreItem {
  owned: boolean; // cosmetics: permanently unlocked
  equipped: boolean; // cosmetics only
  active: boolean; // boosts: currently active
}

export interface StoreState {
  coins: number;
  entries: StoreEntry[];
}

/** Catalog annotated with the user's coins, owned/equipped cosmetics, and active boosts. */
export async function fetchStore(userId: string): Promise<StoreState> {
  const nowIso = new Date().toISOString();
  const [{ data: profile }, { data: inventory }, { data: boosts }] = await Promise.all([
    supabase.from('profiles').select('coins').eq('id', userId).single(),
    supabase.from('inventory').select('item_id, category, equipped').eq('user_id', userId),
    supabase
      .from('active_boosts')
      .select('boost_id, expires_at, consumed')
      .eq('user_id', userId)
      .eq('consumed', false),
  ]);

  const invById = new Map((inventory ?? []).map((r) => [r.item_id, r]));
  const activeBoostIds = new Set(
    (boosts ?? [])
      .filter((b) => !b.expires_at || b.expires_at > nowIso)
      .map((b) => b.boost_id),
  );

  const entries: StoreEntry[] = STORE_ITEMS.map((item) => {
    if (item.category === 'boosts') {
      return { ...item, owned: false, equipped: false, active: activeBoostIds.has(item.id) };
    }
    const inv = invById.get(item.id);
    return { ...item, owned: !!inv, equipped: !!inv?.equipped, active: false };
  });

  return { coins: profile?.coins ?? 0, entries };
}

export interface BuyResult {
  ok: boolean;
  error?: string;
  coins?: number;
}

/** Buy a cosmetic (permanent unlock) or a boost (becomes active). */
export async function buyItem(userId: string, itemId: string): Promise<BuyResult> {
  const item = getStoreItem(itemId);
  if (!item) return { ok: false, error: 'Unknown item.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('coins')
    .eq('id', userId)
    .single();
  const coins = profile?.coins ?? 0;
  if (coins < item.cost) return { ok: false, error: 'Not enough coins.' };

  if (item.category === 'boosts') {
    const def = BOOSTS[item.id as BoostId];
    if (!def) return { ok: false, error: 'Unknown boost.' };
    const expiresAt =
      def.mode === 'duration_24h' ? new Date(Date.now() + 24 * 3600 * 1000).toISOString() : null;
    const { error } = await supabase.from('active_boosts').insert({
      user_id: userId,
      boost_id: def.id,
      affects: def.affects,
      multiplier: def.multiplier,
      mode: def.mode,
      expires_at: expiresAt,
      consumed: false,
    });
    if (error) return { ok: false, error: error.message };
  } else {
    // Cosmetic: permanent unlock. Guard against double-purchase.
    const { data: existing } = await supabase
      .from('inventory')
      .select('item_id')
      .eq('user_id', userId)
      .eq('item_id', item.id)
      .maybeSingle();
    if (existing) return { ok: false, error: 'Already owned.' };

    const { error } = await supabase.from('inventory').insert({
      user_id: userId,
      item_id: item.id,
      category: item.category,
      equipped: false,
    });
    if (error) return { ok: false, error: error.message };
  }

  const newCoins = coins - item.cost;
  await supabase.from('profiles').update({ coins: newCoins }).eq('id', userId);
  return { ok: true, coins: newCoins };
}

/** Equip an owned cosmetic, unequipping others in the same category. Toggles off if already equipped. */
export async function equipCosmetic(
  userId: string,
  itemId: string,
): Promise<{ ok: boolean; error?: string }> {
  const item = getStoreItem(itemId);
  if (!item || item.category === 'boosts') return { ok: false, error: 'Not equippable.' };

  const { data: inv } = await supabase
    .from('inventory')
    .select('equipped')
    .eq('user_id', userId)
    .eq('item_id', itemId)
    .maybeSingle();
  if (!inv) return { ok: false, error: "You don't own this item." };

  const turningOn = !inv.equipped;
  // One equipped item per category: clear the category first.
  await supabase
    .from('inventory')
    .update({ equipped: false })
    .eq('user_id', userId)
    .eq('category', item.category);
  if (turningOn) {
    await supabase
      .from('inventory')
      .update({ equipped: true })
      .eq('user_id', userId)
      .eq('item_id', itemId);
  }
  return { ok: true };
}

export interface BoostMultipliers {
  xp: number;
  coins: number;
}

/**
 * Read active boosts, compute XP/coin multipliers, and consume `next_workout`
 * boosts. Called by finishWorkout. Returns { xp, coins } multipliers (>= 1).
 */
export async function consumeBoostsForWorkout(userId: string): Promise<BoostMultipliers> {
  const nowIso = new Date().toISOString();
  const { data: boosts } = await supabase
    .from('active_boosts')
    .select('id, affects, multiplier, mode, expires_at')
    .eq('user_id', userId)
    .eq('consumed', false);

  const live = (boosts ?? []).filter((b) => !b.expires_at || b.expires_at > nowIso);

  let xp = 1;
  let coins = 1;
  for (const b of live) {
    if (b.affects === 'xp') xp = Math.max(xp, Number(b.multiplier));
    if (b.affects === 'coins') coins = Math.max(coins, Number(b.multiplier));
  }

  // Consume single-use boosts that were applied this workout.
  const toConsume = live.filter((b) => b.mode === 'next_workout').map((b) => b.id);
  if (toConsume.length > 0) {
    await supabase.from('active_boosts').update({ consumed: true }).in('id', toConsume);
  }

  return { xp, coins };
}
