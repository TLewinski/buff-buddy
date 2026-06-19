/**
 * screens/PetsScreen.tsx
 *
 * Phase 1: collection grid shell driven by the pet registry. Owned vs.
 * locked-silhouette state, detail, and equip land in Phase 5.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { PETS } from '../pets/registry';
import { PetSprite } from '../pets/PetSprite';
import { colors, radius, rarityColors, spacing, typography } from '../theme';

// Phase 1 placeholder: only the starter bear is "owned".
const OWNED = new Set(['bear']);

export function PetsScreen() {
  const pets = Object.values(PETS);
  return (
    <Screen eyebrow="Your Collection" title="Pets">
      <Text style={styles.count}>COLLECTION · {OWNED.size}/{pets.length}</Text>
      <View style={styles.grid}>
        {pets.map((pet) => {
          const owned = OWNED.has(pet.id);
          return (
            <Card key={pet.id} style={styles.cell} padded={false}>
              <View style={styles.cellInner}>
                {owned ? (
                  <PetSprite petId={pet.id} stage="juvenile" size={84} />
                ) : (
                  <View style={styles.locked}>
                    <Text style={styles.lockedMark}>?</Text>
                  </View>
                )}
                <Text style={[typography.caption, styles.rarity, { color: rarityColors[pet.rarity] }]}>
                  {pet.rarity.toUpperCase()}
                </Text>
              </View>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  rarity: {
    marginTop: spacing.sm,
  },
});
