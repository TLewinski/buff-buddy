/**
 * screens/WorkoutsScreen.tsx
 *
 * Phase 1: program list shell. The session flow + history land in Phase 3.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { colors, spacing, typography } from '../theme';

const PROGRAMS = [
  { name: 'Push Pull Legs', desc: 'Bench Press, Overhead Press, Incline DB Press & more' },
  { name: 'Upper Lower', desc: 'Pull-Up, Barbell Row, Bench Press & more' },
  { name: 'Full Body Blast', desc: 'Squat, Bench Press, Barbell Row & more' },
  { name: 'Strength Program', desc: 'Squat, Bench Press, Deadlift & more' },
  { name: 'Beginner Program', desc: 'Goblet Squat, Push-Up, Dumbbell Row & more' },
];

export function WorkoutsScreen() {
  return (
    <Screen eyebrow="Train" title="Workouts" subtitle="Pick a program to start a session.">
      {PROGRAMS.map((p) => (
        <Card key={p.name} style={styles.program}>
          <Text style={typography.subheading}>{p.name}</Text>
          <Text style={[typography.bodyMuted, { marginTop: spacing.xs }]}>{p.desc}</Text>
          <View style={styles.metaRow}>
            <Text style={typography.caption}>5 exercises · 3 sets each</Text>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  program: {
    marginBottom: spacing.md,
  },
  metaRow: {
    marginTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
});
