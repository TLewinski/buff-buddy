/**
 * config/economy.ts
 *
 * SINGLE SOURCE OF TRUTH for every tunable number in Buff Buddy.
 * XP, coins, costs, odds, thresholds — all live here so the game can be
 * re-balanced without touching feature code.
 *
 * If a value feels like a "knob the designer might turn," it belongs in this
 * file. Feature code should import from here and never hardcode numbers.
 */

// ---------------------------------------------------------------------------
// Shared domain types
// ---------------------------------------------------------------------------

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type Stage = 'juvenile' | 'teen' | 'adult';
export type EggType = 'standard' | 'epic';
export type CosmeticCategory = 'hats' | 'glasses' | 'outfits' | 'auras' | 'boosts';

// ---------------------------------------------------------------------------
// XP & leveling
// ---------------------------------------------------------------------------

export const REWARDS = {
  /** Awarded for finishing any workout. */
  workout: { xp: 50, coins: 30 },
  /** Awarded for completing the day's daily challenge. */
  dailyChallenge: { xp: 25, coins: 15 },
} as const;

/**
 * XP required to advance from level N to level N+1.
 *   L1->2 = 100, L2->3 = 150, L3->4 = 200, ... (linear curve)
 */
export function xpForLevel(level: number): number {
  return 100 + (level - 1) * 50;
}

// ---------------------------------------------------------------------------
// Evolution stages (3) mapped to pet level
// ---------------------------------------------------------------------------

/**
 * Inclusive level ranges per stage. `max: null` means "and above".
 *   Juvenile: 1-5 | Teen: 6-12 | Adult: 13+
 * To restore a 6-stage system later, only this table + xpForLevel change.
 */
export const STAGE_THRESHOLDS: { stage: Stage; min: number; max: number | null }[] = [
  { stage: 'juvenile', min: 1, max: 5 },
  { stage: 'teen', min: 6, max: 12 },
  { stage: 'adult', min: 13, max: null },
];

export function stageForLevel(level: number): Stage {
  for (const t of STAGE_THRESHOLDS) {
    if (level >= t.min && (t.max === null || level <= t.max)) return t.stage;
  }
  return 'juvenile';
}

// ---------------------------------------------------------------------------
// Store pricing (ranges are the design intent; concrete item costs live in
// the store item seed data which must stay within these bounds).
// ---------------------------------------------------------------------------

export const STORE_PRICE_RANGES: Record<CosmeticCategory, { min: number; max: number }> = {
  hats: { min: 150, max: 400 },
  glasses: { min: 150, max: 300 },
  outfits: { min: 400, max: 800 },
  auras: { min: 600, max: 1200 },
  boosts: { min: 200, max: 500 },
};

// ---------------------------------------------------------------------------
// Eggs
// ---------------------------------------------------------------------------

export const EGG_RULES = {
  /** A continuous streak run grants a Standard Egg once it reaches this day. */
  streakForStandardEgg: 7,
  /** A continuous streak run grants an Epic Egg once it reaches this day. */
  streakForEpicEgg: 30,
  /** Completing this many workouts within a Mon-Sun week grants a Standard Egg. */
  workoutsPerWeekForEgg: 4,
} as const;

/** Hatch odds by egg type. Each table MUST sum to 1.0. */
export const HATCH_ODDS: Record<EggType, Record<Rarity, number>> = {
  standard: { common: 0.6, rare: 0.3, epic: 0.09, legendary: 0.01 },
  epic: { common: 0, rare: 0.2, epic: 0.6, legendary: 0.2 },
};

/** Coins credited when a hatched pet is a duplicate, keyed by rarity. */
export const DUPLICATE_COIN_VALUE: Record<Rarity, number> = {
  common: 50,
  rare: 150,
  epic: 400,
  legendary: 1000,
};

// ---------------------------------------------------------------------------
// Boosts (consumables) — concrete definitions
// ---------------------------------------------------------------------------

export type BoostId = 'xp_2x_next' | 'xp_2x_24h' | 'coins_2x_next';

export interface BoostDef {
  id: BoostId;
  name: string;
  description: string;
  cost: number;
  /** Multiplier applied to the relevant reward while active. */
  multiplier: number;
  /** How the boost is consumed. */
  mode: 'next_workout' | 'duration_24h';
  affects: 'xp' | 'coins';
}

export const BOOSTS: Record<BoostId, BoostDef> = {
  xp_2x_next: {
    id: 'xp_2x_next',
    name: 'Double XP (Next Workout)',
    description: '2x XP on your next completed workout.',
    cost: 200,
    multiplier: 2,
    mode: 'next_workout',
    affects: 'xp',
  },
  xp_2x_24h: {
    id: 'xp_2x_24h',
    name: 'Double XP (24 Hours)',
    description: '2x XP on every workout for the next 24 hours.',
    cost: 350,
    multiplier: 2,
    mode: 'duration_24h',
    affects: 'xp',
  },
  coins_2x_next: {
    id: 'coins_2x_next',
    name: 'Double Coins (Next Workout)',
    description: '2x coins on your next completed workout.',
    cost: 500,
    multiplier: 2,
    mode: 'next_workout',
    affects: 'coins',
  },
};

// ---------------------------------------------------------------------------
// Daily challenge rotation
// ---------------------------------------------------------------------------

export type DailyChallengeKind = 'complete_1_workout' | 'exercise_45_min' | 'complete_2_workouts';

export interface DailyChallengeDef {
  kind: DailyChallengeKind;
  title: string;
  /** Target value the user must reach (workouts count, or minutes). */
  target: number;
  unit: 'workouts' | 'minutes';
}

export const DAILY_CHALLENGES: DailyChallengeDef[] = [
  { kind: 'complete_1_workout', title: 'Complete 1 workout', target: 1, unit: 'workouts' },
  { kind: 'exercise_45_min', title: 'Exercise for 45 minutes', target: 45, unit: 'minutes' },
  { kind: 'complete_2_workouts', title: 'Complete 2 workouts', target: 2, unit: 'workouts' },
];

// ---------------------------------------------------------------------------
// Starting state for a brand-new profile.
// ---------------------------------------------------------------------------

export const STARTING_STATE = {
  coins: 0,
  currentStreak: 0,
  longestStreak: 0,
} as const;
