/**
 * theme/colors.ts
 *
 * Premium dark aesthetic — calm, sophisticated, motivating. No bright neon.
 * Components must reference these tokens; no hardcoded hex anywhere else.
 */

export const colors = {
  background: '#0B0B0B', // near-black app background
  sage: '#9CAF88', // primary accent
  sageDeep: '#7D9270', // secondary accent
  sageLight: '#B8C9AD', // highlights
  gold: '#D4AF37', // rewards / coins
  purple: '#8B5CF6', // legendary items & eggs
  text: '#F5F5F5', // primary white text

  // Derived neutrals for surfaces, borders, and muted text. Kept here so the
  // whole palette stays in one place.
  surface: '#161616', // card background
  surfaceRaised: '#1F1F1F', // elevated card / input background
  border: '#2A2A2A', // subtle hairline borders
  textMuted: '#9A9A9A', // secondary text
  textFaint: '#5E5E5E', // tertiary / disabled text
  danger: '#E5675A', // errors / destructive
} as const;

/** Rarity color mapping used by pet placeholders, store, and collection. */
export const rarityColors = {
  common: '#9CAF88', // sage
  rare: '#5B8DEF', // calm blue
  epic: '#8B5CF6', // purple
  legendary: '#D4AF37', // gold
} as const;

export type ColorToken = keyof typeof colors;
