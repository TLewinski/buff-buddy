/**
 * screens/HatchScreen.tsx
 *
 * Phase 1: egg shell + "how to earn" rules from config. The hatch sequence
 * (shake -> crack -> flash -> reveal) and earning logic land in Phase 6.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { EGG_RULES } from '../config/economy';
import { colors, radius, spacing, typography } from '../theme';

export function HatchScreen() {
  return (
    <Screen eyebrow="Mystery Egg" title="Hatch a new pet">
      <View style={styles.eggStage}>
        <Svg width={240} height={240}>
          <Defs>
            <RadialGradient id="eggGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.purple} stopOpacity={0.5} />
              <Stop offset="100%" stopColor={colors.purple} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="eggBody" cx="50%" cy="40%" r="65%">
              <Stop offset="0%" stopColor={colors.purple} stopOpacity={0.95} />
              <Stop offset="100%" stopColor="#5B3FB0" stopOpacity={1} />
            </RadialGradient>
          </Defs>
          <Circle cx={120} cy={120} r={110} fill="url(#eggGlow)" />
          <Circle cx={120} cy={120} r={62} fill="url(#eggBody)" />
        </Svg>
        <Text style={[typography.bodyMuted, { marginTop: spacing.md }]}>
          Complete workouts to earn eggs.
        </Text>
      </View>

      <Card>
        <Text style={[typography.label, { marginBottom: spacing.md }]}>HOW TO EARN EGGS</Text>
        <Rule
          label={`${EGG_RULES.streakForStandardEgg}-Day Streak`}
          value={`0/${EGG_RULES.streakForStandardEgg}`}
        />
        <Rule
          label={`Weekly Goal · ${EGG_RULES.workoutsPerWeekForEgg} workouts`}
          value={`0/${EGG_RULES.workoutsPerWeekForEgg}`}
        />
        <Rule
          label={`${EGG_RULES.streakForEpicEgg}-Day Streak`}
          value="EPIC EGG"
          last
        />
      </Card>
    </Screen>
  );
}

function Rule({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.rule, !last && styles.ruleBorder]}>
      <Text style={typography.body}>{label}</Text>
      <Text style={[typography.label, { color: colors.sage }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  eggStage: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  rule: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  ruleBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
