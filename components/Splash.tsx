/**
 * components/Splash.tsx
 *
 * Shown while the persisted session is being restored at startup.
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';

export function Splash() {
  return (
    <View style={styles.root}>
      <Text style={styles.logo}>🐻</Text>
      <Text style={styles.name}>BUFF BUDDY</Text>
      <ActivityIndicator color={colors.sage} style={{ marginTop: spacing.xl }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { fontSize: 56 },
  name: {
    ...typography.label,
    color: colors.sage,
    letterSpacing: 2,
    marginTop: spacing.md,
  },
});
