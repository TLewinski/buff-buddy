/**
 * screens/PetsScreen.tsx
 *
 * Collection grid: every registry pet shown as owned (sprite + level + rarity,
 * with an ACTIVE badge for the equipped one) or a locked silhouette. Tap a pet
 * for its detail screen.
 */

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { fetchCollection, type Collection, type CollectionPet } from '../lib/game';
import type { RootStackParamList } from '../navigation/types';
import { PetSprite } from '../pets/PetSprite';
import { useAuthStore } from '../state/authStore';
import { colors, radius, rarityColors, spacing, typography } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function PetsScreen() {
  const navigation = useNavigation<Nav>();
  const userId = useAuthStore((s) => s.user?.id);
  const [collection, setCollection] = useState<Collection | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!userId) return;
      fetchCollection(userId)
        .then((c) => active && setCollection(c))
        .catch(() => active && setCollection(null));
      return () => {
        active = false;
      };
    }, [userId]),
  );

  return (
    <Screen eyebrow="Your Collection" title="Pets">
      {!collection ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.sage} />
        </View>
      ) : (
        <>
          <Text style={styles.count}>
            COLLECTION · {collection.ownedCount}/{collection.total}
          </Text>
          <View style={styles.grid}>
            {collection.pets.map((pet) => (
              <PetCell
                key={pet.petId}
                pet={pet}
                onPress={() => navigation.navigate('PetDetail', { petId: pet.petId })}
              />
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

function PetCell({ pet, onPress }: { pet: CollectionPet; onPress: () => void }) {
  return (
    <Pressable style={styles.cell} onPress={onPress}>
      <Card style={[styles.cellCard, pet.equipped && styles.cellActive]} padded={false}>
        {pet.equipped ? (
          <View style={styles.activeBadge}>
            <Text style={styles.activeText}>ACTIVE</Text>
          </View>
        ) : null}
        <View style={styles.cellInner}>
          {pet.owned ? (
            <PetSprite petId={pet.petId} stage={pet.stage ?? 'juvenile'} size={84} />
          ) : (
            <View style={styles.locked}>
              <Text style={styles.lockedMark}>?</Text>
            </View>
          )}
          <Text style={styles.cellName}>
            {pet.owned ? `${pet.name}  ·  Lv ${pet.level}` : '???'}
          </Text>
          <Text style={[typography.caption, { color: rarityColors[pet.rarity as never] }]}>
            {pet.rarity.toUpperCase()}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loading: {
    paddingTop: spacing.xxxl,
    alignItems: 'center',
  },
  count: {
    ...typography.label,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  cell: {
    width: '47%',
  },
  cellCard: {
    overflow: 'hidden',
  },
  cellActive: {
    borderColor: colors.sage,
    borderWidth: 1.5,
  },
  activeBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    zIndex: 1,
    backgroundColor: colors.sage,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  activeText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '800',
  },
  cellInner: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  locked: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedMark: {
    ...typography.title,
    color: colors.textFaint,
  },
  cellName: {
    ...typography.label,
    color: colors.text,
    marginTop: spacing.sm,
  },
});
