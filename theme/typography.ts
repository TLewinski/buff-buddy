/**
 * theme/typography.ts
 *
 * Typography scale. Uses the platform system font for v1 (clean + zero asset
 * weight). Swap `fontFamily` here when a custom font is added.
 */

import { colors } from './colors';

export const typography = {
  display: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5, color: colors.text },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.3, color: colors.text },
  heading: { fontSize: 20, fontWeight: '700', color: colors.text },
  subheading: { fontSize: 17, fontWeight: '600', color: colors.text },
  body: { fontSize: 15, fontWeight: '500', color: colors.text },
  bodyMuted: { fontSize: 15, fontWeight: '500', color: colors.textMuted },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted, letterSpacing: 0.4 },
  caption: { fontSize: 12, fontWeight: '500', color: colors.textFaint },
} as const;

export type TypographyToken = keyof typeof typography;
