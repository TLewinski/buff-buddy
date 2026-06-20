/**
 * theme/index.ts
 *
 * Single import surface for the design system.
 *   import { colors, spacing, radius, typography, shadow } from '../theme';
 */

export { colors, rarityColors } from './colors';
export type { ColorToken } from './colors';
export { spacing, radius, shadow } from './spacing';
export type { SpacingToken, RadiusToken } from './spacing';
export { typography } from './typography';
export type { TypographyToken } from './typography';

import { colors } from './colors';

/** Navigation theme so React Navigation chrome matches the dark palette. */
export const navTheme = {
  dark: true,
  colors: {
    primary: colors.sage,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    border: colors.border,
    notification: colors.purple,
  },
  // React Navigation 7 expects a `fonts` block; the platform defaults are fine.
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' as const },
    medium: { fontFamily: 'System', fontWeight: '500' as const },
    bold: { fontFamily: 'System', fontWeight: '700' as const },
    heavy: { fontFamily: 'System', fontWeight: '800' as const },
  },
};
