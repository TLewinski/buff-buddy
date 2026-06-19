/**
 * screens/HomeScreen.tsx
 *
 * The live home dashboard: equipped pet (floating idle + sage aura), name /
 * stage / level / XP bar, stat cards (streak, workouts, pets), the daily
 * challenge with progress, and the Start Workout CTA. Reloads on focus so it
 * reflects rewards earned after a session.
 */

import { Ionicons } from '@expo/vector-icons';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { REWARDS, type Stage } from '../config/economy';
import { fetchHomeData, type HomeData } from '../lib/game';
import type { RootTabParamList } from '../navigation/types';
import { PetSprite } from '../pets/PetSprite';
import { useAuthStore } from '../state/authStore';
import { colors, radius, spacing, typography } from '../theme';

const NEXT_STAGE: Record<Stage, string> = {
  juvenile: 'Teen',
  teen: 'Adult',
  adult: 'Max',
};

export function HomeScreen() {
  const signOut = useAuthStore((s) => s.signOut);
  const userId = useAuthStore((s) => s.user?.id);
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();

  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!userId) return;
      setError(null);
      fetchHomeData(userId)
        .then((d) => active && setData(d))
        .catch((e) => active && setError(e.message ?? 'Could not load.'));
      return () => {
        active = false;
      };
    }, [userId]),
  );

  const signOutBtn = (
    <Pressable onPress={signOut} hitSlop={10} accessibilityLabel="Sign out" style={styles.signOut}>
      <Ionicons name="log-out-outline" size={22} color={colors.textMuted} />
    </Pressable>
  );

  const pet = data?.pet;
  const title = pet ? `${pet.name} · Lvl ${pet.level}` : 'Buff Buddy';

  return (
    <Screen eyebrow="Workout Pet" title={title} headerRight={signOutBtn}>
      {error ? (
        <Card>
          <Text style={typography.subheading}>Couldn't load your data</Text>
          <Text style={[typography.bodyMuted, { marginTop: spacing.sm }]}>{error}</Text>
        </Card>
      ) : !data ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.sage} />
        </View>
      ) : (
        <>
          <Card style={styles.hero}>
            {pet ? (
              <>
                <Text style={styles.stageLabel}>{pet.stage.toUpperCase()}</Text>
                <PetSprite petId={pet.petId} stage={pet.stage} size={220} showAura float />
                <View style={styles.xpRow}>
                  <Text style={typography.caption}>XP · {pet.progress.current}</Text>
                  <Text style={typography.caption}>Next: {NEXT_STAGE[pet.stage]}</Text>
                </View>
                <View style={styles.xpTrack}>
                  <View style={[styles.xpFill, { width: `${pet.progress.ratio * 100}%` }]} />
                </View>
              </>
            ) : (
              <Text style={typography.bodyMuted}>No pet equipped.</Text>
            )}
          </Card>

          <View style={styles.statRow}>
            <StatCard value={`${data.currentStreak}`} label="Day Streak" />
            <StatCard value={`${data.totalWorkouts}`} label="Workouts" />
            <StatCard value={`${data.petsOwned}`} label="Pets" />
          </View>

          {data.challenge ? (
            <Card style={styles.challenge}>
              <View style={{ flex: 1 }}>
                <Text style={styles.challengeEyebrow}>DAILY CHALLENGE</Text>
                <Text style={typography.subheading}>{data.challenge.title}</Text>
                <View style={styles.challengeTrack}>
                  <View
                    style={[
                      styles.challengeFill,
                      {
                        width: `${Math.min(100, (data.challenge.progress / data.challenge.target) * 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[typography.caption, { marginTop: spacing.xs }]}>
                  {data.challenge.progress}/{data.challenge.target} {data.challenge.unit}
                </Text>
              </View>
              <View style={styles.reward}>
                {data.challenge.completed ? (
                  <Ionicons name="checkmark-circle" size={28} color={colors.sage} />
                ) : (
                  <Text style={styles.rewardText}>+{data.challenge.rewardXp} XP</Text>
                )}
              </View>
            </Card>
          ) : null}

          <Button
            label={`Start Workout   ·   +${REWARDS.workout.xp} XP  +${REWARDS.workout.coins} Coins`}
            onPress={() => navigation.navigate('Workouts')}
            style={{ marginTop: spacing.lg }}
          />
        </>
      )}
    </Screen>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <Card style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label.toUpperCase()}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  signOut: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  loading: {
    paddingTop: spacing.xxxl,
    alignItems: 'center',
  },
  hero: {
    alignItems: 'center',
  },
  stageLabel: {
    ...typography.label,
    color: colors.sage,
    marginBottom: spacing.md,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    marginTop: spacing.md,
  },
  xpTrack: {
    alignSelf: 'stretch',
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: colors.sage,
    borderRadius: radius.pill,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'flex-start',
  },
  statValue: {
    ...typography.title,
  },
  statLabel: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  challenge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  challengeEyebrow: {
    ...typography.label,
    color: colors.purple,
    marginBottom: spacing.xs,
  },
  challengeTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  challengeFill: {
    height: '100%',
    backgroundColor: colors.purple,
    borderRadius: radius.pill,
  },
  reward: {
    marginLeft: spacing.md,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  rewardText: {
    ...typography.label,
    color: colors.sageLight,
  },
});
