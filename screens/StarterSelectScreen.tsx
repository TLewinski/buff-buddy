/**
 * screens/StarterSelectScreen.tsx
 *
 * First-run onboarding: pick a starter pet (Bear / Gorilla / Turtle). Creates
 * the user_pets row + sets it as equipped, then the auth store refreshes and
 * the app gate swaps to the main tabs.
 */

import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { grantStarter } from '../lib/game';
import { PETS, STARTER_PET_IDS } from '../pets/registry';
import { PetSprite } from '../pets/PetSprite';
import { useAuthStore } from '../state/authStore';
import { colors, radius, spacing, typography } from '../theme';

export function StarterSelectScreen() {
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.id);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const [selected, setSelected] = useState(STARTER_PET_IDS[0]);
  const [submitting, setSubmitting] = useState(false);

  const pet = PETS[selected];

  async function confirm() {
    if (!userId) return;
    setSubmitting(true);
    const result = await grantStarter(userId, selected);
    setSubmitting(false);
    if (!result.ok) {
      Alert.alert('Could not pick your buddy', result.error ?? 'Please try again.');
      return;
    }
    await refreshProfile();
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.xl }]}>
      <Text style={styles.eyebrow}>CHOOSE YOUR COMPANION</Text>
      <Text style={styles.title}>Pick your starter pet</Text>
      <Text style={styles.subtitle}>They'll grow stronger with every workout you complete.</Text>

      <Card style={styles.hero}>
        <PetSprite petId={pet.id} stage="juvenile" size={220} showAura float />
        <Text style={[typography.heading, { marginTop: spacing.sm }]}>{pet.name}</Text>
        <Text style={[typography.bodyMuted, { marginTop: spacing.xs, textAlign: 'center' }]}>
          {pet.blurb}
        </Text>
      </Card>

      <View style={styles.choices}>
        {STARTER_PET_IDS.map((id) => {
          const isSel = id === selected;
          return (
            <Pressable
              key={id}
              onPress={() => setSelected(id)}
              style={[styles.choice, isSel && styles.choiceActive]}
            >
              <PetSprite petId={id} stage="juvenile" size={56} />
              <Text style={[styles.choiceName, isSel && { color: colors.sage }]}>
                {PETS[id].name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Button
        label={submitting ? 'Summoning…' : "Let's go"}
        onPress={confirm}
        disabled={submitting}
        style={{ marginTop: 'auto', marginBottom: insets.bottom + spacing.lg }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  eyebrow: {
    ...typography.label,
    color: colors.sage,
  },
  title: {
    ...typography.title,
    marginTop: spacing.xs,
  },
  subtitle: {
    ...typography.bodyMuted,
    marginTop: spacing.sm,
  },
  hero: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  choices: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  choice: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  choiceActive: {
    borderColor: colors.sage,
    backgroundColor: colors.surfaceRaised,
  },
  choiceName: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
