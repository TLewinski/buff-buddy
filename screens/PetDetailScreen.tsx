/**
 * screens/PetDetailScreen.tsx
 *
 * Detail for a single pet: hero sprite, rarity, stage, level + XP bar, and an
 * Equip action (owned + not already equipped). Unowned pets show a locked
 * state with how-to-obtain copy.
 */

import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import type { Stage } from '../config/economy';
import { equipPet, fetchPetDetail, type CollectionPet } from '../lib/game';
import type { RootStackParamList } from '../navigation/types';
import { PetSprite } from '../pets/PetSprite';
import { useAuthStore } from '../state/authStore';
import { colors, radius, rarityColors, spacing, typography } from '../theme';

type DetailRoute = RouteProp<RootStackParamList, 'PetDetail'>;

const STAGE_LABEL: Record<Stage, string> = {
  juvenile: 'Juvenile',
  teen: 'Teen',
  adult: 'Adult',
};

export function PetDetailScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<DetailRoute>();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.id);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const [pet, setPet] = useState<CollectionPet | null>(null);
  const [loading, setLoading] = useState(true);
  const [equipping, setEquipping] = useState(false);

  const load = useCallback(() => {
    let active = true;
    if (!userId) return;
    fetchPetDetail(userId, params.petId)
      .then((p) => {
        if (!active) return;
        setPet(p);
        setLoading(false);
      })
      .catch(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [userId, params.petId]);

  useFocusEffect(load);

  async function handleEquip() {
    if (!userId || !pet) return;
    setEquipping(true);
    const result = await equipPet(userId, pet.petId);
    setEquipping(false);
    if (!result.ok) {
      Alert.alert('Could not equip', result.error ?? 'Please try again.');
      return;
    }
    await refreshProfile();
    setPet({ ...pet, equipped: true });
  }

  const tint = pet ? rarityColors[pet.rarity as never] : colors.sage;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={typography.heading}>{pet?.owned ? pet.name : 'Locked'}</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.sage} />
        </View>
      ) : !pet ? (
        <View style={styles.center}>
          <Text style={typography.bodyMuted}>Pet not found.</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <Card style={styles.hero}>
            {pet.owned ? (
              <PetSprite petId={pet.petId} stage={pet.stage ?? 'juvenile'} size={240} showAura float />
            ) : (
              <View style={styles.lockedHero}>
                <Ionicons name="lock-closed" size={48} color={colors.textFaint} />
              </View>
            )}
            <View style={[styles.rarityPill, { borderColor: tint }]}>
              <Text style={[styles.rarityText, { color: tint }]}>{pet.rarity.toUpperCase()}</Text>
            </View>
            <Text style={[typography.title, { marginTop: spacing.md }]}>
              {pet.owned ? pet.name : '???'}
            </Text>
            <Text style={[typography.bodyMuted, styles.blurb]}>
              {pet.owned ? pet.blurb : 'Hatch eggs to discover this pet.'}
            </Text>
          </Card>

          {pet.owned && pet.stage && pet.progress ? (
            <Card style={styles.statsCard}>
              <View style={styles.statRow}>
                <Stat label="Stage" value={STAGE_LABEL[pet.stage]} />
                <Stat label="Level" value={`${pet.level}`} />
              </View>
              <View style={styles.xpRow}>
                <Text style={typography.caption}>XP · {pet.progress.current}</Text>
                <Text style={typography.caption}>{pet.progress.needed} to next level</Text>
              </View>
              <View style={styles.xpTrack}>
                <View style={[styles.xpFill, { width: `${pet.progress.ratio * 100}%` }]} />
              </View>
            </Card>
          ) : null}

          <View style={styles.footer}>
            {pet.owned ? (
              <Button
                label={pet.equipped ? 'Equipped' : equipping ? 'Equipping…' : 'Equip'}
                onPress={handleEquip}
                disabled={pet.equipped || equipping}
              />
            ) : (
              <Button label="Locked" variant="secondary" disabled />
            )}
          </View>
        </View>
      )}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={typography.label}>{label.toUpperCase()}</Text>
      <Text style={[typography.heading, { marginTop: spacing.xs }]}>{value}</Text>
    </View>
  );
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
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: spacing.xl,
  },
  hero: {
    alignItems: 'center',
  },
  lockedHero: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
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
  blurb: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  statsCard: {
    marginTop: spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  xpTrack: {
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
  footer: {
    marginTop: 'auto',
    paddingBottom: spacing.lg,
  },
});
