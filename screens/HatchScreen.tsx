/**
 * screens/HatchScreen.tsx
 *
 * Shows the user's unhatched eggs and "how to earn" progress. Tapping the egg
 * runs the hatch sequence (shake -> crack -> flash -> reveal) with Reanimated,
 * resolving the pet from the egg's odds; new pets join the collection,
 * duplicates convert to coins.
 */

import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { EGG_RULES, type EggType } from '../config/economy';
import {
  addTestEggs,
  fetchEggData,
  getNextEggId,
  hatchEgg,
  type EggData,
  type HatchResult,
} from '../lib/game';
import { PetSprite } from '../pets/PetSprite';
import { useAuthStore } from '../state/authStore';
import { colors, radius, rarityColors, spacing, typography } from '../theme';

type Phase = 'idle' | 'hatching' | 'revealed';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function HatchScreen() {
  const userId = useAuthStore((s) => s.user?.id);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const [data, setData] = useState<EggData | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<HatchResult | null>(null);
  const busy = useRef(false);

  // Animation drivers.
  const shake = useSharedValue(0);
  const scale = useSharedValue(1);
  const flash = useSharedValue(0);

  const load = useCallback(() => {
    let active = true;
    if (!userId) return;
    fetchEggData(userId)
      .then((d) => active && setData(d))
      .catch(() => active && setData(null));
    return () => {
      active = false;
    };
  }, [userId]);

  useFocusEffect(load);

  const eggStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shake.value },
      { rotate: `${shake.value * 0.6}deg` },
      { scale: scale.value },
    ],
  }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));

  async function runHatch() {
    if (!userId || !data || data.total === 0 || busy.current) return;
    busy.current = true;
    setResult(null);
    setPhase('hatching');

    // Prefer hatching an epic egg first if present, else standard.
    const type: EggType = data.epic > 0 ? 'epic' : 'standard';
    const eggId = await getNextEggId(userId, type);
    if (!eggId) {
      busy.current = false;
      setPhase('idle');
      return;
    }

    // shake
    shake.value = withRepeat(withTiming(8, { duration: 70, easing: Easing.linear }), 8, true);
    const hatchPromise = hatchEgg(userId, eggId);
    await sleep(700);
    shake.value = withTiming(0, { duration: 60 });

    // crack (pulse)
    scale.value = withSequence(
      withTiming(1.18, { duration: 130 }),
      withTiming(0.92, { duration: 120 }),
      withTiming(1, { duration: 120 }),
    );
    await sleep(420);

    // flash
    flash.value = withSequence(withTiming(1, { duration: 140 }), withTiming(0, { duration: 380 }));

    const res = await hatchPromise;
    await sleep(140);

    if (res.ok) {
      await refreshProfile();
      setResult(res);
      setPhase('revealed');
    } else {
      setPhase('idle');
    }
    busy.current = false;
  }

  function reset() {
    setPhase('idle');
    setResult(null);
    load();
  }

  async function handleAddTestEggs() {
    if (!userId) return;
    await addTestEggs(userId, 10, 'standard');
    load();
  }

  return (
    <Screen eyebrow="Mystery Egg" title="Hatch a new pet">
      {!data ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.sage} />
        </View>
      ) : (
        <>
          <View style={styles.eggStage}>
            <Pressable onPress={runHatch} disabled={data.total === 0 || phase !== 'idle'}>
              <View style={styles.eggWrap}>
                <Svg width={240} height={240} style={StyleSheet.absoluteFill}>
                  <Defs>
                    <RadialGradient id="eggGlow" cx="50%" cy="50%" r="50%">
                      <Stop offset="0%" stopColor={colors.purple} stopOpacity={0.5} />
                      <Stop offset="100%" stopColor={colors.purple} stopOpacity={0} />
                    </RadialGradient>
                  </Defs>
                  <Circle cx={120} cy={120} r={110} fill="url(#eggGlow)" />
                </Svg>
                <Animated.View style={[styles.egg, eggStyle]}>
                  <Svg width={140} height={170}>
                    <Defs>
                      <RadialGradient id="eggBody" cx="50%" cy="38%" r="65%">
                        <Stop offset="0%" stopColor={colors.purple} stopOpacity={0.95} />
                        <Stop offset="100%" stopColor="#5B3FB0" stopOpacity={1} />
                      </RadialGradient>
                    </Defs>
                    <Circle cx={70} cy={95} r={64} fill="url(#eggBody)" />
                    <Circle cx={70} cy={70} r={64} fill="url(#eggBody)" />
                  </Svg>
                </Animated.View>
              </View>
            </Pressable>

            {data.total > 0 ? (
              <Text style={[typography.body, { marginTop: spacing.md }]}>
                {phase === 'hatching'
                  ? 'Hatching…'
                  : `Tap to hatch  ·  ${data.total} egg${data.total === 1 ? '' : 's'}`}
              </Text>
            ) : (
              <Text style={[typography.bodyMuted, { marginTop: spacing.md }]}>
                Complete workouts to earn eggs.
              </Text>
            )}
            {data.epic > 0 ? (
              <Text style={[typography.caption, { color: colors.purple, marginTop: 2 }]}>
                {data.epic} epic · {data.standard} standard
              </Text>
            ) : null}
          </View>

          <Card>
            <Text style={[typography.label, { marginBottom: spacing.md }]}>HOW TO EARN EGGS</Text>
            <Rule
              label={`${EGG_RULES.streakForStandardEgg}-Day Streak`}
              value={`${Math.min(data.currentStreak, EGG_RULES.streakForStandardEgg)}/${EGG_RULES.streakForStandardEgg}`}
            />
            <Rule
              label={`Weekly Goal · ${data.weeklyTarget} workouts`}
              value={`${Math.min(data.workoutsThisWeek, data.weeklyTarget)}/${data.weeklyTarget}`}
            />
            <Rule
              label={`${EGG_RULES.streakForEpicEgg}-Day Streak`}
              value="EPIC EGG"
              last
            />
          </Card>

          {__DEV__ ? (
            <Button
              label="＋ Add 10 eggs (testing)"
              variant="ghost"
              onPress={handleAddTestEggs}
              style={{ marginTop: spacing.lg }}
            />
          ) : null}
        </>
      )}

      {/* Flash overlay */}
      {phase !== 'idle' ? (
        <Animated.View pointerEvents="none" style={[styles.flash, flashStyle]} />
      ) : null}

      {/* Reveal */}
      {phase === 'revealed' && result ? (
        <Animated.View entering={FadeIn} style={styles.revealOverlay}>
          <Animated.View entering={ZoomIn.springify().damping(14)} style={{ alignSelf: 'stretch' }}>
            <Card style={styles.revealCard}>
              <Text
                style={[
                  styles.revealTag,
                  { color: result.isDuplicate ? colors.gold : colors.sage },
                ]}
              >
                {result.isDuplicate ? 'DUPLICATE' : 'NEW!'}
              </Text>
              <PetSprite petId={result.petId} stage="juvenile" size={200} showAura />
              <Text style={[typography.title, { marginTop: spacing.sm }]}>{result.petName}</Text>
              <View style={[styles.rarityPill, { borderColor: rarityColors[result.rarity] }]}>
                <Text style={[styles.rarityText, { color: rarityColors[result.rarity] }]}>
                  {result.rarity.toUpperCase()}
                </Text>
              </View>
              {result.isDuplicate ? (
                <Text style={[styles.dupText, { color: colors.gold }]}>
                  Already owned — converted to +{result.coins} coins
                </Text>
              ) : (
                <Text style={[typography.bodyMuted, { marginTop: spacing.md }]}>
                  Added to your collection!
                </Text>
              )}
              <Button
                label="Awesome"
                onPress={reset}
                style={{ alignSelf: 'stretch', marginTop: spacing.lg }}
              />
            </Card>
          </Animated.View>
        </Animated.View>
      ) : null}
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
  center: {
    paddingTop: spacing.xxxl,
    alignItems: 'center',
  },
  eggStage: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  eggWrap: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  egg: {
    alignItems: 'center',
    justifyContent: 'center',
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
  flash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
  },
  revealOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  revealCard: {
    alignItems: 'center',
    alignSelf: 'stretch',
    padding: spacing.xl,
  },
  revealTag: {
    ...typography.label,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  rarityPill: {
    marginTop: spacing.sm,
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
  },
  rarityText: {
    ...typography.caption,
    fontWeight: '800',
  },
  dupText: {
    ...typography.body,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
