/**
 * screens/WorkoutsScreen.tsx
 *
 * Program list loaded from the seeded DB. Tapping a program launches a live
 * session. A header action opens workout history. Real loading / empty / error
 * states (e.g. when migrations haven't been applied yet).
 */

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { fetchPrograms, type ProgramWithExercises } from '../lib/workouts';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing, typography } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function WorkoutsScreen() {
  const navigation = useNavigation<Nav>();
  const [programs, setPrograms] = useState<ProgramWithExercises[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let active = true;
    setError(null);
    fetchPrograms()
      .then((data) => active && setPrograms(data))
      .catch((e) => active && setError(e.message ?? 'Could not load programs.'));
    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(load);

  return (
    <Screen
      eyebrow="Train"
      title="Workouts"
      headerRight={
        <Pressable
          onPress={() => navigation.navigate('WorkoutHistory')}
          hitSlop={10}
          accessibilityLabel="Workout history"
          style={styles.historyBtn}
        >
          <Ionicons name="time-outline" size={22} color={colors.textMuted} />
        </Pressable>
      }
    >
      <Text style={styles.sectionLabel}>QUICK START</Text>
      <Button
        label="Start an Empty Workout"
        onPress={() =>
          navigation.navigate('WorkoutSession', { programId: null, programName: 'Empty Workout' })
        }
      />

      <Text style={[styles.sectionLabel, styles.templatesLabel]}>Templates</Text>

      {error ? (
        <Card style={styles.state}>
          <Text style={typography.subheading}>Couldn't load programs</Text>
          <Text style={[typography.bodyMuted, styles.stateBody]}>{error}</Text>
          <Text style={[typography.caption, styles.stateHint]}>
            Have you applied the SQL migrations in Supabase? See the README.
          </Text>
        </Card>
      ) : programs === null ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.sage} />
        </View>
      ) : programs.length === 0 ? (
        <Card style={styles.state}>
          <Text style={typography.subheading}>No programs yet</Text>
          <Text style={[typography.bodyMuted, styles.stateBody]}>
            Run the seed migration (0002_seed_programs.sql) to add the starter programs.
          </Text>
        </Card>
      ) : (
        programs.map((p) => (
          <Pressable
            key={p.id}
            onPress={() =>
              navigation.navigate('WorkoutSession', { programId: p.id, programName: p.name })
            }
          >
            <Card style={styles.program}>
              <View style={styles.programHeader}>
                <Text style={typography.subheading}>{p.name}</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
              </View>
              {p.description ? (
                <Text style={[typography.bodyMuted, { marginTop: spacing.xs }]}>
                  {p.description}
                </Text>
              ) : null}
              <View style={styles.metaRow}>
                <Text style={typography.caption}>
                  {p.exercises.length} exercises · 3 sets each
                </Text>
              </View>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  historyBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sectionLabel: {
    ...typography.label,
    marginBottom: spacing.md,
  },
  templatesLabel: {
    ...typography.heading,
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  loading: {
    paddingTop: spacing.xxxl,
    alignItems: 'center',
  },
  state: {
    alignItems: 'flex-start',
  },
  stateBody: {
    marginTop: spacing.sm,
  },
  stateHint: {
    marginTop: spacing.md,
  },
  program: {
    marginBottom: spacing.md,
  },
  programHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaRow: {
    marginTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
});
