/**
 * components/Card.tsx
 *
 * Rounded, softly shadowed surface used across the app.
 */

import React from 'react';
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '../theme';

interface Props extends ViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Use the slightly brighter raised surface (e.g. inputs). */
  raised?: boolean;
  padded?: boolean;
}

export function Card({ children, style, raised = false, padded = true, ...rest }: Props) {
  return (
    <View
      {...rest}
      style={[
        styles.card,
        { backgroundColor: raised ? colors.surfaceRaised : colors.surface },
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow.card,
  },
  padded: {
    padding: spacing.lg,
  },
});
