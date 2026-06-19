/**
 * screens/HomeScreen.tsx
 *
 * Phase 1: navigable shell with the real layout (equipped-pet hero, stat cards,
 * daily challenge, Start Workout CTA) rendered against placeholder/static data.
 * Real data wiring lands in Phase 4.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { REWARDS } from '../config/economy';
import { PetSprite } from '../pets/PetSprite';
import { colors, radius, spacing, typography } from '../theme';

export function HomeScreen() {
  return (
    <Screen eyebrow="Workout Pet" title="Bear · Lvl 1">
      <Card style={styles.hero}>
        <Text style={styles.stageLabel}>JUVENILE · STAGE 1</Text>
        <PetSprite petId="bear" stage="juvenile" size={220} showAura />
        <View style={styles.xpRow}>
          <Text style={typography.caption}>XP · 0</Text>
          <Text style={typography.caption}>Next: Teen</Text>
        </View>
        <View style={styles.xpTrack}>
          <View style={[styles.xpFill, { width: '0%' }]} />
        </View>
      </Card>

      <View style={styles.statRow}>
        <StatCard value="0" label="Day Streak" />
        <StatCard value="0" label="Workouts" />
        <StatCard value="1" label="Pets" />
      </View>

      <Card style={styles.challenge}>
        <View style={{ flex: 1 }}>
          <Text style={styles.challengeEyebrow}>DAILY CHALLENGE</Text>
          <Text style={typography.subheading}>Complete 1 workout</Text>
        </View>
        <View style={styles.reward}>
          <Text style={styles.rewardText}>+{REWARDS.dailyChallenge.xp} XP</Text>
        </View>
      </Card>

      <Button
        label={`Start Workout   ·   +${REWARDS.workout.xp} XP  +${REWARDS.workout.coins} Coins`}
        onPress={() => {}}
        style={{ marginTop: spacing.lg }}
      />
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
  reward: {
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
