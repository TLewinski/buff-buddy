/**
 * screens/WorkoutSessionScreen.tsx
 *
 * The live workout session (full-screen modal). Shows an elapsed timer, the
 * program's exercises with 3 sets each (weight + reps inputs and a "done"
 * toggle), and a Finish button that persists everything and credits coins.
 */

import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import type { Exercise } from '../lib/database.types';
import { formatDuration } from '../lib/format';
import { finishWorkout, type FinishWorkoutResult } from '../lib/game';
import { fetchProgramExercises, type LoggedSet } from '../lib/workouts';
import type { RootStackParamList } from '../navigation/types';
import { PetSprite } from '../pets/PetSprite';
import { useAuthStore } from '../state/authStore';
import { colors, radius, spacing, typography } from '../theme';

const SETS_PER_EXERCISE = 3;

type SessionRoute = RouteProp<RootStackParamList, 'WorkoutSession'>;
type SetState = { weight: string; reps: string; done: boolean };
/** keyed by `${exerciseId}:${setIndex}` */
type SetMap = Record<string, SetState>;

const setKey = (exerciseId: string, setIndex: number) => `${exerciseId}:${setIndex}`;

export function WorkoutSessionScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<SessionRoute>();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.id);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const [exercises, setExercises] = useState<Exercise[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sets, setSets] = useState<SetMap>({});
  const [elapsed, setElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState<{ result: FinishWorkoutResult; setsLogged: number } | null>(
    null,
  );

  const startedAtRef = useRef(new Date().toISOString());
  const startMsRef = useRef(Date.now());

  // Load exercises for the chosen program.
  useEffect(() => {
    let active = true;
    fetchProgramExercises(params.programId)
      .then((data) => active && setExercises(data))
      .catch((e) => active && setLoadError(e.message ?? 'Could not load exercises.'));
    return () => {
      active = false;
    };
  }, [params.programId]);

  // Elapsed timer (wall-clock based so it survives JS timer drift).
  useEffect(() => {
    if (summary) return; // freeze once finished
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startMsRef.current) / 1000));
    }, 500);
    return () => clearInterval(id);
  }, [summary]);

  const getSet = (exerciseId: string, i: number): SetState =>
    sets[setKey(exerciseId, i)] ?? { weight: '', reps: '', done: false };

  const updateSet = (exerciseId: string, i: number, patch: Partial<SetState>) =>
    setSets((prev) => {
      const key = setKey(exerciseId, i);
      return { ...prev, [key]: { ...getSetFrom(prev, key), ...patch } };
    });

  const loggedSetCount = useMemo(
    () => Object.values(sets).filter((s) => Number(s.reps) > 0).length,
    [sets],
  );

  function confirmClose() {
    if (summary) {
      navigation.goBack();
      return;
    }
    Alert.alert('Discard workout?', 'Your logged sets will not be saved.', [
      { text: 'Keep going', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  }

  async function handleFinish() {
    if (!userId) {
      Alert.alert('Not signed in', 'Please sign in again.');
      return;
    }
    const payload: LoggedSet[] = [];
    for (const [key, s] of Object.entries(sets)) {
      const reps = Number(s.reps);
      if (!Number.isFinite(reps) || reps <= 0) continue;
      const [exerciseId, idx] = key.split(':');
      payload.push({
        exerciseId,
        setIndex: Number(idx),
        weight: Number(s.weight) || 0,
        reps,
      });
    }

    setSubmitting(true);
    const result = await finishWorkout({
      userId,
      programId: params.programId,
      startedAt: startedAtRef.current,
      durationSeconds: Math.floor((Date.now() - startMsRef.current) / 1000),
      sets: payload,
    });
    setSubmitting(false);

    if (!result.ok) {
      Alert.alert('Could not save workout', result.error ?? 'Please try again.');
      return;
    }
    await refreshProfile();
    setSummary({ result, setsLogged: payload.length });
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable onPress={confirmClose} hitSlop={10} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.programName}>{params.programName}</Text>
          <Text style={styles.timer}>{formatDuration(elapsed)}</Text>
        </View>
        <View style={styles.closeBtn} />
      </View>

      {loadError ? (
        <View style={styles.center}>
          <Text style={typography.bodyMuted}>{loadError}</Text>
        </View>
      ) : exercises === null ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.sage} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {exercises.map((ex) => (
            <Card key={ex.id} style={styles.exercise}>
              <Text style={typography.subheading}>{ex.name}</Text>
              <View style={styles.setsHeader}>
                <Text style={[styles.colLabel, styles.colSet]}>SET</Text>
                <Text style={[styles.colLabel, styles.colInput]}>WEIGHT</Text>
                <Text style={[styles.colLabel, styles.colInput]}>REPS</Text>
                <View style={styles.colDone} />
              </View>
              {Array.from({ length: SETS_PER_EXERCISE }, (_, i) => {
                const s = getSet(ex.id, i);
                return (
                  <View key={i} style={styles.setRow}>
                    <Text style={[styles.setIndex, styles.colSet]}>{i + 1}</Text>
                    <TextInput
                      style={[styles.input, styles.colInput, s.done && styles.inputDone]}
                      value={s.weight}
                      onChangeText={(t) => updateSet(ex.id, i, { weight: t })}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={colors.textFaint}
                    />
                    <TextInput
                      style={[styles.input, styles.colInput, s.done && styles.inputDone]}
                      value={s.reps}
                      onChangeText={(t) => updateSet(ex.id, i, { reps: t })}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor={colors.textFaint}
                    />
                    <Pressable
                      onPress={() => updateSet(ex.id, i, { done: !s.done })}
                      hitSlop={8}
                      style={[styles.colDone, styles.doneBtn, s.done && styles.doneBtnOn]}
                    >
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={s.done ? colors.background : colors.textFaint}
                      />
                    </Pressable>
                  </View>
                );
              })}
            </Card>
          ))}

          <Text style={styles.loggedNote}>
            {loggedSetCount} set{loggedSetCount === 1 ? '' : 's'} logged
          </Text>

          <Button
            label={submitting ? 'Saving…' : 'Finish Workout'}
            onPress={handleFinish}
            disabled={submitting}
          />
        </ScrollView>
      )}

      {summary && (
        <View style={styles.summaryOverlay}>
          <Animated.View entering={ZoomIn.springify().damping(14)} style={{ alignSelf: 'stretch' }}>
            <Card style={styles.summaryCard}>
              {summary.result.stageChanged && summary.result.petId && summary.result.newStage ? (
                <>
                  <PetSprite
                    petId={summary.result.petId}
                    stage={summary.result.newStage}
                    size={160}
                    showAura
                  />
                  <Text style={[styles.summaryTitle, { color: colors.sage }]}>
                    Evolved to {summary.result.newStage.toUpperCase()}!
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.summaryEmoji}>{summary.result.leveledUp ? '⭐️' : '💪'}</Text>
                  <Text style={styles.summaryTitle}>
                    {summary.result.leveledUp ? `Level ${summary.result.newLevel}!` : 'Workout Complete!'}
                  </Text>
                </>
              )}

              <Text style={styles.summaryMeta}>
                {formatDuration(elapsed)} · {summary.setsLogged} set
                {summary.setsLogged === 1 ? '' : 's'} logged
              </Text>

              <View style={styles.rewardRow}>
                <View style={styles.rewardPill}>
                  <Text style={[styles.rewardValue, { color: colors.gold }]}>
                    +{summary.result.coinsAwarded}
                  </Text>
                  <Text style={styles.rewardLabel}>COINS</Text>
                </View>
                <View style={styles.rewardPill}>
                  <Text style={[styles.rewardValue, { color: colors.sage }]}>
                    +{summary.result.xpApplied}
                  </Text>
                  <Text style={styles.rewardLabel}>XP</Text>
                </View>
              </View>

              {summary.result.challengeCompleted ? (
                <Text style={[styles.summaryHint, { color: colors.purple }]}>
                  ✨ Daily challenge complete — bonus included!
                </Text>
              ) : null}
              {summary.result.streakCurrent > 0 ? (
                <Text style={styles.summaryHint}>
                  🔥 {summary.result.streakCurrent}-day streak
                </Text>
              ) : null}
              {summary.result.eggsStandard + summary.result.eggsEpic > 0 ? (
                <Text style={[styles.summaryHint, { color: colors.gold }]}>
                  🥚 You earned an egg! Open it in the Hatch tab.
                </Text>
              ) : null}

              <Button
                label="Done"
                onPress={() => navigation.goBack()}
                style={{ alignSelf: 'stretch', marginTop: spacing.sm }}
              />
            </Card>
          </Animated.View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

/** Local helper so updateSet can merge cleanly without stale closures. */
function getSetFrom(map: SetMap, key: string): SetState {
  return map[key] ?? { weight: '', reps: '', done: false };
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  programName: {
    ...typography.subheading,
  },
  timer: {
    ...typography.body,
    color: colors.sage,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  exercise: {
    marginBottom: spacing.md,
  },
  setsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  colLabel: {
    ...typography.caption,
  },
  colSet: {
    width: 40,
    textAlign: 'center',
  },
  colInput: {
    flex: 1,
    marginHorizontal: spacing.xs,
    textAlign: 'center',
  },
  colDone: {
    width: 40,
    alignItems: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  setIndex: {
    ...typography.body,
    color: colors.textMuted,
  },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  inputDone: {
    borderColor: colors.sageDeep,
  },
  doneBtn: {
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  doneBtnOn: {
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
  loggedNote: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  summaryOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  summaryCard: {
    alignItems: 'center',
    alignSelf: 'stretch',
    padding: spacing.xl,
  },
  summaryEmoji: {
    fontSize: 48,
  },
  summaryTitle: {
    ...typography.title,
    marginTop: spacing.sm,
  },
  summaryMeta: {
    ...typography.bodyMuted,
    marginTop: spacing.xs,
  },
  rewardRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginVertical: spacing.xl,
  },
  rewardPill: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
  },
  rewardValue: {
    ...typography.title,
  },
  rewardLabel: {
    ...typography.caption,
    marginTop: 2,
  },
  summaryHint: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});
