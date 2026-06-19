/**
 * lib/hatch.ts
 *
 * Pure hatch-roll logic: pick a rarity from the egg's odds, then a pet of that
 * rarity. Odds + pet pools come from config/economy + the registry. The RNG is
 * injectable so the roll is testable.
 */

import { DUPLICATE_COIN_VALUE, HATCH_ODDS, type EggType, type Rarity } from '../config/economy';
import { EGG_PETS_BY_RARITY } from '../pets/registry';

const RARITY_ORDER: Rarity[] = ['common', 'rare', 'epic', 'legendary'];

/** Pick a rarity by the egg type's weighted odds. */
export function chooseRarity(eggType: EggType, rng: () => number = Math.random): Rarity {
  const odds = HATCH_ODDS[eggType];
  let r = rng();
  for (const rarity of RARITY_ORDER) {
    r -= odds[rarity];
    if (r < 0) return rarity;
  }
  return RARITY_ORDER[RARITY_ORDER.length - 1]; // rounding fallback
}

export interface HatchRoll {
  petId: string;
  rarity: Rarity;
}

/** Roll a pet from an egg: rarity by odds, then a random pet of that rarity. */
export function rollHatch(eggType: EggType, rng: () => number = Math.random): HatchRoll {
  let rarity = chooseRarity(eggType, rng);
  let pool = EGG_PETS_BY_RARITY[rarity];

  // Safety: if a rarity somehow has no pets, fall back to any non-empty pool.
  if (!pool || pool.length === 0) {
    rarity = [...RARITY_ORDER].reverse().find((r) => EGG_PETS_BY_RARITY[r]?.length) ?? 'common';
    pool = EGG_PETS_BY_RARITY[rarity];
  }

  const petId = pool[Math.floor(rng() * pool.length)] ?? pool[0];
  return { petId, rarity };
}

export function duplicateCoins(rarity: Rarity): number {
  return DUPLICATE_COIN_VALUE[rarity];
}
