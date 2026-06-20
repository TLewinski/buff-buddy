/**
 * pets/registry.ts
 *
 * The single registry every screen reads from. Art is referenced by key and
 * loaded from `assets/pets/`. Stages are explicit so swapping art never touches
 * feature code — to ship real art, drop the files into assets/pets/ and set the
 * matching `image` field to `require('../assets/pets/<file>.png')`.
 *
 * Until then, `image: null` causes <PetSprite> to render an on-brand styled
 * placeholder (rarity-tinted silhouette + pet name).
 *
 * Pet list (per spec §9): starters Bear, Gorilla, Turtle; egg pets Wolf, Tiger,
 * Lion, Eagle, Dragon, Phoenix. 9 pets x 3 stages = 27 artworks (see
 * ART_MANIFEST.md). NOTE: spec §5's egg table lists "Capybara" (Rare) where §9
 * lists "Eagle"; we follow §9's explicit registry instruction and assign Eagle
 * the Rare slot.
 */

import type { ImageSourcePropType } from 'react-native';
import type { Rarity, Stage } from '../config/economy';

/** Idle "breathing/float" animation config consumed on the Home screen. */
export interface IdleConfig {
  /** Vertical float amplitude in px. */
  floatPx: number;
  /** One full float cycle duration in ms. */
  durationMs: number;
}

export interface StageArt {
  /**
   * Real artwork source, or null while using the rendered placeholder.
   * When real art lands: image: require('../assets/pets/bear_juvenile.png')
   */
  image: ImageSourcePropType | null;
  idle: IdleConfig;
}

export interface PetDef {
  id: string;
  name: string;
  rarity: Rarity;
  source: 'starter' | 'egg';
  /** One-line flavor text shown on Home / detail. */
  blurb: string;
  art: Record<Stage, StageArt>;
}

/** Default idle configs per stage — bigger pets float a touch slower. */
const idle: Record<Stage, IdleConfig> = {
  juvenile: { floatPx: 8, durationMs: 2200 },
  teen: { floatPx: 10, durationMs: 2600 },
  adult: { floatPx: 12, durationMs: 3000 },
};

/** Helper: all three stages currently use placeholders (image: null). */
function placeholderArt(): Record<Stage, StageArt> {
  return {
    juvenile: { image: null, idle: idle.juvenile },
    teen: { image: null, idle: idle.teen },
    adult: { image: null, idle: idle.adult },
  };
}

export const PETS: Record<string, PetDef> = {
  // --- Starters -------------------------------------------------------------
  bear: {
    id: 'bear',
    name: 'Bear',
    rarity: 'common',
    source: 'starter',
    blurb: 'A loyal companion with raw strength.',
    art: placeholderArt(),
  },
  gorilla: {
    id: 'gorilla',
    name: 'Gorilla',
    rarity: 'common',
    source: 'starter',
    blurb: 'Powerful, patient, and endlessly dependable.',
    art: placeholderArt(),
  },
  turtle: {
    id: 'turtle',
    name: 'Turtle',
    rarity: 'common',
    source: 'starter',
    blurb: 'Slow and steady — consistency is its superpower.',
    art: placeholderArt(),
  },

  // --- Egg pets -------------------------------------------------------------
  wolf: {
    id: 'wolf',
    name: 'Wolf',
    rarity: 'common',
    source: 'egg',
    blurb: 'A relentless pack hunter that never quits.',
    art: placeholderArt(),
  },
  eagle: {
    id: 'eagle',
    name: 'Eagle',
    rarity: 'rare',
    source: 'egg',
    blurb: 'Sharp-eyed and soaring above the rest.',
    art: placeholderArt(),
  },
  tiger: {
    id: 'tiger',
    name: 'Tiger',
    rarity: 'rare',
    source: 'egg',
    blurb: 'Explosive power wrapped in striped grace.',
    art: placeholderArt(),
  },
  lion: {
    id: 'lion',
    name: 'Lion',
    rarity: 'epic',
    source: 'egg',
    blurb: 'The king of the gym floor.',
    art: placeholderArt(),
  },
  dragon: {
    id: 'dragon',
    name: 'Dragon',
    rarity: 'epic',
    source: 'egg',
    blurb: 'Ancient, fierce, and forged in fire.',
    art: placeholderArt(),
  },
  phoenix: {
    id: 'phoenix',
    name: 'Phoenix',
    rarity: 'legendary',
    source: 'egg',
    blurb: 'Rises stronger from every setback.',
    art: placeholderArt(),
  },
};

export const STARTER_PET_IDS = Object.values(PETS)
  .filter((p) => p.source === 'starter')
  .map((p) => p.id);

export const EGG_PET_IDS = Object.values(PETS)
  .filter((p) => p.source === 'egg')
  .map((p) => p.id);

/** Egg pets grouped by rarity — used by the hatch odds roll (Phase 6). */
export const EGG_PETS_BY_RARITY: Record<Rarity, string[]> = {
  common: EGG_PET_IDS.filter((id) => PETS[id].rarity === 'common'),
  rare: EGG_PET_IDS.filter((id) => PETS[id].rarity === 'rare'),
  epic: EGG_PET_IDS.filter((id) => PETS[id].rarity === 'epic'),
  legendary: EGG_PET_IDS.filter((id) => PETS[id].rarity === 'legendary'),
};

export function getPet(id: string): PetDef | undefined {
  return PETS[id];
}
